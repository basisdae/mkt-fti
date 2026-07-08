/** Shared keyboard shortcut definitions (UI only). */

export interface ShortcutDefinition {
  keys: string;
  action: string;
  scope?: string;
}

export const KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  { keys: "Ctrl / ⌘ + K", action: "Open global search" },
  { keys: "N", action: "New product" },
  { keys: "S", action: "Save (product form)" },
  { keys: "Esc", action: "Close dialog / palette" },
  { keys: "←", action: "Previous product" },
  { keys: "→", action: "Next product" },
  { keys: "?", action: "Show keyboard shortcuts" },
];

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

export function isModKey(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}
