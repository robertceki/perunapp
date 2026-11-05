// Setup: npm.cmd install --prefix node_modules/.cache/perun-db-verification --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.5.15
// Run: node --test supabase/tests/leave_session.test.mjs
// Isolated reconstructed fixture, not a representation of live database policies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const modulePath = process.env.PGLITE_MODULE || 'node_modules/.cache/perun-db-verification/node_modules/@electric-sql/pglite/dist/index.js';
const { PGlite } = await import(pathToFileURL(resolve(modulePath)).href);
const migration = await readFile(new URL('../migrations/20261105120000_leave_session_cutoff.sql', import.meta.url), 'utf8');
const session = '10000000-0000-0000-0000-000000000001';
const owner = '20000000-0000-0000-0000-000000000001';
const other = '20000000-0000-0000-0000-000000000002';

async function fixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    create table public.sessions (id uuid primary key, day_of_week text, "time" text);
    create table public.session_participants (session_id uuid, user_id uuid);
    alter table public.session_participants enable row level security;
    create policy legacy_own_delete on public.session_participants for delete to authenticated using (user_id = auth.uid());
    grant select, delete on public.session_participants to authenticated;
    grant select, delete on public.session_participants to service_role;
  `);
  await db.exec(migration);
  return db;
}
async function seed(db, day, time) {
  await db.query('insert into public.sessions values ($1,$2,$3)', [session, day, time]);
  await db.query('insert into public.session_participants values ($1,$2)', [session, owner]);
}
async function identity(db, uid = owner) {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
}
async function count(db) {
  await db.exec('reset role');
  return Number((await db.query('select count(*) as n from public.session_participants where user_id = $1', [owner])).rows[0].n);
}
async function rejected(db, pattern) {
  await assert.rejects(db.query('select public.leave_session($1)', [session]), pattern);
  assert.equal(await count(db), 1);
}
async function syntheticClock(db, instant) {
  // Fixture-only substitution: production migration and its clock remain untouched.
  assert.equal((migration.match(/clock_timestamp\(\)/g) || []).length, 1);
  await db.exec(migration.replace('clock_timestamp()', `'${instant}'::timestamptz`));
}

test('actual migration with database clock: future and elapsed bookings', async () => {
  const db = await fixture();
  try {
    const now = (await db.query(`select extract(dow from clock_timestamp() at time zone 'Europe/Belgrade')::int as d`)).rows[0].d;
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    // Same local day, next midnight is always future; yesterday is always elapsed.
    await seed(db, days[now], '24:00');
    await identity(db);
    await db.query('select public.leave_session($1)', [session]);
    assert.equal(await count(db), 0);
    await db.exec('delete from public.sessions');
    // A past time on the same day is robust except the first second of the day.
    await seed(db, days[now], '00:00');
    await identity(db);
    await rejected(db, /session_started/);
  } finally { await db.close(); }
});

test('identity, privilege and privileged cleanup under actual migration', async () => {
  const db = await fixture();
  try {
    await seed(db, 'saturday', '23:59');
    await db.exec('set role anon');
    await rejected(db, /permission denied/);
    await identity(db, '');
    await rejected(db, /not_authenticated/);
    await identity(db, other);
    await db.query('select public.leave_session($1)', [session]);
    assert.equal(await count(db), 1);
    await identity(db);
    await assert.rejects(db.query('delete from public.session_participants where session_id = $1', [session]), /permission denied/);
    assert.equal(await count(db), 1);
    await db.exec('set role service_role');
    await db.query('delete from public.session_participants where session_id = $1', [session]);
    assert.equal(await count(db), 0);
    await db.query('insert into public.session_participants values ($1,$2)', [session, owner]);
    await db.query('delete from public.session_participants where session_id = $1', [session]);
    assert.equal(await count(db), 0);
  } finally { await db.close(); }
});

test('synthetic clock: Sunday cycle, all weekdays, timezone offsets and equality', async () => {
  const db = await fixture();
  try {
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    for (const zone of ['UTC', 'America/Los_Angeles']) {
    await db.exec(`set time zone '${zone}'`);
    for (let i = 0; i < days.length; i++) {
      await syntheticClock(db, '2026-01-07 11:00:00+00'); // Wednesday 12:00 Belgrade
      await seed(db, days[i], '12:00');
      await identity(db);
      if (i <= 3) await rejected(db, /session_started/);
      else { await db.query('select public.leave_session($1)', [session]); assert.equal(await count(db), 0); }
      await db.exec('delete from public.session_participants; delete from public.sessions');
    }
    for (const [instant, day, time, fails] of [
      ['2026-01-07 10:59:59+00','wednesday','12:00',false],
      ['2026-01-07 11:00:00+00','wednesday','12:00',true],
      ['2026-01-07 11:00:01+00','wednesday','12:00',true],
      ['2026-01-03 22:59:59+00','sunday','00:00',true], // Saturday 23:59:59 local, previous Sunday
      ['2026-01-03 23:00:00+00','sunday','00:00',true], // exact new Sunday
      ['2026-01-03 23:00:00+00','sunday','00:01',false],
      ['2026-07-04 22:00:00+00','sunday','00:00',true], // summer UTC Saturday, local Sunday
      ['2026-07-04 21:59:59+00','saturday','23:59',true],
      ['2026-07-04 22:00:00+00','sunday','00:01',false],
    ]) {
      await syntheticClock(db, instant);
      await seed(db, day, time);
      await identity(db);
      if (fails) await rejected(db, /session_started/);
      else { await db.query('select public.leave_session($1)', [session]); assert.equal(await count(db), 0); }
      await db.exec('delete from public.session_participants; delete from public.sessions');
    }
    }
    for (const [day, time, error] of [['noday','12:00',/invalid_session_schedule/], ['monday','bad',/invalid input syntax/], ['monday',null,/invalid_session_schedule/]]) {
      await seed(db, day, time); await identity(db); await rejected(db, error);
      await db.exec('delete from public.session_participants; delete from public.sessions');
    }
  } finally { await db.close(); }
});
