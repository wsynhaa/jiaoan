const STORAGE_KEY = "student-training-a3-form-v1";

const sampleData = {
  major: "数控技术应用",
  className: "数控2301班",
  studentName: "张明",
  studentId: "20230108",
  teacher: "李老师",
  date: "2026-09-17",
  hours: "4",
  station: "车工 03",
  topic: "阶梯轴零件车削加工",
  goals: "1. 能正确识读零件图，确定加工顺序与切削用量。\n2. 能独立完成外圆、台阶、倒角等基本车削操作。\n3. 尺寸精度达到 IT8，表面粗糙度不低于 Ra3.2，并养成安全文明生产习惯。",
  keyPoints: "台阶轴各外圆尺寸控制、长度测量与车刀刃磨、对刀。",
  difficulties: "台阶长度精度、表面粗糙度控制，以及切削用量的合理选择。",
  methods: "教师示范 + 学生独立操作 + 巡回指导 + 实测互检。",
  studyMethods: "看图分析 → 模拟步骤 → 动手操作 → 检测修正 → 总结反思。",
  tools: "90°外圆车刀、45°弯头车刀、切断刀；游标卡尺、外径千分尺；活扳手。",
  materials: "防护眼镜、工作帽；45 钢棒料 φ40×120；切削液、毛刷、棉纱。",
  safetyPrep: "佩戴防护眼镜与工作帽；检查车床各手柄、卡盘扳手、防护罩；清点刀具量具；核对零件图与棒料规格。",
  steps: "1. 装夹棒料，找正并夹紧。\n2. 车端面，钻中心孔。\n3. 粗车外圆至 φ36，留 0.8mm 余量。\n4. 精车 φ32、φ28 台阶外圆至图样尺寸。\n5. 车台阶长度，倒角 C1。\n6. 检测、卸活、清理现场。",
  processNotes: "粗车时振动较明显，降低转速并减小背吃刀量后改善。φ28 外圆第一次车至 28.12，精车修正后合格。切削液应及时加注，切屑用铁钩清理，禁止用手直接清除。",
  qualityCheck: "φ32 实测 31.98，合格；φ28 实测 28.01，合格；台阶长 30 实测 30.05，合格；Ra 约 3.2，外观无磕碰。综合判定：合格。",
  resultSummary: "基本掌握台阶轴车削步骤，能独立完成装夹、对刀、粗精车和检测。尺寸全部合格，操作熟练度仍需提高。",
  safetySummary: "全程佩戴防护用品，卡盘扳手做到随用随取。现场通道畅通，未发生违章操作。",
  maintenanceSummary: "实训结束关闭电源，擦拭导轨并加注润滑油，刀具量具归位，铁屑清扫至指定收集箱，工位卫生达标。",
  reflection: "测量前未擦净油污，导致一次读数偏大。下次应先清洁测量面，精车前再核对余量，并提前刃磨备用车刀。",
  teacherComment: "",
  score: "",
  studentSign: "",
  teacherSign: "",
  signDate: ""
};

function fields() {
  return [...document.querySelectorAll("[data-field]")];
}

function fieldText(el) {
  return (el.innerText || "").replace(/\u200B/g, "").replace(/\n+$/, "");
}

function isBlankField(el) {
  return fieldText(el).trim() === "";
}

function refreshEmptyState(el) {
  if (isBlankField(el)) {
    el.innerHTML = "";
    el.classList.add("is-empty");
  } else {
    el.classList.remove("is-empty");
  }
}

function getFormData() {
  const data = {};
  fields().forEach((el) => {
    data[el.dataset.field] = fieldText(el);
  });
  return data;
}

function setFormData(data) {
  fields().forEach((el) => {
    el.innerText = data[el.dataset.field] || "";
    refreshEmptyState(el);
  });
}

function saveForm() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormData()));
}

function loadForm() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setFormData(JSON.parse(raw));
  } catch (err) {
    console.warn("未能读取本地草稿", err);
  }
}

function fitSheet() {
  const stage = document.getElementById("stage");
  const frame = document.getElementById("sheetFrame");
  const sheet = document.getElementById("sheet");
  if (!stage || !frame || !sheet) return;

  sheet.style.transform = "none";
  const available = Math.max(320, stage.clientWidth - 24);
  const scale = Math.min(available / sheet.offsetWidth, 1);
  sheet.style.transform = `scale(${scale})`;
  frame.style.width = `${sheet.offsetWidth * scale}px`;
  frame.style.height = `${sheet.offsetHeight * scale}px`;
}

function openPrintDialog() {
  document.getElementById("printDialog").hidden = false;
}

function closePrintDialog() {
  document.getElementById("printDialog").hidden = true;
}

function printSheet() {
  closePrintDialog();
  document.title = "学生实训记录表-A3";
  window.print();
}

document.addEventListener("DOMContentLoaded", () => {
  loadForm();
  fields().forEach(refreshEmptyState);
  fitSheet();

  document.getElementById("sheet").addEventListener("input", (event) => {
    const el = event.target.closest("[data-field]");
    if (el) refreshEmptyState(el);
    saveForm();
  });
  document.getElementById("sheet").addEventListener("paste", (event) => {
    const el = event.target.closest("[data-field]");
    if (!el) return;
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text);
  });
  document.getElementById("btnSample").addEventListener("click", () => {
    setFormData(sampleData);
    saveForm();
  });
  document.getElementById("btnClear").addEventListener("click", () => {
    setFormData({});
    localStorage.removeItem(STORAGE_KEY);
  });
  document.getElementById("btnPrint").addEventListener("click", openPrintDialog);
  document.getElementById("btnCancelPrint").addEventListener("click", closePrintDialog);
  document.getElementById("btnConfirmPrint").addEventListener("click", printSheet);
  document.getElementById("printDialog").addEventListener("click", (event) => {
    if (event.target.id === "printDialog") closePrintDialog();
  });

  window.addEventListener("resize", fitSheet);
  window.addEventListener("beforeprint", () => {
    document.getElementById("sheet").style.transform = "none";
    document.getElementById("sheetFrame").style.width = "420mm";
    document.getElementById("sheetFrame").style.height = "297mm";
  });
  window.addEventListener("afterprint", fitSheet);
});
