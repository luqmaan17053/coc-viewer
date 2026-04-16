"use client";

interface HashInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  /** Extra className applied to the <input> element */
  inputClassName?: string;
  /** className for the # prefix span. Defaults to using --text-muted CSS var. */
  prefixClassName?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  required?: boolean;
}

export default function HashInput({
  value,
  onChange,
  placeholder = "ABC123XYZ",
  inputClassName = "",
  prefixClassName,
  autoFocus,
  autoComplete = "off",
  required,
}: HashInputProps) {
  // Always strip leading # from the display value so we never show ##
  const display = value.replace(/^#+/, "");

  return (
    <div className="relative flex items-center min-w-0">
      <span
        className={`absolute left-3 font-mono pointer-events-none select-none z-10 ${prefixClassName ?? ""}`}
        style={prefixClassName ? undefined : { color: "var(--text-muted)" }}
      >
        #
      </span>
      <input
        type="text"
        value={display}
        onChange={(e) => onChange(e.target.value.replace(/^#+/, ""))}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        required={required}
        className={inputClassName}
        style={{ paddingLeft: "1.75rem" }}
      />
    </div>
  );
}
