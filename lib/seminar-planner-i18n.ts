/** Thai UI copy for the Seminar Planner module (display only — enums/DB unchanged). */

export const SEMINAR_PLANNER_COPY = {
  navSeminarPlanner: "Seminar Planner",
  navLibrary: "คลังเซสชันและ Master Data",

  // Home
  homeEyebrow: "Seminar Planner",
  homeTitle: "วางแผนงานสัมมนา",
  homeSubtitle:
    "จัดทำแผนงานสัมมนา วาง Agenda จากคลังเซสชัน และติดตามสถานะก่อนจัดงานจริง",
  libraryLink: "คลังเซสชันและ Master Data",
  newEvent: "สร้างงานใหม่",
  tabActive: "ใช้งาน",
  tabArchived: "เก็บถาวร",
  searchEvents: "ค้นหางานสัมมนา…",
  filterAllStatus: "ทุกสถานะ",
  sortLastUpdated: "อัปเดตล่าสุด",
  sortTitle: "เรียงตามชื่อ",
  sortStartDate: "วันที่เริ่ม",
  loadingEvents: "กำลังโหลดงานสัมมนา…",
  emptyEvents: "ยังไม่มีงานในรายการนี้ สร้างงานใหม่เพื่อเริ่มต้น",

  // Event card
  statusArchived: "เก็บถาวร",
  open: "เปิด",
  openEvent: "เปิดงาน",
  editEvent: "แก้ไขข้อมูล",
  deleteEvent: "ลบ",
  deleteEventConfirm: (title: string) =>
    `ลบงาน "${title}" และ Agenda ทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
  duplicate: "ทำสำเนา",
  archive: "เก็บถาวร",
  restore: "กู้คืน",
  eventActions: "เมนูงาน",
  sessions: "เซสชัน",
  totalMinutes: "รวมเวลา",
  minutesUnit: "นาที",
  updated: "อัปเดต",
  owner: "ผู้รับผิดชอบ",
  eventFormat: "รูปแบบงาน",
  startDate: "วันที่เริ่ม",

  // Dialogs — event
  newEventTitle: "สร้างงานสัมมนาใหม่",
  newEventSubtitle: "ตั้งชื่องานก่อน แล้วเพิ่มรายละเอียดและ Agenda ในหน้าแก้ไข",
  eventTitleLabel: "ชื่องาน *",
  eventTitlePlaceholder: "เช่น FTI CONNECT 2026",
  eventTypeLabel: "ประเภทงาน",
  eventTypePlaceholder: "เช่น Dealer Conference",
  createEvent: "สร้างงาน",
  creating: "กำลังสร้าง…",
  cancel: "ยกเลิก",
  save: "บันทึก",
  saving: "กำลังบันทึก…",

  // Detail / editor
  loadingEvent: "กำลังโหลดงานสัมมนา…",
  editorEyebrow: "Seminar Planner",
  editorTitle: "แก้ไขงานสัมมนา",
  editorSubtitle: "กรอกภาพรวมงานและจัด Agenda จากคลังเซสชัน",
  backToEvents: "← กลับรายการงาน",
  tabOverview: "ภาพรวม",
  tabAgenda: "จัด Agenda",
  refresh: "รีเฟรช",
  saveEvent: "บันทึกงาน",
  unsavedChanges: "มีการแก้ไขที่ยังไม่ได้บันทึก",
  saved: "บันทึกแล้ว",

  // Overview form
  overviewSection: "ข้อมูลงาน",
  titleLabel: "ชื่องาน *",
  eventType: "ประเภทงาน",
  status: "สถานะ",
  venue: "สถานที่",
  venuePlaceholder: "เช่น โรงแรม / สำนักงานใหญ่",
  dateRange: "ช่วงวันที่",
  startDateLabel: "วันเริ่ม",
  endDateLabel: "วันสิ้นสุด",
  dailyHours: "เวลาทำงานต่อวัน",
  dailyStartLabel: "เริ่ม",
  dailyEndLabel: "สิ้นสุด",
  estimatedAttendees: "ผู้เข้าร่วมโดยประมาณ",
  teamMembers: "สมาชิกทีม",
  teamMembersPlaceholder: "คั่นด้วย comma หรือขึ้นบรรทัดใหม่",
  notes: "หมายเหตุ",
  targetGroups: "กลุ่มเป้าหมาย",
  purposes: "วัตถุประสงค์",
  noTargetGroupsSelected: "ยังไม่เลือกกลุ่มเป้าหมาย",
  noPurposesSelected: "ยังไม่เลือกวัตถุประสงค์",

  // Agenda
  agendaSection: "วาระงาน",
  agendaEmpty: "ยังไม่มีเซสชันใน Agenda — เพิ่มจากคลังหรือสร้างเซสชันใหม่",
  addFromLibrary: "เพิ่มจากคลัง",
  pickFromLibrary: "เลือกหัวข้อจากคลัง…",
  libraryPickHint: "เลือกรายการแล้วจะเพิ่มลง Agenda ทันที",
  viewSummary: "ดูสรุป",
  closeSummary: "ปิด",
  editInLibrary: "ไปแก้ที่คลังเซสชัน",
  targetGroupsLabel: "กลุ่มเป้าหมาย",
  expandSessionFields: "แก้ไขเวลาและหมายเหตุ",
  agendaShortDetail: "รายละเอียดสั้น",
  agendaShortDetailPlaceholder:
    "เพิ่มรายละเอียดสั้นๆ สำหรับ Agenda นี้…",
  dragHandle: "ลากเพื่อเรียงลำดับ",
  replaceFromLibrary: "รายการจากคลัง",
  replaceFromLibraryAction: "เปลี่ยน…",
  replaceFromLibraryEmpty: "เลือกรายการจากคลัง…",
  replaceFromLibraryCurrent: "เชื่อมคลังอยู่ — เลือกเพื่อเปลี่ยน",
  replaceFromLibraryHint:
    "เปลี่ยนเนื้อหาจากคลังในกล่องนี้ — ตำแหน่ง เวลาเริ่ม สถานะ และหมายเหตุยังอยู่",
  replaceLibraryConfirm:
    "รายละเอียด/วิทยากรจากคลังจะถูกแทนที่ — ต้องการดำเนินการต่อหรือไม่?",
  replacingSession: "กำลังเปลี่ยน…",
  replaceLibraryFailed: "เปลี่ยนรายการจากคลังไม่สำเร็จ",
  agendaSnapshotHint:
    "รายละเอียดนี้เป็นสำเนาจากคลังเซสชัน — แก้ต้นฉบับที่คลังเซสชัน",
  customSessionSummaryHint:
    "เซสชันนี้ไม่ได้เชื่อมคลัง — แก้รายละเอียดที่คลังเซสชันแล้วเพิ่มใหม่ถ้าต้องการ",
  agendaCompactHint:
    "คลิกชื่อเซสชันหรือ “ดูสรุป” เพื่ออ่านรายละเอียด — แก้เวลาและหมายเหตุที่ลูกศรด้านขวา",
  agendaEventDateLabel: "วันที่จัดงาน",
  agendaEventDateHint: "ทุก Session ใช้วันที่นี้ — แก้ได้ที่แท็บภาพรวม",
  agendaEventDateMissing:
    "ยังไม่กำหนดวันที่จัดงาน — ตั้งที่แท็บภาพรวม",
  addCustomSession: "เพิ่มเซสชันใหม่",
  librarySearch: "ค้นหาเซสชันในคลัง…",
  sessionTitle: "ชื่อเซสชัน",
  category: "หมวด",
  format: "รูปแบบ",
  sessionDate: "วันที่",
  startTime: "เวลาเริ่ม",
  endTime: "เวลาสิ้นสุด",
  duration: "ระยะเวลา (นาที)",
  primarySpeaker: "วิทยากรหลัก",
  coSpeakers: "วิทยากรร่วม",
  parallelSession: "เซสชันคู่ขนาน",
  teamNotes: "หมายเหตุทีม",
  sessionOwner: "ผู้รับผิดชอบเซสชัน",
  sessionStatus: "สถานะเซสชัน",
  moveUp: "เลื่อนขึ้น",
  moveDown: "เลื่อนลง",
  removeSession: "ลบเซสชัน",
  duplicateSession: "ทำสำเนาเซสชัน",

  // Agenda summary
  agendaSummaryTitle: "สรุป Agenda",
  agendaTotalMinutes: "รวมเวลาทั้งหมด",
  agendaEarliestStart: "เริ่มเร็วสุด",
  agendaLatestEnd: "จบช้าสุด",
  agendaSessionCount: "จำนวนเซสชัน",
  agendaIncompleteCount: "ข้อมูลยังไม่ครบ",
  agendaOverlapCount: "เวลาซ้อนกัน",

  // Event detail header
  eventDetailHeader: "รายละเอียดงาน",
  editEventData: "แก้ไขข้อมูล",
  eventNotFoundTitle: "ไม่พบงานสัมมนา",
  eventNotFoundBody:
    "ไม่พบงานตามรหัสที่ระบุ อาจถูกลบหรือคุณไม่มีสิทธิ์เข้าถึง",
  backToEventList: "กลับหน้ารวมงาน",
  filterByCategory: "กรองตามหมวด",
  filterAllCategories: "ทุกหมวด",

  // Bullets editor
  detailBullets: "รายละเอียด",
  objectivesBullets: "วัตถุประสงค์",
  outcomesBullets: "ผลลัพธ์ที่คาดหวัง",
  addBullet: "เพิ่มรายการ",
  bulletPlaceholder: "พิมพ์รายการ…",
  deleteBullet: "ลบรายการ",
  duplicateBullet: "ทำสำเนา",

  // Warnings
  warningUnsaved: "มีการแก้ไขที่ยังไม่ได้บันทึก",
  warningNoSessions: "ยังไม่มีเซสชันใน Agenda",
  warningMissingTitle: (index: number) =>
    `เซสชันที่ ${index + 1}: ยังไม่ระบุชื่อ`,
  warningMissingTime: (title: string) =>
    `เซสชัน "${title}": ยังไม่ระบุเวลาเริ่มหรือสิ้นสุด`,
  warningMissingSpeaker: (title: string) =>
    `เซสชัน "${title}": ยังไม่ระบุวิทยากร`,
  warningMissingOwner: (title: string) =>
    `เซสชัน "${title}": ยังไม่ระบุผู้รับผิดชอบ`,
  warningInvalidDuration: (title: string) =>
    `เซสชัน "${title}": ระยะเวลาไม่ถูกต้อง`,
  warningTimeOverlap: (titleA: string, titleB: string) =>
    `เซสชัน "${titleA}" ทับซ้อนกับ "${titleB}"`,
  warningParallelOverlap: (count: number) =>
    `มีเซสชันคู่ขนาน ${count} คู่ที่ทับซ้อนกันในช่วงเวลาเดียวกัน`,

  // Library page
  libraryEyebrow: "Seminar Planner",
  libraryTitle: "คลังเซสชันและ Master Data",
  librarySubtitle:
    "จัดการเซสชัน หมวด รูปแบบ กลุ่มเป้าหมาย วัตถุประสงค์ วิทยากร และสถานะ",
  backToSeminars: "← กลับรายการงาน",
  tabSessions: "เซสชัน",
  tabCategories: "หมวด",
  tabFormats: "รูปแบบ",
  tabTargetGroups: "กลุ่มเป้าหมาย",
  tabPurposes: "วัตถุประสงค์",
  tabSpeakers: "วิทยากร",
  tabStatuses: "สถานะเซสชัน",
  addItem: "เพิ่มรายการ",
  editItem: "แก้ไข",
  deleteItem: "ลบ",
  showArchived: "แสดงที่เก็บถาวร",
  loadingLibrary: "กำลังโหลดคลัง…",
  emptyLibrary: "ยังไม่มีรายการในคลังนี้",
  searchLibrary: "ค้นหา…",
  nameLabel: "ชื่อ *",
  descriptionLabel: "รายละเอียด",
  roleHintLabel: "บทบาท / คำอธิบาย",
  colorHintLabel: "สี (hint)",
  recommendedMinutes: "เวลาแนะนำ (นาที)",
  recommendedFormat: "รูปแบบแนะนำ",
  recommendedSpeaker: "วิทยากรแนะนำ",
  targetGroupNames: "กลุ่มเป้าหมาย (คั่นด้วย comma)",
  active: "ใช้งาน",
  archived: "เก็บถาวร",

  // Library session dialog
  librarySessionTitle: "เซสชันในคลัง",
  newLibrarySession: "เพิ่มเซสชันในคลัง",
  editLibrarySession: "แก้ไขเซสชันในคลัง",

  // Permissions / errors (also used by server actions)
  noPermissionView: "คุณไม่มีสิทธิ์เข้าถึง Seminar Planner",
  noPermissionEdit: "คุณไม่มีสิทธิ์แก้ไข Seminar Planner",
} as const;
