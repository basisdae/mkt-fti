/** Thai UI copy for the Simulator page (sidebar stays English). */

export const SIMULATOR_COPY = {
  pageTitle: "เครื่องคำนวณยอดขายและกำไร",
  pageSubtitle:
    "ทดลองใส่จำนวนขาย เพื่อดูยอดขายรวม ต้นทุนรวม และกำไรโดยประมาณ",

  inputsTitle: "ข้อมูลสำหรับคำนวณ",
  selectProduct: "เลือกสินค้า",
  moqTier: "ขั้นต่ำการสั่งซื้อ (MOQ)",
  targetRevenue: "เป้าหมายยอดขาย",
  expectedQty: "จำนวนที่คาดว่าจะขาย",

  unitPricingTitle: "ราคาและต้นทุนต่อชิ้น",
  sellingPrice: "ราคาขายบริษัท",
  costPerUnit: "ต้นทุนต่อชิ้น",
  profitPerUnit: "กำไรต่อชิ้น",
  profitMargin: "สัดส่วนกำไร",

  lowMarginWarning: "สัดส่วนกำไรต่ำกว่า 25% — ควรตรวจสอบราคาขายและต้นทุนอีกครั้ง",
  addToScenario: "เพิ่มลงในแผนจำลอง",

  summaryRevenue: "ยอดขายรวม",
  summaryTotalCost: "ต้นทุนรวม",
  summaryGrossProfit: "กำไรรวม",
  summaryProfitPercent: "กำไรเฉลี่ย (%)",
  summaryQtyFor100M: "จำนวนที่ต้องขายเพื่อถึง 100 ล้านบาท",

  revenueCalcHint: (qty: string, price: string) =>
    `${qty} ชิ้น × ${price} ต่อชิ้น`,
  costCalcHint: (qty: string, cost: string) =>
    `${qty} ชิ้น × ${cost} ต่อชิ้น`,
  profitMarginHint: (percent: string) => `สัดส่วนกำไร ${percent}`,
  qtyFor100MHint: (price: string) => `ที่ราคา ${price} ต่อชิ้น`,
  qtyUnits: (n: number) => `${n.toLocaleString("th-TH")} ชิ้น`,

  targetVsExpectedTitle: "เปรียบเทียบเป้าหมายกับยอดที่คาดการณ์",
  targetRevenueLabel: "เป้าหมายยอดขาย",
  projectedRevenueLabel: "ยอดขายที่คาดการณ์",
  gapLabel: "ส่วนต่าง",
  gapBelow: "ต่ำกว่าเป้า",
  gapAbove: "เกินเป้า",

  scenarioTitle: "แผนจำลองหลายสินค้า",
  scenarioEmptyTitle: "ยังไม่มีสินค้าในแผนจำลอง",
  scenarioEmptyDescription:
    'กรอกข้อมูลด้านบน แล้วกด "เพิ่มลงในแผนจำลอง" เพื่อสร้างแผนยอดขายหลายรายการ',

  tableProduct: "สินค้า",
  tableMoq: "ขั้นต่ำการสั่งซื้อ (MOQ)",
  tableQty: "จำนวน",
  tableUnitPrice: "ราคาขาย",
  tableTargetRevenue: "เป้าหมายยอดขาย",
  tableCost: "ต้นทุน",
  tableRevenue: "ยอดขายรวม",
  tableProfit: "กำไร",
  tableProfitShare: "สัดส่วนกำไร",
  tableActions: "จัดการ",
  editRow: "แก้ไข",
  saveRow: "บันทึก",
  cancelEdit: "ยกเลิก",
  duplicateRow: "ทำสำเนา",
  deleteConfirmTitle: "ยืนยันการลบ",
  deleteConfirmMessage: "ต้องการลบแถวนี้ออกจากแผนจำลองหรือไม่?",
  confirmDelete: "ลบ",
  cancelDelete: "ยกเลิก",
  editRowHint: "ดับเบิลคลิกเพื่อแก้ไข",
  removeProduct: (name: string) => `ลบ ${name}`,
  perUnit: "ต่อชิ้น",
} as const;
