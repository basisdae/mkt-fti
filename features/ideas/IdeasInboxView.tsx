"use client";

import { useMemo, useState } from "react";
import { Lightbulb, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { IdeaCard } from "@/components/idea/IdeaCard";
import { useIdeaStore } from "@/hooks/IdeaStore";
import {
  IDEA_SOURCE_PLATFORM_LABELS,
  IDEA_STATUS_LABELS,
} from "@/lib/idea-constants";
import { matchesIdeaSearch } from "@/lib/idea";
import type { IdeaSourcePlatform, IdeaStatus } from "@/types/idea";

const platformOptions = Object.entries(IDEA_SOURCE_PLATFORM_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const statusFilterOptions: { value: IdeaStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...(
    Object.entries(IDEA_STATUS_LABELS) as [IdeaStatus, string][]
  ).map(([value, label]) => ({ value, label })),
];

export function IdeasInboxView() {
  const { ideas, addIdea, updateIdeaStatus, convertToProduct } = useIdeaStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    productName: "",
    sourceLink: "",
    sourcePlatform: "alibaba" as IdeaSourcePlatform,
    whyInteresting: "",
    possibleBrand: "",
    estimatedPriceRange: "",
    tags: "",
  });

  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      if (statusFilter !== "all" && idea.status !== statusFilter) return false;
      return matchesIdeaSearch(idea, query);
    });
  }, [ideas, query, statusFilter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: ideas.length };
    for (const idea of ideas) {
      map[idea.status] = (map[idea.status] ?? 0) + 1;
    }
    return map;
  }, [ideas]);

  function handleAddIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productName.trim()) return;

    addIdea({
      productName: form.productName.trim(),
      sourceLink: form.sourceLink.trim(),
      sourcePlatform: form.sourcePlatform,
      whyInteresting: form.whyInteresting.trim(),
      possibleBrand: form.possibleBrand.trim() || "—",
      estimatedPriceRange: form.estimatedPriceRange.trim() || "—",
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setForm({
      productName: "",
      sourceLink: "",
      sourcePlatform: "alibaba",
      whyInteresting: "",
      possibleBrand: "",
      estimatedPriceRange: "",
      tags: "",
    });
    setShowForm(false);
  }

  async function handleConvert(ideaId: string) {
    setConvertingId(ideaId);
    convertToProduct(ideaId);
    setConvertingId(null);
  }

  return (
    <div className="page-shell">
      <div className="page-header-block flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Lightbulb className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Product Idea Inbox
            </span>
          </div>
          <h1 className="page-title">Ideas</h1>
          <p className="page-description">
            Save products found online before factory contact — convert to pipeline when ready
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          {showForm ? "Close form" : "Add idea"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6" padding="lg">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            New Product Idea
          </h2>
          <form onSubmit={handleAddIdea} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Product Name *"
                value={form.productName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, productName: e.target.value }))
                }
                placeholder="e.g. Ultrasonic Jewelry Cleaner Mini"
              />
            </div>
            <Input
              label="Source Link"
              type="url"
              value={form.sourceLink}
              onChange={(e) =>
                setForm((f) => ({ ...f, sourceLink: e.target.value }))
              }
              placeholder="https://..."
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Source Platform
              </label>
              <select
                value={form.sourcePlatform}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sourcePlatform: e.target.value as IdeaSourcePlatform,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {platformOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
              Screenshot / image placeholder
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Why Interesting"
                rows={3}
                value={form.whyInteresting}
                onChange={(e) =>
                  setForm((f) => ({ ...f, whyInteresting: e.target.value }))
                }
              />
            </div>
            <Input
              label="Possible Brand"
              value={form.possibleBrand}
              onChange={(e) =>
                setForm((f) => ({ ...f, possibleBrand: e.target.value }))
              }
              placeholder="e.g. Variia"
            />
            <Input
              label="Estimated Price Range"
              value={form.estimatedPriceRange}
              onChange={(e) =>
                setForm((f) => ({ ...f, estimatedPriceRange: e.target.value }))
              }
              placeholder="e.g. ฿890 – ฿1,490"
            />
            <div className="sm:col-span-2">
              <Input
                label="Tags"
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="Comma-separated: lifestyle, gift, compact"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save idea</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ideas..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-light-purple hover:text-primary"
              }`}
            >
              {opt.label}
              {counts[opt.value] !== undefined ? ` (${counts[opt.value]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-gray-200 bg-white/60 px-6 py-16 text-center">
          <Lightbulb className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No ideas match your filters</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onStatusChange={updateIdeaStatus}
              onConvert={handleConvert}
              converting={convertingId === idea.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
