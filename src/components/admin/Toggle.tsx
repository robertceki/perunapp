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
      className={`relative h-[27px] w-[46px] rounded-chip transition-colors ${
        value ? "bg-burgundy" : "bg-[#DDD3C7]"
      } disabled:opacity-50`}
      disabled={disabled}
      onClick={() => onChange(!value)}
      role="switch"
      type="button"
    >
      <span
        className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-surface transition-transform ${
          value ? "translate-x-[19px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
