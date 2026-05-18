const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
const languageSelect = document.getElementById("languageSelect");
const toolTitle = document.getElementById("toolTitle");
const shortcutButtons = document.querySelectorAll(".shortcut[data-tool]");
const resumeSettings = document.getElementById("resumeSettings");
const simp3dSettings = document.getElementById("simp3dSettings");
const sampleButton = document.getElementById("sampleButton");
const startZInput = document.getElementById("startZ");
const nextZInput = document.getElementById("nextZ");
const simp3dLayersInput = document.getElementById("simp3dLayers");
const simp3dHeightInput = document.getElementById("simp3dHeight");
const previewToggle = document.getElementById("previewToggle");
const simp3dPreviewToggle = document.getElementById("simp3dPreviewToggle");
const inputGcode = document.getElementById("inputGcode");
const outputGcode = document.getElementById("outputGcode");
const inputStats = document.getElementById("inputStats");
const outputStats = document.getElementById("outputStats");
const processButton = document.getElementById("processButton");
const copyButton = document.getElementById("copyButton");
const downloadButton = document.getElementById("downloadButton");
const loadProgress = document.getElementById("loadProgress");
const resultLog = document.getElementById("resultLog");

let loadedFileName = "edited.gcode";
let sourceBaseName = "edited";
let sourceGcode = "";
let editedGcode = "";
let lastProcessedNextZ = "";
let lastSimp3dTargetZ = "";
let activeTool = localStorage.getItem("gcodeEditorActiveTool") || "resume-print";
let activeLanguage = localStorage.getItem("gcodeEditorLanguage") || "en";
let sourceLayers = [];
let sourceLineCount = 0;
let sourceIndexDirty = true;
let editedLineCount = 0;
let showGcodePreview = localStorage.getItem("gcodeEditorShowPreview") === "true";

const previewLimit = 1500000;
const messages = {
  en: {
    addTool: "Add Tool",
    appName: "Gcode Editor",
    copyOutput: "Copy Output",
    downloadGcode: "Download .gcode",
    editedGcode: "Edited G-code",
    feature: "Feature",
    function: "Function",
    inputGcode: "Input G-code",
    language: "Language",
    nextZ: "Next Z",
    noFileLoaded: "No file loaded",
    openGcode: "Open G-code",
    outputPlaceholder: "Processed output appears here...",
    pasteGcode: "Paste G-code here...",
    ready: "Ready.",
    resumeCutDescription: "Remove start layer and keep next layer marker",
    resumeCutTitle: "Resume cut",
    resumePrint: "Resume Print",
    runResumePrint: "Run Resume Print",
    sample: "Sample",
    sampleFile: "Sample G-code",
    showPreview: "Show G-code preview",
    simp3dCutDescription: "Keep 3 startup lines after PRINT_START, then resume at calculated Z",
    simp3dCutTitle: "SIMP3D cut",
    simp3dHeightInvalid: "Layer height must be a number greater than 0.",
    simp3dLayerInvalid: "Layer count must be a number greater than 0.",
    simp3dMissingPrintStart: "Could not find PRINT_START at the start of a line.",
    simp3dMissingTarget: "Could not find calculated target ;Z:{targetZ}.",
    simp3dResumeDone: "Kept 3 startup lines after PRINT_START, removed code before ;Z:{targetZ}. {count} line(s) removed.",
    simp3dResumePrint: "SIMP3D Resume Print",
    runSimp3dResumePrint: "Run SIMP3D Resume Print",
    layerCount: "Layer count",
    layerHeight: "Layer height",
    startZ: "Start Z",
    tagline: "Print recovery tools",
    copied: "Edited G-code copied.",
    couldNotFindNextLayer: "Could not find the next layer at ;Z:{nextZ}.",
    couldNotFindStart: "Could not find ;LAYER_CHANGE followed by ;Z:{startZ}.",
    couldNotLoadFile: "Could not load file: {message}",
    downloaded: "Downloaded {fileName}.",
    emptySource: "Load or paste G-code before processing.",
    enterStartZ: "Enter the Start Z value to remove.",
    fileCancelled: "File open cancelled.",
    fileLoaded: "Loaded {fileName} into Input G-code.",
    fileLoadFailed: "File load failed",
    filePickerReady: "Choose a .gcode file to load.",
    fileReading: "Reading {fileName}: {percent}% of {size}.",
    fileStarting: "Starting {fileName} ({size}).",
    largeFileLoaded: "Loaded {fileName}. Large file preview is shown, and the full file will be processed.",
    manualInput: "Manual input",
    nextZHighAlert: "Next Z {nextZ} is higher than the maximum layer in this file ({maxZ}). Next Z will be cleared to 0.00.",
    nextZHighLog: "Next Z is higher than the file maximum. Highest available Z is {maxZ}.",
    nextZInvalid: "Next Z must be a number.",
    nextZMissing: "Next Z {nextZ} was not found. Suggested value: {suggestion}.",
    nextZMissingConfirm: "Next Z {nextZ} was not found in this file. Nearest available next layer is Z:{suggestion}. Use this value?",
    noFileSelected: "No file selected.",
    noNextAfterStart: "No next layer exists after the Start Z layer.",
    outputRequiredCopy: "Run Resume Print before copying.",
    outputRequiredDownload: "Run Resume Print before downloading.",
    previewHidden: "; --- {label} preview only: {size} hidden in the middle ---",
    previewOffInput: "Preview is off for speed. Full input G-code is loaded and ready for processing.",
    previewOffOutput: "Preview is off for speed. Full edited G-code is ready for copy/download.",
    previewNote: "; --- Full file is still used for processing and download ---",
    renderingPreview: "Rendering {fileName} preview...",
    sampleLoaded: "Sample loaded.",
    resumeDone: "Removed start layer ;Z:{startZ} and all code before ;Z:{nextZ}. {count} line(s) removed.",
    waitingForFile: "Waiting for file..."
  },
  cn: {
    addTool: "新增工具",
    appName: "G-code 编辑器",
    copyOutput: "复制输出",
    downloadGcode: "下载 .gcode",
    editedGcode: "已编辑 G-code",
    feature: "功能区",
    function: "功能",
    inputGcode: "输入 G-code",
    language: "语言",
    nextZ: "下一层 Z",
    noFileLoaded: "尚未载入文件",
    openGcode: "打开 G-code",
    outputPlaceholder: "处理后的输出会显示在这里...",
    pasteGcode: "在这里粘贴 G-code...",
    ready: "准备好了。",
    resumeCutDescription: "删除起始层并保留下一层标记",
    resumeCutTitle: "续打裁切",
    resumePrint: "续打 Resume Print",
    runResumePrint: "执行续打",
    sample: "范例",
    sampleFile: "范例 G-code",
    showPreview: "\u663e\u793a G-code \u9884\u89c8",
    simp3dCutDescription: "\u4fdd\u7559 PRINT_START \u540e\u7684 3 \u884c\u542f\u52a8\u4ee3\u7801\uff0c\u7136\u540e\u5728\u8ba1\u7b97\u7684 Z \u7eed\u6253",
    simp3dCutTitle: "SIMP3D \u7eed\u6253\u88c1\u5207",
    simp3dHeightInvalid: "\u5c42\u9ad8\u5fc5\u987b\u662f\u5927\u4e8e 0 \u7684\u6570\u5b57\u3002",
    simp3dLayerInvalid: "\u5c42\u6570\u5fc5\u987b\u662f\u5927\u4e8e 0 \u7684\u6570\u5b57\u3002",
    simp3dMissingPrintStart: "\u627e\u4e0d\u5230\u884c\u9996\u7684 PRINT_START\u3002",
    simp3dMissingTarget: "\u627e\u4e0d\u5230\u8ba1\u7b97\u51fa\u7684\u76ee\u6807 ;Z:{targetZ}\u3002",
    simp3dResumeDone: "\u5df2\u4fdd\u7559 PRINT_START \u540e\u7684 3 \u884c\u542f\u52a8\u4ee3\u7801\uff0c\u5e76\u5220\u9664\u5230 ;Z:{targetZ} \u524d\u7684\u4ee3\u7801\uff0c\u5171\u5220\u9664 {count} \u884c\u3002",
    simp3dResumePrint: "SIMP3D \u7eed\u6253",
    runSimp3dResumePrint: "\u6267\u884c SIMP3D \u7eed\u6253",
    layerCount: "\u5c42\u6570",
    layerHeight: "\u5c42\u9ad8",
    startZ: "起始 Z",
    tagline: "打印恢复工具",
    copied: "已复制编辑后的 G-code。",
    couldNotFindNextLayer: "找不到下一层 ;Z:{nextZ}。",
    couldNotFindStart: "找不到 ;LAYER_CHANGE 后接 ;Z:{startZ}。",
    couldNotLoadFile: "无法载入文件：{message}",
    downloaded: "已下载 {fileName}。",
    emptySource: "请先载入或粘贴 G-code。",
    enterStartZ: "请输入要删除的起始 Z。",
    fileCancelled: "已取消打开文件。",
    fileLoaded: "已将 {fileName} 载入到输入 G-code。",
    fileLoadFailed: "文件载入失败",
    filePickerReady: "请选择一个 .gcode 文件载入。",
    fileReading: "正在读取 {fileName}：{percent}% / {size}。",
    fileStarting: "开始载入 {fileName}（{size}）。",
    largeFileLoaded: "已载入 {fileName}。大文件只显示预览，但会用完整文件处理。",
    manualInput: "手动输入",
    nextZHighAlert: "下一层 Z {nextZ} 高于文件最高层（{maxZ}）。下一层 Z 将清为 0.00。",
    nextZHighLog: "下一层 Z 高于文件最高层。最高可用 Z 是 {maxZ}。",
    nextZInvalid: "下一层 Z 必须是数字。",
    nextZMissing: "找不到下一层 Z {nextZ}。建议值：{suggestion}。",
    nextZMissingConfirm: "文件中找不到下一层 Z {nextZ}。最接近的下一层是 Z:{suggestion}。要使用这个值吗？",
    noFileSelected: "没有选择文件。",
    noNextAfterStart: "起始 Z 后面没有下一层。",
    outputRequiredCopy: "请先执行续打再复制。",
    outputRequiredDownload: "请先执行续打再下载。",
    previewHidden: "; --- {label} 仅显示预览：中间隐藏 {size} ---",
    previewOffInput: "\u4e3a\u4e86\u63d0\u5347\u901f\u5ea6\uff0c\u9884\u89c8\u5df2\u5173\u95ed\u3002\u5b8c\u6574\u8f93\u5165 G-code \u5df2\u8f7d\u5165\uff0c\u53ef\u4ee5\u5904\u7406\u3002",
    previewOffOutput: "\u4e3a\u4e86\u63d0\u5347\u901f\u5ea6\uff0c\u9884\u89c8\u5df2\u5173\u95ed\u3002\u5b8c\u6574\u7f16\u8f91\u540e G-code \u5df2\u51c6\u5907\u597d\uff0c\u53ef\u590d\u5236\u6216\u4e0b\u8f7d\u3002",
    previewNote: "; --- 处理和下载仍然会使用完整文件 ---",
    renderingPreview: "正在渲染 {fileName} 预览...",
    sampleLoaded: "范例已载入。",
    resumeDone: "已删除起始层 ;Z:{startZ} 以及到 ;Z:{nextZ} 之前的代码，共删除 {count} 行。",
    waitingForFile: "等待选择文件..."
  }
};

if (!messages[activeLanguage]) {
  activeLanguage = "en";
}

if (!["resume-print", "simp3d-resume"].includes(activeTool)) {
  activeTool = "resume-print";
}

const sampleGcode = [
  ";FLAVOR:Marlin",
  ";TIME:220",
  ";LAYER_CHANGE",
  ";Z:0.20",
  ";HEIGHT:0.2",
  "G1 X10.000 Y10.000 E0.100",
  "G1 X12.000 Y10.000 E0.180",
  ";LAYER_CHANGE",
  ";Z:0.40",
  ";HEIGHT:0.2",
  "G1 X15.000 Y10.000 E0.260",
  ";LAYER_CHANGE",
  ";Z:0.60",
  ";HEIGHT:0.2",
  "G1 X18.000 Y12.000 E0.340",
  "M106 S255"
].join("\n");

const simp3dSampleGcode = [
  ";HEADER:SIMP3D",
  "PRINT_START",
  "G28",
  "M104 S210",
  "M109 S210",
  "G1 X10 Y10 E0.10",
  ";Z:0.20",
  "G1 X12 Y10 E0.20",
  ";Z:0.40",
  "G1 X15 Y10 E0.30",
  ";Z:0.60",
  "G1 X18 Y12 E0.40"
].join("\n");

function t(key, replacements = {}) {
  const template = messages[activeLanguage][key] || messages.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => replacements[name] ?? "");
}

function applyLanguage() {
  document.documentElement.lang = activeLanguage === "cn" ? "zh-CN" : "en";
  document.title = t("appName");
  languageSelect.value = activeLanguage;
  previewToggle.checked = showGcodePreview;
  simp3dPreviewToggle.checked = showGcodePreview;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  if (!sourceGcode && !inputGcode.value) {
    fileStatus.textContent = t("noFileLoaded");
  } else if (sourceBaseName === "sample") {
    fileStatus.textContent = t("sampleFile");
  } else if (sourceBaseName === "manual") {
    fileStatus.textContent = t("manualInput");
  }

  applyToolUi();
}

function applyToolUi() {
  const isSimp3d = activeTool === "simp3d-resume";
  resumeSettings.hidden = isSimp3d;
  resumeSettings.style.display = isSimp3d ? "none" : "";
  simp3dSettings.hidden = !isSimp3d;
  simp3dSettings.style.display = isSimp3d ? "" : "none";
  toolTitle.textContent = t(isSimp3d ? "simp3dResumePrint" : "resumePrint");
  processButton.textContent = t(isSimp3d ? "runSimp3dResumePrint" : "runResumePrint");
  shortcutButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === activeTool);
  });
}

function setActiveTool(tool) {
  activeTool = tool;
  localStorage.setItem("gcodeEditorActiveTool", activeTool);
  clearOutput();
  applyToolUi();
  setLog(t("ready"));
}

function normalizeZ(value) {
  return String(value || "")
    .trim()
    .replace(/^z:/i, "")
    .replace(/^z/i, "")
    .trim();
}

function countLines(text) {
  if (!text) {
    return 0;
  }

  let lines = 1;
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) {
      lines += 1;
    }
  }
  return lines;
}

function lineLabel(count, isPreview = false) {
  const suffix = isPreview ? (activeLanguage === "cn" ? "（预览）" : " (preview)") : "";
  return activeLanguage === "cn" ? `${count} 行${suffix}` : `${count} lines${suffix}`;
}

function updateStats() {
  const inputLineCount = sourceLineCount || countLines(sourceGcode || inputGcode.value);
  const outputLineCount = editedLineCount || countLines(editedGcode || outputGcode.value);
  inputStats.textContent = lineLabel(inputLineCount, inputGcode.readOnly);
  outputStats.textContent = lineLabel(outputLineCount, outputGcode.value.includes("preview only"));
}

function setLog(message, type = "") {
  resultLog.textContent = message;
  resultLog.className = `result-log ${type}`.trim();
}

function clearOutput() {
  editedGcode = "";
  editedLineCount = 0;
  outputGcode.value = "";
  lastProcessedNextZ = "";
  lastSimp3dTargetZ = "";
  outputStats.textContent = lineLabel(0);
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setProgress(value) {
  loadProgress.hidden = false;
  loadProgress.value = Math.max(0, Math.min(100, value));
}

function hideProgress() {
  loadProgress.hidden = true;
  loadProgress.value = 0;
}

function nextPaint() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }

    setTimeout(resolve, 0);
  });
}

function buildPreview(text, label) {
  if (text.length <= previewLimit) {
    return { text, isPreview: false };
  }

  const partLength = Math.floor(previewLimit / 2);
  const omitted = text.length - previewLimit;
  const marker = [
    "",
    t("previewHidden", { label, size: formatBytes(omitted) }),
    t("previewNote"),
    ""
  ].join("\n");

  return {
    text: `${text.slice(0, partLength)}${marker}${text.slice(-partLength)}`,
    isPreview: true
  };
}

function renderInputGcode() {
  if (!showGcodePreview && sourceGcode) {
    inputGcode.value = t("previewOffInput");
    inputGcode.readOnly = true;
    inputStats.textContent = lineLabel(sourceLineCount || countLines(sourceGcode));
    return;
  }

  const preview = buildPreview(sourceGcode, t("inputGcode"));
  inputGcode.value = preview.text;
  inputGcode.readOnly = preview.isPreview;
  inputStats.textContent = lineLabel(sourceLineCount || countLines(sourceGcode), preview.isPreview);
}

function renderOutputGcode() {
  if (!showGcodePreview && editedGcode) {
    outputGcode.value = t("previewOffOutput");
    outputStats.textContent = lineLabel(editedLineCount || countLines(editedGcode));
    return;
  }

  const preview = buildPreview(editedGcode, t("editedGcode"));
  outputGcode.value = preview.text;
  outputStats.textContent = lineLabel(editedLineCount || countLines(editedGcode), preview.isPreview);
}

function readFileText(file) {
  if (typeof FileReader === "undefined") {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error || new Error("Unknown file read error."));
    };

    reader.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const percent = Math.round((event.loaded / event.total) * 100);
      setProgress(percent);
      setLog(t("fileReading", { fileName: file.name, percent, size: formatBytes(file.size) }), "info");
    };

    reader.onload = () => {
      resolve(String(reader.result || ""));
    };

    reader.readAsText(file);
  });
}

function readLineAt(text, start, end) {
  let lineEnd = end;
  if (lineEnd > start && text.charCodeAt(lineEnd - 1) === 13) {
    lineEnd -= 1;
  }
  return text.slice(start, lineEnd);
}

function buildGcodeIndex(text) {
  const layers = [];
  let lineNumber = 1;
  let lineStart = 0;
  let pendingLayer = null;

  while (lineStart <= text.length) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd === -1) {
      lineEnd = text.length;
    }

    const line = readLineAt(text, lineStart, lineEnd).trim();

    if (line.toUpperCase() === ";LAYER_CHANGE") {
      pendingLayer = {
        index: lineStart,
        lineNumber
      };
    } else if (pendingLayer) {
      const zText = getZValue(line);
      const zNumber = Number(zText);

      if (zText && Number.isFinite(zNumber)) {
        layers.push({
          index: pendingLayer.index,
          lineNumber: pendingLayer.lineNumber,
          zText,
          zNumber
        });
      }

      pendingLayer = null;
    }

    if (lineEnd === text.length) {
      break;
    }

    lineNumber += 1;
    lineStart = lineEnd + 1;
  }

  return {
    layers,
    lineCount: text ? lineNumber : 0
  };
}

function rebuildSourceIndex() {
  const index = buildGcodeIndex(sourceGcode);
  sourceLayers = index.layers;
  sourceLineCount = index.lineCount;
  sourceIndexDirty = false;
  return index;
}

function getSourceIndex() {
  return sourceIndexDirty ? rebuildSourceIndex() : { layers: sourceLayers, lineCount: sourceLineCount };
}

async function loadGcodeFile(file) {
  if (!file) {
    fileStatus.textContent = inputGcode.value ? loadedFileName : t("noFileLoaded");
    setLog(t("noFileSelected"), "warning");
    return;
  }

  try {
    setProgress(0);
    setLog(t("fileStarting", { fileName: file.name, size: formatBytes(file.size) }), "info");
    sourceBaseName = file.name.replace(/\.(gcode|gco|gc|txt)$/i, "") || "edited";
    loadedFileName = `${sourceBaseName}.resume.gcode`;
    sourceGcode = await readFileText(file);
    sourceIndexDirty = true;
    rebuildSourceIndex();
    setLog(t("renderingPreview", { fileName: file.name }), "info");
    await nextPaint();
    renderInputGcode();
    clearOutput();
    fileStatus.textContent = file.name;
    hideProgress();

    if (inputGcode.readOnly) {
      setLog(t("largeFileLoaded", { fileName: file.name }), "success");
    } else {
      setLog(t("fileLoaded", { fileName: file.name }), "success");
    }
  } catch (error) {
    hideProgress();
    fileStatus.textContent = t("fileLoadFailed");
    setLog(t("couldNotLoadFile", { message: error.message }), "warning");
  }
}

function getZValue(line) {
  const match = line.trim().match(/^;Z:\s*([+-]?\d+(?:\.\d+)?)/i);
  return match ? match[1] : "";
}

function zMatches(found, expected) {
  const foundNumber = Number(found);
  const expectedNumber = Number(expected);

  if (Number.isFinite(foundNumber) && Number.isFinite(expectedNumber)) {
    return Math.abs(foundNumber - expectedNumber) < 0.000001;
  }

  return found === expected;
}

function formatZ(value) {
  return Number(value).toFixed(2);
}

function sanitizeFilePart(value) {
  return String(value || "edited").replace(/[\\/:*?"<>|]+/g, "_").trim() || "edited";
}

function zFilePart(value) {
  const normalized = normalizeZ(value || lastProcessedNextZ || nextZInput.value);
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? formatZ(numeric) : normalized || "0.00";
}

function buildDownloadFileName() {
  if (activeTool === "simp3d-resume") {
    return `${sanitizeFilePart(sourceBaseName)}.simp3d-resume.Z-${zFilePart(lastSimp3dTargetZ)}.gcode`;
  }

  return `${sanitizeFilePart(sourceBaseName)}.resume.nextZ-${zFilePart()}.gcode`;
}

function resolveNextZ(index, startZ, requestedNextZ) {
  if (!requestedNextZ) {
    return "";
  }

  const requestedNumber = Number(requestedNextZ);

  if (!Number.isFinite(requestedNumber)) {
    setLog(t("nextZInvalid"), "warning");
    nextZInput.focus();
    return null;
  }

  const layers = index.layers;
  const startLayer = layers.find((layer) => zMatches(layer.zText, startZ));

  if (!startLayer) {
    return requestedNextZ;
  }

  const candidates = layers.filter((layer) => layer.index > startLayer.index);

  if (!candidates.length) {
    setLog(t("noNextAfterStart"), "warning");
    return null;
  }

  const maxLayer = layers.reduce((highest, layer) => layer.zNumber > highest.zNumber ? layer : highest, layers[0]);

  if (requestedNumber > maxLayer.zNumber) {
    alert(t("nextZHighAlert", { nextZ: requestedNextZ, maxZ: formatZ(maxLayer.zNumber) }));
    nextZInput.value = "0.00";
    clearOutput();
    setLog(t("nextZHighLog", { maxZ: formatZ(maxLayer.zNumber) }), "warning");
    nextZInput.focus();
    return null;
  }

  if (candidates.some((layer) => zMatches(layer.zText, requestedNextZ))) {
    return requestedNextZ;
  }

  const nearest = candidates.reduce((best, layer) => {
    const bestDistance = Math.abs(best.zNumber - requestedNumber);
    const layerDistance = Math.abs(layer.zNumber - requestedNumber);
    return layerDistance < bestDistance ? layer : best;
  }, candidates[0]);

  const ok = confirm(t("nextZMissingConfirm", { nextZ: requestedNextZ, suggestion: formatZ(nearest.zNumber) }));

  if (!ok) {
    setLog(t("nextZMissing", { nextZ: requestedNextZ, suggestion: formatZ(nearest.zNumber) }), "warning");
    nextZInput.focus();
    return null;
  }

  nextZInput.value = formatZ(nearest.zNumber);
  return nearest.zText;
}

function removeResumePrintSection(gcode, index, startZ, nextZ) {
  const layers = index.layers;
  const startLayerIndex = layers.findIndex((layer) => zMatches(layer.zText, startZ));

  if (startLayerIndex === -1) {
    throw new Error(t("couldNotFindStart", { startZ }));
  }

  const nextLayerIndex = nextZ
    ? layers.findIndex((layer, indexValue) => indexValue > startLayerIndex && zMatches(layer.zText, nextZ))
    : startLayerIndex + 1;

  if (nextLayerIndex === -1 || nextLayerIndex >= layers.length) {
    throw new Error(t("couldNotFindNextLayer", { nextZ }));
  }

  const startLayer = layers[startLayerIndex];
  const nextLayer = layers[nextLayerIndex];
  const removedLines = nextLayer.lineNumber - startLayer.lineNumber;

  return {
    text: gcode.slice(0, startLayer.index) + gcode.slice(nextLayer.index),
    removedLines,
    nextZ: nextLayer.zText,
    lineCount: index.lineCount - removedLines
  };
}

function calculateSimp3dTarget() {
  const layerCount = Number(simp3dLayersInput.value);
  const layerHeight = Number(simp3dHeightInput.value);

  if (!Number.isFinite(layerCount) || layerCount <= 0) {
    setLog(t("simp3dLayerInvalid"), "warning");
    simp3dLayersInput.focus();
    return null;
  }

  if (!Number.isFinite(layerHeight) || layerHeight <= 0) {
    setLog(t("simp3dHeightInvalid"), "warning");
    simp3dHeightInput.focus();
    return null;
  }

  return layerCount * layerHeight;
}

function findSimp3dCut(text, targetNumber) {
  let lineStart = 0;
  let lineNumber = 1;
  let printStart = null;
  let startupLines = 0;
  let keepStart = 0;
  let keepEnd = null;
  let targetLayer = null;

  while (lineStart <= text.length) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd === -1) {
      lineEnd = text.length;
    }

    const line = readLineAt(text, lineStart, lineEnd).trim();

    if (!printStart && line.toUpperCase() === "PRINT_START") {
      printStart = { index: lineStart, lineNumber };
      keepStart = lineEnd < text.length ? lineEnd + 1 : text.length;
    } else if (printStart && keepEnd === null) {
      startupLines += 1;

      if (startupLines === 3) {
        keepEnd = lineEnd < text.length ? lineEnd + 1 : text.length;
      }
    } else if (keepEnd !== null && zMatches(getZValue(line), String(targetNumber))) {
      targetLayer = { index: lineStart, lineNumber, zText: getZValue(line) };
      break;
    }

    if (lineEnd === text.length) {
      break;
    }

    lineNumber += 1;
    lineStart = lineEnd + 1;
  }

  if (!printStart) {
    throw new Error(t("simp3dMissingPrintStart"));
  }

  if (!targetLayer || keepEnd === null) {
    throw new Error(t("simp3dMissingTarget", { targetZ: formatZ(targetNumber) }));
  }

  return {
    text: text.slice(0, printStart.index) + text.slice(keepStart, keepEnd) + text.slice(targetLayer.index),
    removedLines: targetLayer.lineNumber - printStart.lineNumber - 3,
    targetZ: targetLayer.zText || formatZ(targetNumber)
  };
}

function runResumePrint() {
  const source = inputGcode.readOnly ? sourceGcode : inputGcode.value;
  const startZ = normalizeZ(startZInput.value);
  const requestedNextZ = normalizeZ(nextZInput.value);

  if (!source.trim()) {
    setLog(t("emptySource"), "warning");
    return;
  }

  if (!startZ) {
    setLog(t("enterStartZ"), "warning");
    startZInput.focus();
    return;
  }

  try {
    if (source !== sourceGcode) {
      sourceGcode = source;
      sourceIndexDirty = true;
    }

    const index = getSourceIndex();
    const nextZ = resolveNextZ(index, startZ, requestedNextZ);

    if (nextZ === null) {
      return;
    }

    const result = removeResumePrintSection(source, index, startZ, nextZ);
    editedGcode = result.text;
    editedLineCount = result.lineCount;
    lastProcessedNextZ = formatZ(Number(result.nextZ));
    renderOutputGcode();
    setLog(t("resumeDone", { startZ, nextZ: result.nextZ, count: result.removedLines }), "success");
  } catch (error) {
    editedGcode = "";
    outputGcode.value = "";
    updateStats();
    setLog(error.message, "warning");
  }
}

function runSimp3dResumePrint() {
  const source = inputGcode.readOnly ? sourceGcode : inputGcode.value;
  const targetNumber = calculateSimp3dTarget();

  if (!source.trim()) {
    setLog(t("emptySource"), "warning");
    return;
  }

  if (targetNumber === null) {
    return;
  }

  try {
    if (source !== sourceGcode) {
      sourceGcode = source;
      sourceLineCount = countLines(sourceGcode);
      sourceIndexDirty = true;
    }

    const result = findSimp3dCut(source, targetNumber);
    editedGcode = result.text;
    editedLineCount = sourceLineCount ? sourceLineCount - result.removedLines : countLines(editedGcode);
    lastSimp3dTargetZ = formatZ(Number(result.targetZ));
    renderOutputGcode();
    setLog(t("simp3dResumeDone", { targetZ: result.targetZ, count: result.removedLines }), "success");
  } catch (error) {
    editedGcode = "";
    editedLineCount = 0;
    outputGcode.value = "";
    updateStats();
    setLog(error.message, "warning");
  }
}

fileInput.addEventListener("click", () => {
  fileInput.value = "";
  fileStatus.textContent = t("waitingForFile");
  setLog(t("filePickerReady"), "info");
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  await loadGcodeFile(file);
});

fileInput.addEventListener("cancel", () => {
  fileStatus.textContent = inputGcode.value ? loadedFileName : t("noFileLoaded");
  setLog(t("fileCancelled"), "warning");
});

sampleButton.addEventListener("click", () => {
  sourceBaseName = "sample";
  loadedFileName = "sample.resume.gcode";
  sourceGcode = activeTool === "simp3d-resume" ? simp3dSampleGcode : sampleGcode;
  sourceIndexDirty = true;
  rebuildSourceIndex();
  renderInputGcode();
  clearOutput();
  if (activeTool === "simp3d-resume") {
    simp3dLayersInput.value = "3";
    simp3dHeightInput.value = "0.20";
  } else {
    startZInput.value = "0.40";
    nextZInput.value = "0.60";
  }
  fileStatus.textContent = t("sampleFile");
  updateStats();
  setLog(t("sampleLoaded"));
});

inputGcode.addEventListener("input", () => {
  if (inputGcode.readOnly) {
    return;
  }

  sourceGcode = inputGcode.value;
  sourceLineCount = countLines(sourceGcode);
  sourceIndexDirty = true;
  sourceBaseName = "manual";
  clearOutput();
  inputStats.textContent = lineLabel(sourceLineCount);
  fileStatus.textContent = inputGcode.value ? t("manualInput") : t("noFileLoaded");
});

processButton.addEventListener("click", () => {
  if (activeTool === "simp3d-resume") {
    runSimp3dResumePrint();
    return;
  }

  runResumePrint();
});

copyButton.addEventListener("click", async () => {
  const output = editedGcode || outputGcode.value;

  if (!output) {
    setLog(t("outputRequiredCopy"), "warning");
    return;
  }

  await navigator.clipboard.writeText(output);
  setLog(t("copied"), "success");
});

downloadButton.addEventListener("click", () => {
  const output = editedGcode || outputGcode.value;

  if (!output) {
    setLog(t("outputRequiredDownload"), "warning");
    return;
  }

  const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const downloadName = buildDownloadFileName();
  link.href = url;
  link.download = downloadName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setLog(t("downloaded", { fileName: downloadName }), "success");
});

languageSelect.addEventListener("change", () => {
  activeLanguage = languageSelect.value;
  localStorage.setItem("gcodeEditorLanguage", activeLanguage);
  applyLanguage();
  renderInputGcode();

  if (editedGcode) {
    renderOutputGcode();
  } else {
    outputStats.textContent = lineLabel(0);
  }
});

previewToggle.addEventListener("change", () => {
  showGcodePreview = previewToggle.checked;
  simp3dPreviewToggle.checked = showGcodePreview;
  localStorage.setItem("gcodeEditorShowPreview", String(showGcodePreview));
  renderInputGcode();

  if (editedGcode) {
    renderOutputGcode();
  }
});

simp3dPreviewToggle.addEventListener("change", () => {
  showGcodePreview = simp3dPreviewToggle.checked;
  previewToggle.checked = showGcodePreview;
  localStorage.setItem("gcodeEditorShowPreview", String(showGcodePreview));
  renderInputGcode();

  if (editedGcode) {
    renderOutputGcode();
  }
});

shortcutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTool(button.dataset.tool);
  });
});

applyLanguage();
updateStats();
