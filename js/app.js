const STORAGE_KEY = "nev-training-a3-form-v1";

const sampleData = {
  major: "新能源汽车",
  className: "新能源2301班",
  studentName: "张明",
  studentId: "20230108",
  teacher: "李老师",
  date: "2026-09-17",
  hours: "4",
  topic: "动力电池包拆装与绝缘检测",
  goals: "1. 能说出高压安全操作规范、下电流程和一人操作一人监护要求。\n2. 能正确穿戴绝缘防护用品，完成验电与绝缘检测。\n3. 能按工艺拆装动力电池包连接器，并如实填写检测记录。",
  methods: "教师示范 + 分组实操 + 高压监护 + 检测互检。",
  studyMethods: "看高压回路图 → 模拟下电 → 实操拆装 → 检测记录 → 总结反思。",
  tools: "诊断仪、绝缘电阻表、万用表、扭力扳手、电池包专用拆装工具。",
  materials: "绝缘手套、绝缘鞋、护目镜、绝缘垫、警示牌；动力电池实训台架。",
  safetyPrep: "检查绝缘手套无破损并做气密检查；穿绝缘鞋、戴护目镜；设置警示区；车辆下电，等待放电后验电；一人操作、一人监护。",
  steps: "1. 穿戴高压防护用品并设置警示隔离。\n2. 断开维修开关，执行整车下电。\n3. 等待规定时间后验电，确认无电压。\n4. 拆卸电池包高压连接器并做好绝缘防护。\n5. 测量电池包对地绝缘电阻并记录。\n6. 按扭矩要求复装，恢复上电并做系统自检。\n7. 清理现场，交还工具与防护用品。",
  processNotes: "下电后未到规定等待时间不得验电。第一次绝缘检测表笔接触不良，读数偏低，清洁测量点后复测正常。拆装连接器时保持水平，避免插针弯曲。全程未单人操作高压部位。",
  qualityCheck: "维修开关已断开；验电为 0V；绝缘电阻 520 MΩ，合格；连接器扭矩按工艺拧紧；上电后无高压故障码。综合判定：合格。",
  resultSummary: "掌握动力电池包高压下电、验电、绝缘检测和连接器拆装要点。能独立完成防护穿戴与检测记录，拆装手法还需更熟练。",
  safetySummary: "全程穿戴绝缘防护，工位设置警示隔离，坚持一人操作一人监护，未发生带电作业或跨过警示区。",
  maintenanceSummary: "实训结束恢复台架防护盖，诊断仪和绝缘表关机归位，绝缘手套擦净晾放，场地无油污、无遗留螺栓。",
  reflection: "验电前等待时间不够，被监护同学提醒后重做。下次先确认下电等待时长，再清洁测量点，并提前检查绝缘手套气密。",
  teacherComment: "",
  score: "",
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
  document.title = "汽车工程系实训课程报告-A4正反面";
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
    document.getElementById("sheetFrame").style.width = "210mm";
    document.getElementById("sheetFrame").style.height = "auto";
  });
  window.addEventListener("afterprint", fitSheet);
});
