export function evalExtras(
  overrides: Partial<{
    oem: boolean;
    odm: boolean;
    privateLabel: boolean;
    packagingCustom: boolean;
    colorCustom: boolean;
    specCustom: boolean;
    exclusive: boolean;
    customLevel: string;
    customNotes: string;
    iso1: string;
    iso2: string;
    iso3: string;
    productSystems: string[];
  }> = {},
) {
  return {
    oem: false,
    odm: false,
    privateLabel: false,
    packagingCustom: false,
    colorCustom: false,
    specCustom: false,
    exclusive: false,
    customLevel: "Low",
    customNotes: "",
    iso1: "ISO 9001",
    iso2: "ISO 14001",
    iso3: "",
    productSystems: [] as string[],
    ...overrides,
  };
}

export const LEAD_TIMES = {
  standard: "45 days",
  volume: "40 days",
  bulk: "35 days",
} as const;
