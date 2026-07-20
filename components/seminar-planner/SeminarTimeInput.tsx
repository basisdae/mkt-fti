"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Clock } from "lucide-react";
import {
  normalizeTimeInput,
  parseFlexibleTimeInput,
  shiftTimeInputValue,
} from "@/lib/seminar-planner-time";
import { cn } from "@/lib/utils";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

interface SeminarTimeInputProps {
  label?: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  "data-agenda-no-drag"?: boolean;
}

export function SeminarTimeInput({
  label,
  value,
  onChange,
  disabled = false,
  className,
  id,
  ...rest
}: SeminarTimeInputProps) {
  const autoId = useId();
  const inputId = id ?? (label ? `${autoId}-time` : autoId);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const committed = normalizeTimeInput(value);
  const [draft, setDraft] = useState(committed);
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(committed);
    }
  }, [committed, focused]);

  const commitDraft = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        onChange(null);
        setDraft("");
        return;
      }
      const parsed = parseFlexibleTimeInput(trimmed);
      if (parsed) {
        onChange(parsed);
        setDraft(parsed);
        return;
      }
      setDraft(committed);
    },
    [committed, onChange],
  );

  const displayValue = focused ? draft : committed;

  const parsedMinutes = parseFlexibleTimeInput(displayValue);
  const [pickerHour, pickerMinute] = (parsedMinutes ?? committed ?? "00:00").split(
    ":",
  );

  useEffect(() => {
    if (!pickerOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [pickerOpen]);

  function handlePickerChange(nextHour: string, nextMinute: string) {
    const next = `${nextHour}:${nextMinute}`;
    onChange(next);
    setDraft(next);
    setPickerOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const base = focused ? draft : committed;
      const parsed = parseFlexibleTimeInput(base) ?? committed;
      const shifted = shiftTimeInputValue(
        parsed,
        event.shiftKey ? 60 : 1,
      );
      if (shifted) {
        onChange(shifted);
        setDraft(shifted);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const base = focused ? draft : committed;
      const parsed = parseFlexibleTimeInput(base) ?? committed;
      const shifted = shiftTimeInputValue(
        parsed,
        event.shiftKey ? -60 : -1,
      );
      if (shifted) {
        onChange(shifted);
        setDraft(shifted);
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft(draft);
      inputRef.current?.blur();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(committed);
      setPickerOpen(false);
      inputRef.current?.blur();
    }
  }

  const field = (
    <div
      ref={rootRef}
      className={cn(
        "relative flex min-h-[42px] items-center rounded-xl border border-gray-200 bg-white transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        disabled && "cursor-not-allowed bg-gray-50 opacity-70",
        className,
      )}
      {...rest}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder="HH:mm"
        aria-label={label}
        value={displayValue}
        onFocus={() => {
          setFocused(true);
          setDraft(committed);
        }}
        onBlur={() => {
          setFocused(false);
          commitDraft(draft);
          setPickerOpen(false);
        }}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d:]/g, "").slice(0, 5);
          setDraft(next);
        }}
        onKeyDown={handleKeyDown}
        className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-4 pr-2 text-sm tabular-nums text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
      />

      {!disabled ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="เลือกเวลา"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((open) => !open)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <Clock className="h-4 w-4" />
        </button>
      ) : null}

      <span
        className="shrink-0 pr-3 text-sm font-medium text-gray-600"
        aria-hidden
      >
        น.
      </span>

      {pickerOpen && !disabled ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-full min-w-[220px] rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-500">ชั่วโมง</span>
              <select
                value={pickerHour}
                onChange={(event) =>
                  handlePickerChange(event.target.value, pickerMinute)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {HOUR_OPTIONS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-gray-500">นาที</span>
              <select
                value={pickerMinute}
                onChange={(event) =>
                  handlePickerChange(pickerHour, event.target.value)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {MINUTE_OPTIONS.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (!label) return field;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {field}
    </div>
  );
}
