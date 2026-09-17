const WORD_BORDER = "2F9A68";
const WORD_INK = "1B5E42";
const WORD_TITLE = "汽车工程系实训课程报告";
const COLS = 8;
const COL_W = 1310;
const TABLE_W = COLS * COL_W;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
  const buf = new Uint8Array(2);
  buf[0] = value & 0xff;
  buf[1] = (value >>> 8) & 0xff;
  return buf;
}

function u32(value) {
  const buf = new Uint8Array(4);
  buf[0] = value & 0xff;
  buf[1] = (value >>> 8) & 0xff;
  buf[2] = (value >>> 16) & 0xff;
  buf[3] = (value >>> 24) & 0xff;
  return buf;
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data
    ]);
    const central = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  });

  const centralDir = concatBytes(centrals);
  const eocd = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0)
  ]);
  return concatBytes([...locals, centralDir, eocd]);
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function borderXml() {
  const side = (name) =>
    `<w:${name} w:val="single" w:sz="8" w:space="0" w:color="${WORD_BORDER}"/>`;
  return `<w:tcBorders>${side("top")}${side("left")}${side("bottom")}${side("right")}</w:tcBorders>`;
}

function textParagraphs(text, options = {}) {
  const lines = String(text ?? "").split("\n");
  const usable = lines.length ? lines : [""];
  const align = options.center ? `<w:jc w:val="center"/>` : "";
  const size = options.size || 21;
  const bold = options.bold ? "<w:b/>" : "";
  const color = options.color || "163528";
  return usable
    .map(
      (line) => `<w:p>
      <w:pPr>${align}<w:spacing w:before="20" w:after="20"/></w:pPr>
      <w:r>
        <w:rPr>${bold}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:rFonts w:ascii="Microsoft YaHei" w:eastAsia="Microsoft YaHei" w:hAnsi="Microsoft YaHei"/>
        </w:rPr>
        <w:t xml:space="preserve">${xmlEscape(line)}</w:t>
      </w:r>
    </w:p>`
    )
    .join("");
}

function cell(text, span, options = {}) {
  const width = (span || 1) * COL_W;
  const vMerge = options.vMerge
    ? `<w:vMerge w:val="${options.vMerge}"/>`
    : "";
  const vAlign = options.top ? "top" : "center";
  return `<w:tc>
    <w:tcPr>
      <w:tcW w:w="${width}" w:type="dxa"/>
      <w:gridSpan w:val="${span || 1}"/>
      ${vMerge}
      <w:vAlign w:val="${vAlign}"/>
      ${borderXml()}
    </w:tcPr>
    ${textParagraphs(text, options)}
  </w:tc>`;
}

function labelCell(text, span, options = {}) {
  return cell(text, span, {
    bold: true,
    center: true,
    color: WORD_INK,
    size: 21,
    ...options
  });
}

function row(cells, height) {
  const h = height
    ? `<w:trHeight w:val="${height}" w:hRule="atLeast"/>`
    : "";
  return `<w:tr><w:trPr>${h}</w:trPr>${cells}</w:tr>`;
}

function table(rowsXml) {
  const grid = Array.from({ length: COLS }, () => `<w:gridCol w:w="${COL_W}"/>`).join("");
  const side = (name) =>
    `<w:${name} w:val="single" w:sz="8" w:space="0" w:color="${WORD_BORDER}"/>`;
  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="${TABLE_W}" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      <w:jc w:val="center"/>
      <w:tblBorders>${side("top")}${side("left")}${side("bottom")}${side("right")}${side("insideH")}${side("insideV")}</w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="40" w:type="dxa"/>
        <w:left w:w="80" w:type="dxa"/>
        <w:bottom w:w="40" w:type="dxa"/>
        <w:right w:w="80" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tblGrid>${grid}</w:tblGrid>
    ${rowsXml}
  </w:tbl>`;
}

function sectionProps() {
  return `<w:sectPr>
    <w:pgSz w:w="11906" w:h="16838"/>
    <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="0" w:footer="0"/>
  </w:sectPr>`;
}

function frontTable(data) {
  return table(
    [
      row(labelCell(WORD_TITLE, 8, { size: 32 }), 500),
      row(
        labelCell("专业", 1) +
          cell(data.major, 1) +
          labelCell("班级", 1) +
          cell(data.className, 1) +
          labelCell("姓名", 1) +
          cell(data.studentName, 1) +
          labelCell("学号", 1) +
          cell(data.studentId, 1),
        380
      ),
      row(
        labelCell("指导教师", 1) +
          cell(data.teacher, 2) +
          labelCell("实训日期", 1) +
          cell(data.date, 1) +
          labelCell("课时", 1) +
          cell(data.hours, 2),
        380
      ),
      row(labelCell("实训课题", 1) + cell(data.topic, 7), 420),
      row(labelCell("实训目标", 1, { top: true }) + cell(data.goals, 7, { top: true }), 1100),
      row(labelCell("实训方法", 1) + cell(data.methods, 7), 420),
      row(labelCell("学习方法", 1) + cell(data.studyMethods, 7), 420),
      row(
        labelCell("实训准备", 1, { vMerge: "restart", top: true }) +
          labelCell("工具、仪器", 2) +
          cell(data.tools, 5),
        420
      ),
      row(cell("", 1, { vMerge: "continue" }) + labelCell("防护、材料", 2) + cell(data.materials, 5), 420),
      row(
        labelCell("实训实施", 1, { vMerge: "restart", top: true }) +
          cell("一、安全检查与准备工作\n" + (data.safetyPrep || ""), 7, { top: true }),
        900
      ),
      row(
        cell("", 1, { vMerge: "continue" }) +
          cell("二、操作步骤\n" + (data.steps || ""), 7, { top: true }),
        2200
      )
    ].join("")
  );
}

function backTable(data) {
  return table(
    [
      row(labelCell(WORD_TITLE, 8, { size: 32 }), 500),
      row(
        labelCell("实训实施", 1, { vMerge: "restart", top: true }) +
          cell("三、过程记录与问题处理\n" + (data.processNotes || ""), 7, { top: true }),
        2200
      ),
      row(
        cell("", 1, { vMerge: "continue" }) +
          cell("四、检测记录\n" + (data.qualityCheck || ""), 7, { top: true }),
        900
      ),
      row(
        labelCell("小结", 1, { vMerge: "restart", top: true }) +
          cell("实训效果与学习收获总结：\n" + (data.resultSummary || ""), 7, { top: true }),
        780
      ),
      row(
        cell("", 1, { vMerge: "continue" }) +
          cell("现场管理与安全总结：\n" + (data.safetySummary || ""), 7, { top: true }),
        780
      ),
      row(
        cell("", 1, { vMerge: "continue" }) +
          cell("设备、车辆维护与实训场地卫生总结：\n" + (data.maintenanceSummary || ""), 7, { top: true }),
        780
      ),
      row(labelCell("实训反思", 1, { top: true }) + cell(data.reflection, 7, { top: true }), 900),
      row(labelCell("教师评价", 1, { top: true }) + cell(data.teacherComment, 7, { top: true }), 780),
      row(
        labelCell("成绩", 1) +
          cell(data.score, 1) +
          labelCell("教师签名", 2) +
          cell(data.teacherSign, 2) +
          labelCell("日期", 1) +
          cell(data.signDate, 1),
        420
      )
    ].join("")
  );
}

function documentXml(data) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${frontTable(data)}
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
    ${backTable(data)}
    ${sectionProps()}
  </w:body>
</w:document>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function documentRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Microsoft YaHei" w:eastAsia="Microsoft YaHei" w:hAnsi="Microsoft YaHei"/>
        <w:sz w:val="21"/>
        <w:szCs w:val="21"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
</w:styles>`;
}

function settingsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:characterSpacingControl w:val="compressPunctuation"/>
</w:settings>`;
}

function safeFilePart(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|]/g, "")
    .trim();
}

function exportTrainingReportWord() {
  const data = typeof getFormData === "function" ? getFormData() : {};
  const encoder = new TextEncoder();
  const bytes = zipStore([
    { name: "[Content_Types].xml", data: encoder.encode(contentTypesXml()) },
    { name: "_rels/.rels", data: encoder.encode(relsXml()) },
    { name: "word/_rels/document.xml.rels", data: encoder.encode(documentRelsXml()) },
    { name: "word/document.xml", data: encoder.encode(documentXml(data)) },
    { name: "word/styles.xml", data: encoder.encode(stylesXml()) },
    { name: "word/settings.xml", data: encoder.encode(settingsXml()) }
  ]);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });
  const who = safeFilePart(data.studentName);
  const topic = safeFilePart(data.topic).slice(0, 20);
  const extra = [who, topic].filter(Boolean).join("-");
  const filename = extra
    ? `${WORD_TITLE}-${extra}.docx`
    : `${WORD_TITLE}.docx`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
