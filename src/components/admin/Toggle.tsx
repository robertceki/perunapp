type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export default function Toggle({
  value,
  onChange,
  disabled = false,
}: ToggleProps) {
  return (
    <button
      aria-checked={value}
      className={`relative inline-flex h-[28px] w-[46px] shrink-0 rounded-chip transition-colors ${
        value ? "bg-burgundy" : "bg-[#DDD3C7]"
      } disabled:opacity-50`}
      disabled={disabled}
      onClick={() => onChange(!value)}
      role="switch"
      type="button"
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-surface transition-transform ${
          value ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
