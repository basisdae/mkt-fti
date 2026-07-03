import { cn } from "@/lib/utils";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  description?: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  id,
  description,
}: CheckboxProps) {
  const checkboxId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
        checked
          ? "border-primary/30 bg-light-purple/50"
          : "border-gray-100 bg-gray-50/60 hover:bg-gray-50",
      )}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary"
      />
      <div>
        <span className="text-sm font-medium text-gray-800">{label}</span>
        {description && (
          <p className="mt-0.5 text-xs text-gray-400">{description}</p>
        )}
      </div>
    </label>
  );
}
