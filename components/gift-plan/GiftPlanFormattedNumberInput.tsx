"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/forms/Input";
import {
  formatGiftPlanNumberInput,
  parseGiftPlanNumber,
} from "@/lib/gift-plan-number-field";

interface GiftPlanFormattedNumberInputProps {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  maxFractionDigits?: number;
  placeholder?: string;
  className?: string;
}

export function GiftPlanFormattedNumberInput({
  label,
  hint,
  value,
  onChange,
  maxFractionDigits = 4,
  placeholder,
  className,
}: GiftPlanFormattedNumberInputProps) {
  const [text, setText] = useState(() =>
    formatGiftPlanNumberInput(value, { maxFractionDigits }),
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    setText(formatGiftPlanNumberInput(value, { maxFractionDigits }));
  }, [value, focused, maxFractionDigits]);

  return (
    <Input
      label={label}
      hint={hint}
      inputMode="decimal"
      placeholder={placeholder}
      className={className}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const parsed = parseGiftPlanNumber(text);
        onChange(parsed);
        setText(formatGiftPlanNumberInput(parsed, { maxFractionDigits }));
      }}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        const parsed = parseGiftPlanNumber(next);
        if (next.trim() === "" || parsed != null) {
          onChange(parsed);
        }
      }}
    />
  );
}
