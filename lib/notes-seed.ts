import type { ProductNote } from "@/types/product";

export const productNotes: ProductNote[] = [
  // prod-001
  {
    id: "note-001-1",
    productId: "prod-001",
    type: "factory_comment",
    title: "Packaging material confirmation",
    body: "Factory confirmed white-label box with FTI logo emboss on lid.\n\nMOQ for custom packaging: 500 units — aligned with production run.\n\n**Action:** Await print proof by 10 Jul.",
    author: "Nattaya K.",
    createdAt: "2026-06-28T14:30:00",
    updatedAt: "2026-06-28T14:30:00",
    attachments: [
      {
        id: "att-001-1",
        name: "Packaging-Spec-v2.pdf",
        fileType: "pdf",
        mimeType: "application/pdf",
        sizeBytes: 312_000,
        url: "#mock-packaging-spec",
      },
      {
        id: "att-001-2",
        name: "Box-Artwork-Preview.png",
        fileType: "image",
        mimeType: "image/png",
        sizeBytes: 890_000,
        url: "/images/products/prod-001.svg",
      },
    ],
  },
  {
    id: "note-001-2",
    productId: "prod-001",
    type: "negotiation",
    title: "Q3 volume discount request",
    body: "Requested 3% unit cost reduction for 2,000+ order.\n\nFactory counter: 1.5% if payment terms shortened to 30 days net.",
    author: "Sarun P.",
    createdAt: "2026-06-15T11:00:00",
    updatedAt: "2026-06-15T11:00:00",
    attachments: [
      {
        id: "att-001-3",
        name: "Cost-Comparison-Q3.xlsx",
        fileType: "excel",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sizeBytes: 156_000,
        url: "#mock-cost-comparison",
      },
    ],
  },
  {
    id: "note-001-3",
    productId: "prod-001",
    type: "meeting_summary",
    title: "Launch readiness review — 2 Jul",
    body: "Attendees: Sarun, Nattaya, Pimchanok, Marketing lead.\n\nDecisions:\n• Launch window confirmed Q3 Week 2\n• Final packaging approved\n• TISI cert on file\n\nNext: warehouse slot booking.",
    author: "Pimchanok T.",
    createdAt: "2026-07-02T16:00:00",
    updatedAt: "2026-07-02T16:00:00",
    attachments: [],
  },

  // prod-002
  {
    id: "note-002-1",
    productId: "prod-002",
    type: "factory_comment",
    title: "Blade assembly feedback",
    body: "Sample batch 2 blade coupling shows minor wobble at max RPM.\n\nFactory proposes reinforced gasket — no cost impact.",
    author: "Pimchanok T.",
    createdAt: "2026-06-25T09:45:00",
    updatedAt: "2026-06-25T09:45:00",
    attachments: [
      {
        id: "att-002-1",
        name: "Durability-Test-Report.pdf",
        fileType: "pdf",
        mimeType: "application/pdf",
        sizeBytes: 420_000,
        url: "#mock-test-report",
      },
    ],
  },
  {
    id: "note-002-2",
    productId: "prod-002",
    type: "rich",
    title: "Competitive positioning",
    body: "Target retail ฿1,290 — undercuts main competitor by ~8% at same MOQ tier.\n\nHighlight USB-C fast charge in all channel copy.",
    author: "Nattaya K.",
    createdAt: "2026-06-10T13:20:00",
    updatedAt: "2026-06-10T13:20:00",
    attachments: [],
  },

  // prod-003
  {
    id: "note-003-1",
    productId: "prod-003",
    type: "negotiation",
    title: "300-unit MOQ quote follow-up",
    body: "PureFlow holding at 300 MOQ but lead time extends to 45 days.\n\nAlternative: 500 MOQ with 30-day lead — needs margin recalc.",
    author: "Nattaya K.",
    createdAt: "2026-06-30T11:00:00",
    updatedAt: "2026-06-30T11:00:00",
    attachments: [
      {
        id: "att-003-1",
        name: "PureFlow-Quote-Rev2.xlsx",
        fileType: "excel",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sizeBytes: 98_000,
        url: "#mock-quote",
      },
    ],
  },
  {
    id: "note-003-2",
    productId: "prod-003",
    type: "meeting_summary",
    title: "Wellness line scoping call",
    body: "Technical review with Dr. Wang Mei.\n\nUV lamp life rated 8,000 hrs — exceeds FTI minimum.\n\nCert path: TISI + NSF documentation in progress.",
    author: "Sarun P.",
    createdAt: "2026-03-12T10:00:00",
    updatedAt: "2026-03-12T10:00:00",
    attachments: [],
  },

  // prod-004
  {
    id: "note-004-1",
    productId: "prod-004",
    type: "factory_comment",
    title: "TISI submission status",
    body: "Test lab confirmed suction and noise tests passed.\n\nSubmission ref #TISI-2026-8842 — expected turnaround 3 weeks.",
    author: "Sarun P.",
    createdAt: "2026-06-29T16:45:00",
    updatedAt: "2026-06-29T16:45:00",
    attachments: [
      {
        id: "att-004-1",
        name: "TISI-Test-Results.pdf",
        fileType: "pdf",
        mimeType: "application/pdf",
        sizeBytes: 512_000,
        url: "#mock-tisi",
      },
    ],
  },

  // prod-005
  {
    id: "note-005-1",
    productId: "prod-005",
    type: "negotiation",
    title: "MOQ reduction — 500 to 200",
    body: "SecureHome initial MOQ 500 units.\n\nOur ask: 200 for pilot channel test.\n\nFactory willing if unit price +12% — within acceptable range.",
    author: "Sarun P.",
    createdAt: "2026-06-28T10:20:00",
    updatedAt: "2026-06-28T10:20:00",
    attachments: [
      {
        id: "att-005-1",
        name: "MOQ-Scenarios.xlsx",
        fileType: "excel",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sizeBytes: 67_000,
        url: "#mock-moq",
      },
    ],
  },
  {
    id: "note-005-2",
    productId: "prod-005",
    type: "rich",
    title: "Smart lock category notes",
    body: "Fingerprint sensor spec must support humid climate (Bangkok avg RH 75%).\n\nPrioritize models with IP54 minimum.",
    author: "Pimchanok T.",
    createdAt: "2026-02-14T11:30:00",
    updatedAt: "2026-02-14T11:30:00",
    attachments: [],
  },

  // prod-006
  {
    id: "note-006-1",
    productId: "prod-006",
    type: "factory_comment",
    title: "Night vision QA sign-off",
    body: "Sample units passed low-light recording test at 0.5 lux.\n\n4K sensor firmware v2.1 approved for production.",
    author: "Pimchanok T.",
    createdAt: "2026-03-10T16:00:00",
    updatedAt: "2026-03-10T16:00:00",
    attachments: [
      {
        id: "att-006-1",
        name: "Night-Vision-Samples.jpg",
        fileType: "image",
        mimeType: "image/jpeg",
        sizeBytes: 1_240_000,
        url: "/images/products/prod-006.svg",
      },
    ],
  },
  {
    id: "note-006-2",
    productId: "prod-006",
    type: "meeting_summary",
    title: "Automotive channel kickoff",
    body: "Approved dash cam for FTI automotive bundle Q3.\n\nBundle with SD card option — factory can kit at +฿45/unit.",
    author: "Nattaya K.",
    createdAt: "2026-05-01T09:30:00",
    updatedAt: "2026-05-01T09:30:00",
    attachments: [],
  },

  // prod-007
  {
    id: "note-007-1",
    productId: "prod-007",
    type: "rich",
    title: "Post-launch learnings",
    body: "Elite variant outselling base 3:1 in first month.\n\nCarry case inclusion cited in 40% of positive reviews.",
    author: "Sarun P.",
    createdAt: "2026-07-01T10:00:00",
    updatedAt: "2026-07-01T10:00:00",
    attachments: [],
  },

  // prod-008
  {
    id: "note-008-1",
    productId: "prod-008",
    type: "factory_comment",
    title: "Project on hold — factory reply",
    body: "Factory acknowledged hold request.\n\nWill retain tooling quote valid until Sep 2026.",
    author: "Pimchanok T.",
    createdAt: "2026-06-25T13:30:00",
    updatedAt: "2026-06-25T13:30:00",
    attachments: [
      {
        id: "att-008-1",
        name: "Robot-Mop-Catalog.pdf",
        fileType: "pdf",
        mimeType: "application/pdf",
        sizeBytes: 2_100_000,
        url: "#mock-catalog",
      },
    ],
  },

  // prod-009
  {
    id: "note-009-1",
    productId: "prod-009",
    type: "negotiation",
    title: "5K tier pricing locked",
    body: "Final tier pricing agreed for 2K / 5K / 10K MOQ.\n\n5K tier hits 52.8% wholesale GP — above target.",
    author: "Nattaya K.",
    createdAt: "2026-02-10T11:00:00",
    updatedAt: "2026-02-10T11:00:00",
    attachments: [
      {
        id: "att-009-1",
        name: "Lumina-Tier-Pricing.xlsx",
        fileType: "excel",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sizeBytes: 84_000,
        url: "#mock-pricing",
      },
    ],
  },
  {
    id: "note-009-2",
    productId: "prod-009",
    type: "meeting_summary",
    title: "Shipment coordination — 1 Jul",
    body: "2,000 units dispatched from Shenzhen.\n\nETA Laem Chabang 12 Jul.\n\nWarehouse team notified for inbound slot.",
    author: "Pimchanok T.",
    createdAt: "2026-07-01T07:45:00",
    updatedAt: "2026-07-01T07:45:00",
    attachments: [
      {
        id: "att-009-2",
        name: "Bill-of-Lading.pdf",
        fileType: "pdf",
        mimeType: "application/pdf",
        sizeBytes: 178_000,
        url: "#mock-bol",
      },
    ],
  },
];

export function getNotesForProduct(productId: string): ProductNote[] {
  return productNotes
    .filter((n) => n.productId === productId)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}
