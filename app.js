import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
const fileInputLabel = document.querySelector(".file-input-label");
const languageSelect = document.getElementById("languageSelect");
const toolTitle = document.getElementById("toolTitle");
const shortcutButtons = document.querySelectorAll(".shortcut[data-tool]");
const resumeSettings = document.getElementById("resumeSettings");
const simp3dSettings = document.getElementById("simp3dSettings");
const stlSettings = document.getElementById("stlSettings");
const stlWorkspace = document.getElementById("stlWorkspace");
const gcodeWorkspace = document.getElementById("gcodeWorkspace");
const gcodeActions = document.getElementById("gcodeActions");
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
const stlUnitSelect = document.getElementById("stlUnit");
const stlResizeModeSelect = document.getElementById("stlResizeMode");
const stlLockProportionsInput = document.getElementById("stlLockProportions");
const stlCanvas = document.getElementById("stlCanvas");
const stlEmpty = document.getElementById("stlEmpty");
const stlDimensionX = document.getElementById("stlDimensionX");
const stlDimensionY = document.getElementById("stlDimensionY");
const stlDimensionZ = document.getElementById("stlDimensionZ");
const stlVolume = document.getElementById("stlVolume");
const stlSurfaceArea = document.getElementById("stlSurfaceArea");
const stlScalePercentInput = document.getElementById("stlScalePercent");
const stlScaleXInput = document.getElementById("stlScaleX");
const stlScaleYInput = document.getElementById("stlScaleY");
const stlScaleZInput = document.getElementById("stlScaleZ");
const stlTargetXInput = document.getElementById("stlTargetX");
const stlTargetYInput = document.getElementById("stlTargetY");
const stlTargetZInput = document.getElementById("stlTargetZ");
const stlResetButton = document.getElementById("stlResetButton");
const stlExportButton = document.getElementById("stlExportButton");

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
let stlGeometry = null;
let stlMesh = null;
let stlBaseBox = null;
let stlBaseCenter = new THREE.Vector3();
let stlBaseDimensions = { x: 0, y: 0, z: 0 };
let stlScale = { x: 1, y: 1, z: 1 };
let stlSourceName = "model";
let stlRenderer = null;
let stlScene = null;
let stlCamera = null;
let stlControls = null;
let stlResizeObserver = null;
let stlAnimationStarted = false;
let isUpdatingStlControls = false;

const previewLimit = 1500000;
const messages = {
  en: {
    addTool: "Add Tool",
    appName: "Weeseng Advertising",
    copyOutput: "Copy Output",
    dimensionX: "X size",
    dimensionY: "Y size",
    dimensionZ: "Z size",
    displayUnit: "Display unit",
    downloadGcode: "Download .gcode",
    editedGcode: "Edited G-code",
    exportResizedStl: "Export resized STL",
    feature: "Tools",
    gcodeEditorGroup: "Tools G-code Editor",
    freeScale: "Free X/Y/Z scale",
    function: "Function",
    inputGcode: "Input G-code",
    language: "Language",
    lockProportions: "Lock proportions",
    measurements: "Measurements",
    meshVolume: "Volume",
    nextZ: "Next Z",
    noFileLoaded: "No file loaded",
    openGcode: "Open G-code",
    openStl: "Open STL",
    outputPlaceholder: "Processed output appears here...",
    pasteGcode: "Paste G-code here...",
    ready: "Ready.",
    resetScale: "Reset scale",
    resizeMode: "Resize mode",
    resizeModel: "Resize model",
    resumeCutDescription: "Remove start layer and keep next layer marker",
    resumeCutTitle: "Resume cut",
    resumePrint: "Resume Print",
    runResumePrint: "Run Resume Print",
    sample: "Sample",
    sampleFile: "Sample G-code",
    scalePercent: "Scale %",
    scaleX: "Scale X %",
    scaleY: "Scale Y %",
    scaleZ: "Scale Z %",
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
    stlEmpty: "Open or sample an STL file to view the model.",
    stlExportDone: "Exported {fileName}.",
    stlExportMissing: "Load an STL before exporting.",
    stlFileLoaded: "Loaded {fileName}. Dimensions, volume, and surface area are ready.",
    stlFileReading: "Reading {fileName}.",
    stlLoadFailed: "Could not load STL: {message}",
    stlMeasureDescription: "View dimensions, volume, and surface area",
    stlMeasureTitle: "Model measurements",
    stlSampleFile: "Sample STL cube",
    stlSampleLoaded: "Sample cube loaded. 20 mm on each side.",
    stlViewer: "3D Viewer - Area Checker",
    surfaceArea: "Surface area",
    tagline: "Production tools",
    viewerGroup: "3D Viewer",
    targetX: "Target X",
    targetY: "Target Y",
    targetZ: "Target Z",
    uniformScale: "Uniform scale",
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
    appName: "Weeseng Advertising",
    copyOutput: "复制输出",
    dimensionX: "X 尺寸",
    dimensionY: "Y 尺寸",
    dimensionZ: "Z 尺寸",
    displayUnit: "显示单位",
    downloadGcode: "下载 .gcode",
    editedGcode: "已编辑 G-code",
    exportResizedStl: "导出调整后的 STL",
    feature: "工具",
    gcodeEditorGroup: "G-code 编辑工具",
    freeScale: "自由 X/Y/Z 缩放",
    function: "功能",
    inputGcode: "输入 G-code",
    language: "语言",
    lockProportions: "锁定比例",
    measurements: "测量",
    meshVolume: "体积",
    nextZ: "下一层 Z",
    noFileLoaded: "尚未载入文件",
    openGcode: "打开 G-code",
    openStl: "打开 STL",
    outputPlaceholder: "处理后的输出会显示在这里...",
    pasteGcode: "在这里粘贴 G-code...",
    ready: "准备好了。",
    resetScale: "重置缩放",
    resizeMode: "缩放模式",
    resizeModel: "调整模型尺寸",
    resumeCutDescription: "删除起始层并保留下一层标记",
    resumeCutTitle: "续打裁切",
    resumePrint: "续打 Resume Print",
    runResumePrint: "执行续打",
    sample: "范例",
    sampleFile: "范例 G-code",
    scalePercent: "缩放 %",
    scaleX: "X 缩放 %",
    scaleY: "Y 缩放 %",
    scaleZ: "Z 缩放 %",
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
    stlEmpty: "打开或载入范例 STL 文件来查看模型。",
    stlExportDone: "已导出 {fileName}。",
    stlExportMissing: "请先载入 STL 再导出。",
    stlFileLoaded: "已载入 {fileName}。尺寸、体积和表面积已准备好。",
    stlFileReading: "正在读取 {fileName}。",
    stlLoadFailed: "无法载入 STL：{message}",
    stlMeasureDescription: "查看尺寸、体积和表面积",
    stlMeasureTitle: "模型测量",
    stlSampleFile: "范例 STL 立方体",
    stlSampleLoaded: "范例立方体已载入，每边 20 mm。",
    stlViewer: "3D 查看器 - 面积检查",
    surfaceArea: "表面积",
    tagline: "生产工具",
    viewerGroup: "3D 查看器",
    targetX: "目标 X",
    targetY: "目标 Y",
    targetZ: "目标 Z",
    uniformScale: "等比例缩放",
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

if (!["resume-print", "simp3d-resume", "stl-viewer"].includes(activeTool)) {
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
  const isStl = activeTool === "stl-viewer";
  const isResume = activeTool === "resume-print";

  resumeSettings.hidden = !isResume;
  resumeSettings.style.display = isResume ? "" : "none";
  simp3dSettings.hidden = !isSimp3d;
  simp3dSettings.style.display = isSimp3d ? "" : "none";
  stlSettings.hidden = !isStl;
  stlSettings.style.display = isStl ? "" : "none";
  stlWorkspace.hidden = !isStl;
  stlWorkspace.style.display = isStl ? "" : "none";
  gcodeWorkspace.hidden = isStl;
  gcodeWorkspace.style.display = isStl ? "none" : "";
  gcodeActions.hidden = isStl;
  gcodeActions.style.display = isStl ? "none" : "";

  const titleKey = isStl ? "stlViewer" : isSimp3d ? "simp3dResumePrint" : "resumePrint";
  toolTitle.textContent = t(titleKey);
  processButton.textContent = t(isSimp3d ? "runSimp3dResumePrint" : "runResumePrint");
  fileInput.accept = isStl ? ".stl" : ".gcode,.gco,.gc,.txt";
  fileInputLabel.textContent = t(isStl ? "openStl" : "openGcode");
  shortcutButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === activeTool);
  });

  if (isStl) {
    initStlViewer();
    resizeStlRenderer();
    updateStlControlMode();
    fileStatus.textContent = stlGeometry ? `${stlSourceName}.stl` : t("noFileLoaded");
  }
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

function readFileArrayBuffer(file) {
  if (typeof FileReader === "undefined") {
    return file.arrayBuffer();
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
      resolve(reader.result);
    };

    reader.readAsArrayBuffer(file);
  });
}

function initStlViewer() {
  if (stlRenderer) {
    return;
  }

  stlScene = new THREE.Scene();
  stlScene.background = new THREE.Color(0xf4f7f8);

  stlCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
  stlCamera.position.set(80, 70, 90);

  stlRenderer = new THREE.WebGLRenderer({ canvas: stlCanvas, antialias: true });
  stlRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  stlControls = new OrbitControls(stlCamera, stlCanvas);
  stlControls.enableDamping = true;
  stlControls.dampingFactor = 0.08;

  const ambient = new THREE.HemisphereLight(0xffffff, 0x80909a, 1.8);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
  keyLight.position.set(70, 90, 120);
  const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.9);
  fillLight.position.set(-90, 40, -70);
  const grid = new THREE.GridHelper(120, 24, 0x94a3b8, 0xd4dde4);
  stlScene.add(ambient, keyLight, fillLight, grid);

  stlResizeObserver = new ResizeObserver(resizeStlRenderer);
  stlResizeObserver.observe(stlCanvas.parentElement);
  window.addEventListener("resize", resizeStlRenderer);
  startStlAnimation();
}

function startStlAnimation() {
  if (stlAnimationStarted) {
    return;
  }

  stlAnimationStarted = true;

  const renderFrame = () => {
    requestAnimationFrame(renderFrame);

    if (!stlRenderer || !stlScene || !stlCamera) {
      return;
    }

    if (stlControls) {
      stlControls.update();
    }

    stlRenderer.render(stlScene, stlCamera);
  };

  renderFrame();
}

function resizeStlRenderer() {
  if (!stlRenderer || !stlCamera || !stlCanvas.parentElement) {
    return;
  }

  const rect = stlCanvas.parentElement.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  stlRenderer.setSize(width, height, false);
  stlCamera.aspect = width / height;
  stlCamera.updateProjectionMatrix();
}

function prepareStlGeometry(geometry) {
  const prepared = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  prepared.computeBoundingBox();
  prepared.computeVertexNormals();
  return prepared;
}

function setStlModel(geometry, fileName) {
  initStlViewer();

  if (stlMesh) {
    stlScene.remove(stlMesh);
    stlMesh.geometry.dispose();
    stlMesh.material.dispose();
  }

  stlGeometry = prepareStlGeometry(geometry);
  stlGeometry.computeBoundingBox();
  stlBaseBox = stlGeometry.boundingBox.clone();
  stlBaseBox.getCenter(stlBaseCenter);
  const size = new THREE.Vector3();
  stlBaseBox.getSize(size);
  stlBaseDimensions = { x: size.x, y: size.y, z: size.z };
  stlScale = { x: 1, y: 1, z: 1 };
  stlSourceName = sanitizeFilePart(String(fileName || "model").replace(/\.stl$/i, "")) || "model";

  const material = new THREE.MeshStandardMaterial({
    color: 0x2a9d8f,
    metalness: 0.08,
    roughness: 0.48,
    side: THREE.DoubleSide
  });
  stlMesh = new THREE.Mesh(stlGeometry, material);
  stlScene.add(stlMesh);
  stlEmpty.hidden = true;

  updateStlControlMode();
  updateStlControlsFromScale();
  applyStlScale();
  fitStlCamera();
}

function fitStlCamera() {
  if (!stlCamera || !stlControls || !stlBaseBox) {
    return;
  }

  const maxDimension = Math.max(
    stlBaseDimensions.x * stlScale.x,
    stlBaseDimensions.y * stlScale.y,
    stlBaseDimensions.z * stlScale.z,
    10
  );
  const distance = maxDimension * 2.4;
  stlCamera.near = Math.max(0.01, distance / 1000);
  stlCamera.far = Math.max(1000, distance * 20);
  stlCamera.position.set(distance * 0.72, distance * 0.58, distance * 0.84);
  stlCamera.lookAt(0, 0, 0);
  stlCamera.updateProjectionMatrix();
  stlControls.target.set(0, 0, 0);
  stlControls.update();
}

function applyStlScale() {
  if (!stlMesh) {
    resetStlMeasurements();
    return;
  }

  stlMesh.scale.set(stlScale.x, stlScale.y, stlScale.z);
  stlMesh.position.set(
    -stlBaseCenter.x * stlScale.x,
    -stlBaseCenter.y * stlScale.y,
    -stlBaseCenter.z * stlScale.z
  );
  updateStlMeasurements();
}

function updateStlControlMode() {
  const locked = stlLockProportionsInput.checked;
  stlResizeModeSelect.value = locked ? "uniform" : "free";
  stlScalePercentInput.disabled = !locked;
  stlScaleXInput.disabled = locked;
  stlScaleYInput.disabled = locked;
  stlScaleZInput.disabled = locked;
}

function updateStlControlsFromScale() {
  if (!stlGeometry || isUpdatingStlControls) {
    return;
  }

  isUpdatingStlControls = true;
  stlScalePercentInput.value = formatControlNumber(stlScale.x * 100);
  stlScaleXInput.value = formatControlNumber(stlScale.x * 100);
  stlScaleYInput.value = formatControlNumber(stlScale.y * 100);
  stlScaleZInput.value = formatControlNumber(stlScale.z * 100);
  const unit = unitMeta(stlUnitSelect.value);
  stlTargetXInput.value = formatControlNumber(stlBaseDimensions.x * stlScale.x * unit.factor);
  stlTargetYInput.value = formatControlNumber(stlBaseDimensions.y * stlScale.y * unit.factor);
  stlTargetZInput.value = formatControlNumber(stlBaseDimensions.z * stlScale.z * unit.factor);
  isUpdatingStlControls = false;
}

function formatControlNumber(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Number(value.toFixed(4)).toString();
}

function parsePositiveInput(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function setUniformStlScale(scale) {
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  stlScale = { x: safeScale, y: safeScale, z: safeScale };
  updateStlControlsFromScale();
  applyStlScale();
}

function setFreeStlScale(nextScale) {
  stlScale = {
    x: Number.isFinite(nextScale.x) && nextScale.x > 0 ? nextScale.x : stlScale.x,
    y: Number.isFinite(nextScale.y) && nextScale.y > 0 ? nextScale.y : stlScale.y,
    z: Number.isFinite(nextScale.z) && nextScale.z > 0 ? nextScale.z : stlScale.z
  };
  updateStlControlsFromScale();
  applyStlScale();
}

function handleStlScalePercentInput() {
  if (isUpdatingStlControls || !stlGeometry) {
    return;
  }

  setUniformStlScale(parsePositiveInput(stlScalePercentInput, stlScale.x * 100) / 100);
}

function handleStlAxisScaleInput(axis, input) {
  if (isUpdatingStlControls || !stlGeometry) {
    return;
  }

  if (stlLockProportionsInput.checked) {
    setUniformStlScale(parsePositiveInput(input, stlScale[axis] * 100) / 100);
    return;
  }

  setFreeStlScale({
    ...stlScale,
    [axis]: parsePositiveInput(input, stlScale[axis] * 100) / 100
  });
}

function handleStlTargetInput(axis, input) {
  if (isUpdatingStlControls || !stlGeometry) {
    return;
  }

  const baseValue = stlBaseDimensions[axis] || 1;
  const unit = unitMeta(stlUnitSelect.value);
  const currentValue = baseValue * stlScale[axis] * unit.factor;
  const targetInMillimeters = parsePositiveInput(input, currentValue) / unit.factor;
  const nextScale = targetInMillimeters / baseValue;

  if (stlLockProportionsInput.checked) {
    setUniformStlScale(nextScale);
    return;
  }

  setFreeStlScale({ ...stlScale, [axis]: nextScale });
}

function transformedTriangleStats(geometry, scale) {
  const positions = geometry.getAttribute("position");
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();
  const bcCross = new THREE.Vector3();
  const scaleVector = new THREE.Vector3(scale.x, scale.y, scale.z);
  let surfaceArea = 0;
  let volume = 0;

  for (let index = 0; index < positions.count; index += 3) {
    a.fromBufferAttribute(positions, index).multiply(scaleVector);
    b.fromBufferAttribute(positions, index + 1).multiply(scaleVector);
    c.fromBufferAttribute(positions, index + 2).multiply(scaleVector);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    cross.crossVectors(ab, ac);
    surfaceArea += cross.length() * 0.5;
    volume += a.dot(bcCross.crossVectors(b, c)) / 6;
  }

  return {
    surfaceArea: Math.abs(surfaceArea),
    volume: Math.abs(volume)
  };
}

function unitMeta(unit) {
  const units = {
    mm: { factor: 1, length: "mm", area: "mm^2", volume: "mm^3" },
    cm: { factor: 0.1, length: "cm", area: "cm^2", volume: "cm^3" },
    inch: { factor: 1 / 25.4, length: "in", area: "in^2", volume: "in^3" },
    meter: { factor: 0.001, length: "m", area: "m^2", volume: "m^3" }
  };
  return units[unit] || units.mm;
}

function formatMeasurement(value, unit, power = 1) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  const converted = value * Math.pow(unit.factor, power);
  const decimals = Math.abs(converted) >= 100 ? 2 : Math.abs(converted) >= 1 ? 3 : 5;
  return `${Number(converted.toFixed(decimals))}`;
}

function updateStlMeasurements() {
  if (!stlGeometry) {
    resetStlMeasurements();
    return;
  }

  const unit = unitMeta(stlUnitSelect.value);
  const stats = transformedTriangleStats(stlGeometry, stlScale);
  const dimensions = {
    x: stlBaseDimensions.x * stlScale.x,
    y: stlBaseDimensions.y * stlScale.y,
    z: stlBaseDimensions.z * stlScale.z
  };
  stlDimensionX.textContent = `${formatMeasurement(dimensions.x, unit)} ${unit.length}`;
  stlDimensionY.textContent = `${formatMeasurement(dimensions.y, unit)} ${unit.length}`;
  stlDimensionZ.textContent = `${formatMeasurement(dimensions.z, unit)} ${unit.length}`;
  stlVolume.textContent = `${formatMeasurement(stats.volume, unit, 3)} ${unit.volume}`;
  stlSurfaceArea.textContent = `${formatMeasurement(stats.surfaceArea, unit, 2)} ${unit.area}`;
}

function resetStlMeasurements() {
  stlDimensionX.textContent = "-";
  stlDimensionY.textContent = "-";
  stlDimensionZ.textContent = "-";
  stlVolume.textContent = "-";
  stlSurfaceArea.textContent = "-";
}

function buildScaledStlGeometry() {
  if (!stlGeometry) {
    return null;
  }

  const scaled = stlGeometry.clone();
  scaled.applyMatrix4(new THREE.Matrix4().makeScale(stlScale.x, stlScale.y, stlScale.z));
  scaled.computeVertexNormals();
  return scaled;
}

function buildStlDownloadFileName() {
  const x = formatZ(stlBaseDimensions.x * stlScale.x);
  const y = formatZ(stlBaseDimensions.y * stlScale.y);
  const z = formatZ(stlBaseDimensions.z * stlScale.z);
  return `${stlSourceName}.resized.X-${x}_Y-${y}_Z-${z}.stl`;
}

function exportResizedStl() {
  if (!stlGeometry) {
    setLog(t("stlExportMissing"), "warning");
    return;
  }

  const scaledGeometry = buildScaledStlGeometry();
  const mesh = new THREE.Mesh(scaledGeometry, new THREE.MeshStandardMaterial());
  const exporter = new STLExporter();
  const arrayBuffer = exporter.parse(mesh, { binary: true });
  const blob = new Blob([arrayBuffer], { type: "model/stl" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileName = buildStlDownloadFileName();
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  scaledGeometry.dispose();
  mesh.material.dispose();
  setLog(t("stlExportDone", { fileName }), "success");
}

function loadSampleStl() {
  const geometry = new THREE.BoxGeometry(20, 20, 20).toNonIndexed();
  setStlModel(geometry, "sample-cube.stl");
  fileStatus.textContent = t("stlSampleFile");
  setLog(t("stlSampleLoaded"), "success");
}

async function loadStlFile(file) {
  if (!file) {
    fileStatus.textContent = stlGeometry ? `${stlSourceName}.stl` : t("noFileLoaded");
    setLog(t("noFileSelected"), "warning");
    return;
  }

  try {
    setProgress(0);
    setLog(t("stlFileReading", { fileName: file.name }), "info");
    const buffer = await readFileArrayBuffer(file);
    const loader = new STLLoader();
    const geometry = loader.parse(buffer);
    setStlModel(geometry, file.name);
    geometry.dispose();
    fileStatus.textContent = file.name;
    hideProgress();
    setLog(t("stlFileLoaded", { fileName: file.name }), "success");
  } catch (error) {
    hideProgress();
    fileStatus.textContent = t("fileLoadFailed");
    setLog(t("stlLoadFailed", { message: error.message }), "warning");
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
  setLog(activeTool === "stl-viewer" ? t("openStl") : t("filePickerReady"), "info");
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];

  if (activeTool === "stl-viewer") {
    await loadStlFile(file);
    return;
  }

  await loadGcodeFile(file);
});

fileInput.addEventListener("cancel", () => {
  if (activeTool === "stl-viewer") {
    fileStatus.textContent = stlGeometry ? `${stlSourceName}.stl` : t("noFileLoaded");
    setLog(t("fileCancelled"), "warning");
    return;
  }

  fileStatus.textContent = inputGcode.value ? loadedFileName : t("noFileLoaded");
  setLog(t("fileCancelled"), "warning");
});

sampleButton.addEventListener("click", () => {
  if (activeTool === "stl-viewer") {
    loadSampleStl();
    return;
  }

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
  updateStlControlsFromScale();
  updateStlMeasurements();

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

stlUnitSelect.addEventListener("change", () => {
  updateStlControlsFromScale();
  updateStlMeasurements();
});

stlResizeModeSelect.addEventListener("change", () => {
  stlLockProportionsInput.checked = stlResizeModeSelect.value === "uniform";
  updateStlControlMode();
  updateStlControlsFromScale();
});

stlLockProportionsInput.addEventListener("change", () => {
  updateStlControlMode();

  if (stlLockProportionsInput.checked) {
    setUniformStlScale(stlScale.x);
    return;
  }

  updateStlControlsFromScale();
});

stlScalePercentInput.addEventListener("input", handleStlScalePercentInput);
stlScaleXInput.addEventListener("input", () => handleStlAxisScaleInput("x", stlScaleXInput));
stlScaleYInput.addEventListener("input", () => handleStlAxisScaleInput("y", stlScaleYInput));
stlScaleZInput.addEventListener("input", () => handleStlAxisScaleInput("z", stlScaleZInput));
stlTargetXInput.addEventListener("input", () => handleStlTargetInput("x", stlTargetXInput));
stlTargetYInput.addEventListener("input", () => handleStlTargetInput("y", stlTargetYInput));
stlTargetZInput.addEventListener("input", () => handleStlTargetInput("z", stlTargetZInput));

stlResetButton.addEventListener("click", () => {
  setUniformStlScale(1);
  fitStlCamera();
});

stlExportButton.addEventListener("click", exportResizedStl);

applyLanguage();
updateStats();
resetStlMeasurements();
