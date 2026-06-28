type FilterChipsProps<Key extends string> = {
  options: readonly { key: Key; label: string }[];
  value: Key;
  onChange: (key: Key) => void;
};

export default function FilterChips<Key extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<Key>) {
  return (
    <div className="flex flex-nowrap gap-2">
      {options.map((option) => {
        const active = option.key === value;

        return (
          <button
            aria-pressed={active}
            className={`shrink-0 rounded-chip border px-3 py-1.5 text-xs font-bold ${
              active
                ? "border-burgundy bg-burgundy text-surface"
                : "border-field-border bg-surface text-ink"
            }`}
            key={option.key}
            onClick={() => onChange(option.key)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
