import type { FtiBrand } from "@/types/product";

type BrandSeed = {
  factory: string;
  internalProjectName: string;
  currentBrand: FtiBrand | null;
  candidateBrands: FtiBrand[];
  businessUnit: string;
  reason: string;
  decisionDate: string | null;
  owner: string;
};

export const BRAND_STRATEGY_SEEDS: Record<string, BrandSeed> = {
  "prod-001": {
    factory: "Guangzhou CleanTech Co.",
    internalProjectName: "Project Aero Pure",
    currentBrand: "aquatek",
    candidateBrands: ["variia", "fastpure"],
    businessUnit: "Home Living",
    reason:
      "Aquatek air-quality line extension; strong fit with HEPA positioning and existing channel.",
    decisionDate: "2026-05-12",
    owner: "Nattaya K.",
  },
  "prod-002": {
    factory: "Shenzhen BlendWorks Ltd.",
    internalProjectName: "Project Blend Wave",
    currentBrand: null,
    candidateBrands: ["fastpure", "variia"],
    businessUnit: "Kitchen & Small Appliances",
    reason:
      "Evaluating Fastpure kitchen mobility vs Variia lifestyle crossover before sample sign-off.",
    decisionDate: null,
    owner: "Sarun P.",
  },
  "prod-003": {
    factory: "Hangzhou PureFlow Inc.",
    internalProjectName: "Project Crystal Flow",
    currentBrand: "treatton",
    candidateBrands: ["uni_pure", "aquatek"],
    businessUnit: "Wellness",
    reason:
      "Treatton wellness portfolio alignment; premium UV positioning matches brand tier.",
    decisionDate: "2026-04-18",
    owner: "Nattaya K.",
  },
  "prod-004": {
    factory: "Ningbo HomePro Mfg.",
    internalProjectName: "Project Lite Sweep",
    currentBrand: null,
    candidateBrands: ["uni_pure", "aquatek"],
    businessUnit: "Home Living",
    reason:
      "Pending committee review — Uni-Pure mass-market vs Aquatek premium home line.",
    decisionDate: null,
    owner: "Pimchanok T.",
  },
  "prod-005": {
    factory: "Shenzhen SecureHome Tech",
    internalProjectName: "Project Sentinel S3",
    currentBrand: null,
    candidateBrands: ["variia", "aquatek"],
    businessUnit: "Smart Home",
    reason:
      "Smart lock category open — Variia connected home vs Aquatek security bundle under review.",
    decisionDate: null,
    owner: "Sarun P.",
  },
  "prod-006": {
    factory: "Dongguan VisionDrive Co.",
    internalProjectName: "Project RoadWatch 4K",
    currentBrand: "fastpure",
    candidateBrands: ["variia"],
    businessUnit: "Automotive",
    reason:
      "Fastpure automotive accessories lane confirmed for dash cam launch.",
    decisionDate: "2026-03-22",
    owner: "Nattaya K.",
  },
  "prod-007": {
    factory: "Xiamen RecoverTech Ltd.",
    internalProjectName: "Project Recover Elite",
    currentBrand: "treatton",
    candidateBrands: [],
    businessUnit: "Wellness",
    reason: "Treatton health & recovery — launched under established brand architecture.",
    decisionDate: "2026-01-15",
    owner: "Sarun P.",
  },
  "prod-008": {
    factory: "Suzhou RoboClean Inc.",
    internalProjectName: "Project AutoMop X",
    currentBrand: null,
    candidateBrands: ["aquatek", "uni_pure"],
    businessUnit: "Home Living",
    reason:
      "On hold — brand assignment deferred until category strategy review completes.",
    decisionDate: null,
    owner: "Pimchanok T.",
  },
  "prod-009": {
    factory: "Zhongshan LightWorks Co.",
    internalProjectName: "Project Lumen Pro",
    currentBrand: "variia",
    candidateBrands: ["fastpure"],
    businessUnit: "Lifestyle",
    reason:
      "Variia desk & lifestyle lighting — minimalist design language match.",
    decisionDate: "2026-02-28",
    owner: "Nattaya K.",
  },
};

export function brandStrategyForProduct(productId: string): BrandSeed | undefined {
  return BRAND_STRATEGY_SEEDS[productId];
}
