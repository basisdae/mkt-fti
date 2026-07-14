/** Thai UI copy for the Simulator page (sidebar stays English). */

export const SIMULATOR_COPY = {
  pageTitle: "เครื่องคำนวณยอดขายและกำไร",
  pageSubtitle:
    "ทดลองใส่จำนวนขาย เพื่อดูยอดขายรวม ต้นทุนรวม และกำไรโดยประมาณ",

  inputsTitle: "ข้อมูลสำหรับคำนวณ",
  productDetailTitle: "Product Detail",
  salesPlanSimulatorTitle: "Sales Plan Simulator",
  multiProductSummaryTitle: "Multi Product Summary",
  sectionProductSelection: "เลือกสินค้า",
  sectionSalesTarget: "ตั้งเป้าการขาย",
  sectionResultPreview: "ผลคำนวณต่อชิ้น",
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
  summaryProfitPercent: "กำไร (%)",
  summaryExcessTarget: "ยอดที่เกินเป้าหมาย",
  summaryQtyRequired: "จำนวนที่ต้องขาย",
  summaryQtyFor100M: "จำนวนที่ต้องขายเพื่อถึง 100 ล้านบาท",

  excessAboveTarget: "เกินเป้าหมายยอดขาย",
  excessBelowTarget: "ต่ำกว่าเป้าหมายยอดขาย",
  qtyRequiredHint: (price: string) => `เพื่อให้ถึงเป้าหมายที่ราคา ${price} ต่อชิ้น`,
  qtyRequiredGapHint: (qty: string) => `ต้องขายเพิ่มอีก ${qty} ชิ้น`,

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
  editRowHint: "คลิกไอคอนดินสอเพื่อแก้ไขแถว",
  simulationDisclaimer:
    "ตัวเลขนี้เป็นการจำลองเบื้องต้น ไม่ใช่ราคาขายที่อนุมัติแล้ว",
  tableUnitCost: "ต้นทุน",
  undoRedoToolbar: "เลิกทำ / ทำซ้ำ",
  undo: "เลิกทำ",
  redo: "ทำซ้ำ",
  undoShortcut: "Ctrl+Z",
  redoShortcut: "Ctrl+Y",
  removeProduct: (name: string) => `ลบ ${name}`,
  perUnit: "ต่อชิ้น",
} as const;
