"use client";

import { cn } from "@/lib/utils";

interface SupplierHighlightSectionProps {
  factoryName: string;
  provinceRegion: string;
  cityDistrict: string;
  onFactoryNameChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  className?: string;
}

export function SupplierHighlightSection({
  factoryName,
  provinceRegion,
  cityDistrict,
  onFactoryNameChange,
  onProvinceChange,
  onCityChange,
  className,
}: SupplierHighlightSectionProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a5f] p-6 shadow-lg shadow-indigo-900/20",
        className,
      )}
    >
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-indigo-200/80">
        Factory Identity · Recommended
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-xs font-medium text-indigo-100/90">
            Factory Name
          </label>
          <input
            type="text"
            value={factoryName}
            onChange={(e) => onFactoryNameChange(e.target.value)}
            placeholder="e.g. Guangzhou CleanTech Co."
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white placeholder:text-indigo-200/40 outline-none transition-colors focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-indigo-100/90">
            Province / Region
          </label>
          <input
            type="text"
            value={provinceRegion}
            onChange={(e) => onProvinceChange(e.target.value)}
            placeholder="e.g. Guangdong"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-indigo-200/40 outline-none transition-colors focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-indigo-100/90">
            City / District
          </label>
          <input
            type="text"
            value={cityDistrict}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="e.g. Guangzhou · Panyu"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-indigo-200/40 outline-none transition-colors focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
          />
        </div>
      </div>
    </div>
  );
}
