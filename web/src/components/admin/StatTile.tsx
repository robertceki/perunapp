type StatTileProps = {
  figure: string;
  label: string;
  figureColor?: string;
  delta?: string;
  deltaColor?: string;
};

export default function StatTile({
  figure,
  label,
  figureColor = "text-ink",
  delta,
  deltaColor = "text-sage",
}: StatTileProps) {
  return (
    <article className="h-full rounded-[18px] border border-border bg-surface p-4 shadow-sm">
      <p className={`font-display text-[26px] font-extrabold ${figureColor}`}>
        {figure}
      </p>
      <p className="mt-1 text-[11.5px] font-semibold text-ink-muted">{label}</p>
      {delta && (
        <p className={`mt-1 text-[11px] font-bold ${deltaColor}`}>{delta}</p>
      )}
    </article>
  );
}
