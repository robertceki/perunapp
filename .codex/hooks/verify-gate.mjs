import { appendFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const blockedReason = 'blocked: verification incomplete (Karpathy Layer 2). No fresh .claude/.verify-pass marker (< 60 min). State the DoD, run the required verification, and record its actual results before commit/push. A marker alone is not proof of completion.';

export function deny(reason) {
  return { hookSpecificOutput: { hookEventName: 'PreToolUse',
    permissionDecision: 'deny', permissionDecisionReason: reason } };
}

export function evaluateGate(payload, { root = repositoryRoot, now = Date.now() } = {}) {
  const input = payload?.tool_input;
  // Codex normalizes shell tools to Bash/command; also accept native cmd payloads.
  const rawCommand = input?.command ?? input?.cmd;
  const command = Array.isArray(rawCommand) && rawCommand.every((part) => typeof part === 'string')
    ? rawCommand.join(' ') : rawCommand;
  if (typeof command !== 'string') return { systemMessage: 'Perun gate: unrecognized shell payload; verification gate could not inspect this call (legacy fail-open behavior).' };
  // Preserve the existing literal substring contract; this is not a shell parser.
  if (!command.includes('git commit') && !command.includes('git push')) return null;
  if (command.includes('[skip-verify]')) {
    try {
      appendFileSync(resolve(root, '.claude/.verify-log'),
        `${new Date(now).toISOString()} skip-verify: ${command}\n`, 'utf8');
    } catch (error) {
      return { systemMessage: `Perun gate: bypass log failed: ${error.message}. Command allowed under legacy fail-open behavior.` };
    }
    return null;
  }
  try {
    const marker = statSync(resolve(root, '.claude/.verify-pass'));
    if (marker.isFile() && now - marker.mtimeMs < 60 * 60 * 1000) return null;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return deny(blockedReason);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdin.setEncoding('utf8');
    let text = '';
    for await (const chunk of process.stdin) text += chunk;
    const result = evaluateGate(JSON.parse(text));
    if (result) console.log(JSON.stringify(result));
  } catch (error) {
    // Preserve legacy error fall-through, but make missing enforcement visible.
    console.log(JSON.stringify({ systemMessage: `Perun gate error: ${error.message}. Call not blocked (legacy fail-open behavior).` }));
  }
}
