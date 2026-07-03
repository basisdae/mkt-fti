import type {
  EvaluationCriterionId,
  EvaluationScore,
  ProductEvaluationScorecard,
} from "@/types/product";

type CriterionSeed = { score: EvaluationScore; note: string };

type EvaluationSeed = {
  criteria: Partial<Record<EvaluationCriterionId, CriterionSeed>>;
  evaluatedAt: string;
  evaluator: string;
};

function buildScorecard(seed: EvaluationSeed): ProductEvaluationScorecard {
  const defaults: Record<EvaluationCriterionId, CriterionSeed> = {
    market_potential: { score: 3, note: "" },
    innovation_interest: { score: 3, note: "" },
    product_quality: { score: 3, note: "" },
    price_competitiveness: { score: 3, note: "" },
    oem_opportunity: { score: 3, note: "" },
    brand_fit: { score: 3, note: "" },
    marketing_potential: { score: 3, note: "" },
    supplier_reliability: { score: 3, note: "" },
  };

  const criteria = { ...defaults };
  for (const [key, value] of Object.entries(seed.criteria)) {
    if (value) {
      criteria[key as EvaluationCriterionId] = value;
    }
  }

  return {
    criteria,
    evaluatedAt: seed.evaluatedAt,
    evaluator: seed.evaluator,
  };
}

export const EVALUATION_SCORECARD_SEEDS: Record<string, EvaluationSeed> = {
  "prod-001": {
    evaluatedAt: "2026-06-28T10:00:00",
    evaluator: "คณะกรรมการผลิตภัณฑ์",
    criteria: {
      market_potential: {
        score: 5,
        note: "ตลาดเครื่องฟอกอากาศยังโตต่อเนื่อง โดยเฉพาะกลุ่ม Smart Home",
      },
      innovation_interest: {
        score: 4,
        note: "มี IoT monitoring แต่ยังไม่ unique มากเมื่อเทียบคู่แข่ง",
      },
      product_quality: {
        score: 5,
        note: "ตัวอย่างผ่าน HEPA H13 และทนทานตามสเปก",
      },
      price_competitiveness: {
        score: 4,
        note: "GP อยู่ในเป้า แต่ต้องดูโปรโมชันช่วงเปิดตัว",
      },
      oem_opportunity: {
        score: 5,
        note: "โรงงานรองรับ white-label เต็มรูปแบบ",
      },
      brand_fit: {
        score: 5,
        note: "สอดคล้องกับ Aquatek และไลน์ Home Living",
      },
      marketing_potential: {
        score: 4,
        note: "Storytelling ด้านสุขภาพทำได้ดี มี content hook",
      },
      supplier_reliability: {
        score: 4,
        note: "ส่งตัวอย่างตรงเวลา ตอบสนองเร็ว",
      },
    },
  },
  "prod-002": {
    evaluatedAt: "2026-06-20T14:30:00",
    evaluator: "คณะกรรมการผลิตภัณฑ์",
    criteria: {
      market_potential: { score: 4, note: "ตลาด personal blender แข่งสูงแต่ยังมีช่องว่าง" },
      innovation_interest: { score: 3, note: "USB-C เป็น must-have แต่ไม่ใช่จุดขายหลัก" },
      product_quality: { score: 4, note: "รอผลทดสอบ batch 2" },
      price_competitiveness: { score: 4, note: "ราคา factory อยู่ในกรอบ" },
      oem_opportunity: { score: 4, note: "ODM catalog พร้อม customize บรรจุภัณฑ์" },
      brand_fit: { score: 3, note: "ยังไม่ตัดสินใจแบรนด์" },
      marketing_potential: { score: 4, note: "เหมาะกับ lifestyle content" },
      supplier_reliability: { score: 4, note: "โรงงานมีประสบการณ์ส่งออก" },
    },
  },
  "prod-003": {
    evaluatedAt: "2026-06-15T11:00:00",
    evaluator: "คณะกรรมการผลิตภัณฑ์",
    criteria: {
      market_potential: { score: 4, note: "Wellness trend ยังแรง" },
      innovation_interest: { score: 5, note: "UV-C countertop มีจุดขายชัด" },
      product_quality: { score: 4, note: "รอ cert NSF" },
      price_competitiveness: { score: 3, note: "MOQ 300 ทำให้ต้นทุนสูง" },
      oem_opportunity: { score: 3, note: "custom development ใช้เวลานานกว่า OEM" },
      brand_fit: { score: 5, note: "Treatton wellness fit ดี" },
      marketing_potential: { score: 4, note: "health angle ชัดเจน" },
      supplier_reliability: { score: 4, note: "ทีมวิศวกรตอบ technical ได้ดี" },
    },
  },
  "prod-004": {
    evaluatedAt: "2026-06-10T09:00:00",
    evaluator: "คณะกรรมการผลิตภัณฑ์",
    criteria: {
      market_potential: { score: 4, note: "stick vacuum ตลาดใหญ่" },
      innovation_interest: { score: 3, note: "spec มาตรฐาน ไม่ standout" },
      product_quality: { score: 4, note: "ทดสอบ runtime ผ่าน" },
      price_competitiveness: { score: 4, note: "margin อยู่ในเป้า" },
      oem_opportunity: { score: 5, note: "OEM private label ง่าย" },
      brand_fit: { score: 3, note: "รอตัดสินใจแบรนด์" },
      marketing_potential: { score: 3, note: "แข่งกับแบรนด์ใหญ่หนัก" },
      supplier_reliability: { score: 4, note: "โรงงานมี cert ครบ" },
    },
  },
  "prod-005": {
    evaluatedAt: "2026-05-28T15:00:00",
    evaluator: "คณะกรรมการผลิตภัณฑ์",
    criteria: {
      market_potential: { score: 4, note: "smart lock โตในไทย" },
      innovation_interest: { score: 4, note: "fingerprint + app ครบ" },
      product_quality: { score: 3, note: "รอทดสอบความทนทาน" },
      price_competitiveness: { score: 3, note: "MOQ สูงกด margin" },
      oem_opportunity: { score: 4, note: "ODM catalog ชัดเจน" },
      brand_fit: { score: 3, note: "ยังพิจารณา Variia vs Aquatek" },
      marketing_potential: { score: 4, note: "security story ขายได้" },
      supplier_reliability: { score: 3, note: "เจรจา MOQ ยังไม่จบ" },
    },
  },
  "prod-006": {
    evaluatedAt: "2026-06-25T10:30:00",
    evaluator: "คณะกรรมการผลิตภัณฑ์",
    criteria: {
      market_potential: { score: 5, note: "dash cam ตลาด auto accessories แข็งแรง" },
      innovation_interest: { score: 4, note: "4K dual cam เป็นจุดขาย" },
      product_quality: { score: 5, note: "ผ่าน heat/vibration test" },
      price_competitiveness: { score: 4, note: "GP automotive อยู่ในเป้า" },
      oem_opportunity: { score: 5, note: "OEM bundle SD card ทำได้" },
      brand_fit: { score: 5, note: "Fastpure automotive fit" },
      marketing_potential: { score: 4, note: "ช่องทาง dealer auto ชัด" },
      supplier_reliability: { score: 5, note: "ส่งมอบ production ตรงเวลา" },
    },
  },
  "prod-007": {
    evaluatedAt: "2026-05-01T09:00:00",
    evaluator: "คณะกรรมการผลิตภัณฑ์",
    criteria: {
      market_potential: { score: 5, note: "massage gun ยอดขายจริงดีหลัง launch" },
      innovation_interest: { score: 4, note: "6-speed elite แตกต่างพอสมควร" },
      product_quality: { score: 5, note: "review ลูกค้าดี" },
      price_competitiveness: { score: 4, note: "margin สูงเมื่อ scale" },
      oem_opportunity: { score: 4, note: "ODM carry case bundle" },
      brand_fit: { score: 5, note: "Treatton wellness ลงตัว" },
      marketing_potential: { score: 5, note: "influencer fitness ทำได้ดี" },
      supplier_reliability: { score: 5, note: "ส่งมอบ launch สำเร็จ" },
    },
  },
  "prod-008": {
    evaluatedAt: "2026-06-01T13:00:00",
    evaluator: "คณะกรรมการผลิตภัณฑ์",
    criteria: {
      market_potential: { score: 3, note: "robot mop แข่งสูง ราคากดดัน" },
      innovation_interest: { score: 4, note: "LIDAR น่าสนใจแต่ต้นทุนสูง" },
      product_quality: { score: 2, note: "ยังไม่มี sample ทดสอบ" },
      price_competitiveness: { score: 2, note: "MOQ และ cost ยังไม่ชัด" },
      oem_opportunity: { score: 3, note: "custom dev ซับซ้อน" },
      brand_fit: { score: 2, note: "on hold รอ category review" },
      marketing_potential: { score: 3, note: "ต้องลงทุน educate สูง" },
      supplier_reliability: { score: 2, note: "ยัง early stage contact" },
    },
  },
  "prod-009": {
    evaluatedAt: "2026-06-18T11:30:00",
    evaluator: "คณะกรรมการผลิตภัณฑ์",
    criteria: {
      market_potential: { score: 4, note: "desk lamp lifestyle ตลาดกว้าง" },
      innovation_interest: { score: 3, note: "color temp + USB มาตรฐาน" },
      product_quality: { score: 4, note: "flicker test ผ่าน" },
      price_competitiveness: { score: 5, note: "GP สูงที่ MOQ 5K" },
      oem_opportunity: { score: 5, note: "OEM packaging ง่าย" },
      brand_fit: { score: 5, note: "Variia lifestyle fit" },
      marketing_potential: { score: 4, note: "minimal design ขาย online ได้" },
      supplier_reliability: { score: 4, note: "ส่ง shipment ตรงเวลา" },
    },
  },
};

export function evaluationForProduct(
  productId: string,
): ProductEvaluationScorecard | undefined {
  const seed = EVALUATION_SCORECARD_SEEDS[productId];
  if (!seed) return undefined;
  return buildScorecard(seed);
}
