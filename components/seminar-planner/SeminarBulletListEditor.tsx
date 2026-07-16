"use client";

import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import {
  duplicateBullets,
  normalizeBullets,
  reorderBullets,
  type BulletItem,
} from "@/lib/seminar-planner-bullets";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";

interface SeminarBulletListEditorProps {
  label: string;
  bullets: BulletItem[];
  disabled?: boolean;
  onChange: (bullets: BulletItem[]) => void;
}

function newBullet(text = ""): BulletItem {
  return {
    id: crypto.randomUUID(),
    text,
    sort_order: 0,
  };
}

export function SeminarBulletListEditor({
  label,
  bullets,
  disabled = false,
  onChange,
}: SeminarBulletListEditorProps) {
  const items = normalizeBullets(bullets);

  function update(next: BulletItem[]) {
    onChange(reorderBullets(next));
  }

  function handleTextChange(id: string, text: string) {
    update(items.map((b) => (b.id === id ? { ...b, text } : b)));
  }

  function handleAdd() {
    update([...items, newBullet()]);
  }

  function handleDelete(id: string) {
    update(items.filter((b) => b.id !== id));
  }

  function handleDuplicate(id: string) {
    const source = items.find((b) => b.id === id);
    if (!source) return;
    const copy = duplicateBullets([source])[0];
    const index = items.findIndex((b) => b.id === id);
    const next = [...items];
    next.splice(index + 1, 0, copy);
    update(next);
  }

  function handleMove(id: string, direction: -1 | 1) {
    const index = items.findIndex((b) => b.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    update(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          {t.addBullet}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-gray-400">—</p>
      ) : (
        <ul className="space-y-2">
          {items.map((bullet, index) => (
            <li
              key={bullet.id}
              className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-2"
            >
              <span className="mt-2.5 w-5 shrink-0 text-center text-xs text-gray-400">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Input
                  value={bullet.text}
                  onChange={(e) => handleTextChange(bullet.id, e.target.value)}
                  placeholder={t.bulletPlaceholder}
                  disabled={disabled}
                />
              </div>
              <div className="flex shrink-0 flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={disabled || index === 0}
                  onClick={() => handleMove(bullet.id, -1)}
                  aria-label={t.moveUp}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={disabled || index === items.length - 1}
                  onClick={() => handleMove(bullet.id, 1)}
                  aria-label={t.moveDown}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex shrink-0 flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={disabled}
                  onClick={() => handleDuplicate(bullet.id)}
                  aria-label={t.duplicateBullet}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-fti-red hover:bg-red-50"
                  disabled={disabled}
                  onClick={() => handleDelete(bullet.id)}
                  aria-label={t.deleteBullet}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
