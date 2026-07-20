export interface SeminarCategoryVisual {
  tagBg: string;
  tagText: string;
  accent: string;
}

const NEUTRAL: SeminarCategoryVisual = {
  tagBg: "#f3f4f6",
  tagText: "#374151",
  accent: "#9ca3af",
};

const BREAK_VISUAL: SeminarCategoryVisual = {
  tagBg: "#dcfce7",
  tagText: "#166534",
  accent: "#16a34a",
};

const DEFAULT_BY_CATEGORY: Record<string, SeminarCategoryVisual> = {
  "Corporate Update": {
    tagBg: "#dbeafe",
    tagText: "#1e40af",
    accent: "#2563eb",
  },
  Product: {
    tagBg: "#ffedd5",
    tagText: "#c2410c",
    accent: "#ea580c",
  },
  "Membership & Digital": {
    tagBg: "#ede9fe",
    tagText: "#5b21b6",
    accent: "#7c3aed",
  },
  "Sales & Marketing": {
    tagBg: "#fce7f3",
    tagText: "#9d174d",
    accent: "#db2777",
  },
  "Branch Sharing": {
    tagBg: "#f3f4f6",
    tagText: "#374151",
    accent: "#6b7280",
  },
  "Voice of Customer": {
    tagBg: "#f3f4f6",
    tagText: "#374151",
    accent: "#6b7280",
  },
  Interactive: {
    tagBg: "#fef3c7",
    tagText: "#92400e",
    accent: "#d97706",
  },
  Recognition: {
    tagBg: "#fef9c3",
    tagText: "#854d0e",
    accent: "#ca8a04",
  },
  Entertainment: {
    tagBg: "#fce7f3",
    tagText: "#831843",
    accent: "#be185d",
  },
  Logistics: {
    tagBg: "#e0f2fe",
    tagText: "#0c4a6e",
    accent: "#0284c7",
  },
  Break: BREAK_VISUAL,
};

const BREAK_FORMATS = new Set(["Break", "Lunch / Dinner"]);

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandHex(hex: string): string {
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = expandHex(hex.trim());
  if (!HEX_RE.test(normalized)) return null;
  const raw = normalized.slice(1);
  const value = Number.parseInt(raw, 16);
  if (!Number.isFinite(value)) return null;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixWithWhite(
  hex: string,
  amount: number,
): { bg: string; text: string; accent: string } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount);
  const bg = `rgb(${mix(rgb.r)}, ${mix(rgb.g)}, ${mix(rgb.b)})`;
  const text = expandHex(hex);
  return { bg, text, accent: text };
}

export function resolveSeminarCategoryVisual(
  categoryName: string | null | undefined,
  formatName: string | null | undefined,
  colorHint?: string | null,
): SeminarCategoryVisual {
  const format = formatName?.trim() ?? "";
  if (BREAK_FORMATS.has(format)) {
    return BREAK_VISUAL;
  }

  const hint = colorHint?.trim();
  if (hint) {
    const derived = mixWithWhite(hint.startsWith("#") ? hint : `#${hint}`, 0.82);
    if (derived) {
      return {
        tagBg: derived.bg,
        tagText: derived.text,
        accent: derived.accent,
      };
    }
  }

  const category = categoryName?.trim() ?? "";
  if (!category) return NEUTRAL;
  return DEFAULT_BY_CATEGORY[category] ?? NEUTRAL;
}

export const SEMINAR_AGENDA_DOCUMENT_ACCENT = "#695cff";
