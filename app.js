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
const signageSettings = document.getElementById("signageSettings");
const signageWorkspace = document.getElementById("signageWorkspace");
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
const signageConfigStatus = document.getElementById("signageConfigStatus");
const signageGuidelineSizeInput = document.getElementById("signageGuidelineSize");
const signageBackingWidthInput = document.getElementById("signageBackingWidth");
const signageBackingHeightInput = document.getElementById("signageBackingHeight");
const signageLightingSelect = document.getElementById("signageLighting");
const signageMaterialSelect = document.getElementById("signageMaterial");
const signageCanvas = document.getElementById("signageCanvas");
const signageCanvasBadge = document.getElementById("signageCanvasBadge");
const signageEmpty = document.getElementById("signageEmpty");
const signageDetections = document.getElementById("signageDetections");
const signageQuoteLines = document.getElementById("signageQuoteLines");
const signageQuoteTotal = document.getElementById("signageQuoteTotal");
const signageBackingSize = document.getElementById("signageBackingSize");
const signageWordGroup = document.getElementById("signageWordGroup");
const signageConfidence = document.getElementById("signageConfidence");
const signageAiNote = document.getElementById("signageAiNote");
const signageCorrectionPrompt = document.getElementById("signageCorrectionPrompt");
const signageRerunButton = document.getElementById("signageRerunButton");
const signagePrintButton = document.getElementById("signagePrintButton");
const signagePngButton = document.getElementById("signagePngButton");
const signagePromptButtons = document.querySelectorAll("[data-prompt]");
const signageRefreshQuoteButton = document.getElementById("signageRefreshQuoteButton");
const signageStepButtons = document.querySelectorAll("[data-signage-step]");
const signageStepPanels = document.querySelectorAll("[data-signage-step-panel]");
const signageStepEyebrow = document.getElementById("signageStepEyebrow");
const signageStepTitle = document.getElementById("signageStepTitle");
const signageStageStatus = document.getElementById("signageStageStatus");
const signageAutosaveStatus = document.getElementById("signageAutosaveStatus");
const signageGuidelineSizeMirror = document.getElementById("signageGuidelineSizeMirror");
const signageBackingSizeMirror = document.getElementById("signageBackingSizeMirror");
const signageToolLetterButton = document.getElementById("signageToolLetter");
const signageZoomOutButton = document.getElementById("signageZoomOutButton");
const signageZoomInButton = document.getElementById("signageZoomInButton");
const signageZoomResetButton = document.getElementById("signageZoomResetButton");
const signageZoomValue = document.getElementById("signageZoomValue");
const signageCustomerNameInput = document.getElementById("signageCustomerName");
const signageProjectNameInput = document.getElementById("signageProjectName");
const signageCustomerContactInput = document.getElementById("signageCustomerContact");
const signageQuoteDateInput = document.getElementById("signageQuoteDate");
const signageQuoteValidityInput = document.getElementById("signageQuoteValidity");
const signagePreparedByInput = document.getElementById("signagePreparedBy");
const signageProjectNotesInput = document.getElementById("signageProjectNotes");
const signageLoadProjectButton = document.getElementById("signageLoadProjectButton");
const signageProjectFileInput = document.getElementById("signageProjectFileInput");
const signageSaveProjectButton = document.getElementById("signageSaveProjectButton");
const signageSaveProjectButtonBottom = document.getElementById("signageSaveProjectButtonBottom");
const signageExportCsvButton = document.getElementById("signageExportCsvButton");
const signageBackStepButton = document.getElementById("signageBackStepButton");
const signageNextStepButton = document.getElementById("signageNextStepButton");
const signagePrintTemplate = document.getElementById("signagePrintTemplate");

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
let signagePhotoDataUrl = "";
let signagePhotoImage = null;
let signagePhotoName = "";
let signageActiveTool = "guideline";
let signageCalibration = { x1: 216, y1: 338, x2: 984, y2: 338, inches: 144 };
let signageBackingBox = null;
let signageRecognition = null;
let signagePricing = null;
let signageQuote = null;
let signageCurrency = "MYR";
let signageDragStart = null;
let signageDragPreview = null;
let signageLetterTooltip = null;
let activeSignageStep = Number(localStorage.getItem("weesengSignageActiveStep") || 0);
let signageCanvasZoom = Number(localStorage.getItem("weesengSignageCanvasZoom") || 1);
let signageAutosaveTimer = null;
let isRestoringSignageProject = false;

const previewLimit = 1500000;
const signageAutosaveKey = "weesengSignageQuoteDraft";
const signageProjectSchemaVersion = 1;
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
    openManual: "Open manual",
    openSignagePhoto: "Upload photo",
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
    quotationGroup: "Quotation",
    signageQuotation: "Signage Quotation",
    signageConfig: "Config file",
    signageGuideline: "Guideline size (inch)",
    backingRealSize: "Backing size (inch)",
    signageLighting: "Lighting",
    signageMaterial: "Emboss material/model",
    projectAutosave: "Project autosave",
    projectFile: "Project file",
    projectSavedNow: "Saved just now",
    projectAutosaved: "Autosaved {time}",
    stepProjectSetup: "Project setup",
    stepMaterialPricing: "Material & pricing",
    signageWizardStatus: "Step-by-step quotation workflow.",
    statusProjectSetup: "Enter customer/project details and upload a photo or load a saved project.",
    statusGuideline: "Draw one reference guideline and confirm the real-world size.",
    statusRecognize: "Run AI recognition or add correction notes before re-running.",
    statusReview: "Review detected letters, edit dimensions, and inspect per-letter quote logic.",
    statusMaterialPricing: "Select material and lighting, then refresh the deterministic Google Sheet quote.",
    statusExport: "Review final quote, save project, export CSV, or print/save as PDF.",
    customerName: "Customer name",
    projectName: "Project name",
    customerContact: "Phone / email",
    quoteDate: "Quote date",
    quoteValidity: "Validity",
    preparedBy: "Prepared by",
    projectNotes: "Project notes",
    loadProject: "Load project",
    saveProject: "Save project",
    exportCsv: "Export CSV",
    backStep: "Back",
    nextStep: "Next",
    finishStep: "Finish",
    calibrationHint: "Use tool 1 to draw one straight horizontal or vertical reference line across a known real size. Drawing again replaces the previous guideline.",
    quoteAction: "Quote action",
    refreshQuote: "Refresh quote",
    frontLit: "Front lit",
    backLit: "Back lit",
    noLit: "No lit",
    stepGuideline: "Mark guideline",
    stepRecognize: "AI recognize",
    stepMaterial: "Material",
    stepPricing: "Sheet pricing",
    stepReview: "Review draft",
    stepExport: "Print / image",
    guidelineTool: "Guideline",
    backingBoxTool: "Backing box",
    letterBoxTool: "Letter box",
    manualFallbackTool: "Manual shape",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetZoom: "Reset",
    signageEmpty: "Upload or sample a signage photo, then mark the backing or guideline size.",
    correctionPrompt: "AI correction prompt",
    correctionPlaceholder: "Tell AI what to fix. Example: The word is HAPPY, backing is 96 x 24 inch, letter H is 18 inch tall.",
    promptReadAll: "Read all words",
    promptUseScale: "Use scale",
    promptCorrectOnly: "Correct unclear",
    rerunAi: "Re-run AI with correction",
    aiDetectionReview: "AI Detection Review",
    backingSize: "Backing size",
    wordGroup: "Word group",
    aiConfidence: "AI confidence",
    letter: "Letter",
    widthIn: "Width",
    heightIn: "Height",
    confidence: "Confidence",
    actions: "Actions",
    deleteLetter: "Delete",
    quoteDraft: "Quote Draft",
    aiNoteEmpty: "Run AI recognition to draft the quote.",
    quoteItem: "Item",
    quantity: "Qty",
    quoteTotal: "Total",
    totalQuotation: "Total quotation",
    printQuote: "Print / PDF",
    saveQuotePng: "Save quote as PNG",
    signagePhotoLoaded: "Loaded signage photo. Mark the guideline/backing size, then run AI recognition.",
    signageSampleLoaded: "Sample signage photo loaded. Guideline is set to 144 inch.",
    signageRecognizing: "AI is reading the photo and alphabet dimensions...",
    signagePricingLoading: "Loading Google Sheet pricing...",
    signageDrafting: "AI is writing the quotation note...",
    signageNeedPhoto: "Please upload a signage photo or click Sample before running AI.",
    signageRecognized: "AI recognized {count} alphabet item(s). Review and correct before printing.",
    signageRecognizeFailed: "AI recognition failed: {message}",
    signageQuoteReady: "Quote draft is ready from Google Sheet pricing.",
    signageQuoteRefreshed: "Quotation refreshed for selected material and lighting.",
    signageNoQuoteToRefresh: "Run AI recognition or load Sample before refreshing the quote.",
    signageProjectSaved: "Saved project file {fileName}.",
    signageProjectLoaded: "Loaded project file {fileName}.",
    signageProjectLoadFailed: "Project load failed: {message}",
    signageCsvExported: "Exported quote CSV {fileName}.",
    signagePngSaved: "Saved {fileName}.",
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
    openManual: "打开说明",
    openSignagePhoto: "上传照片",
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
    quotationGroup: "报价",
    signageQuotation: "招牌报价",
    signageConfig: "配置文件",
    signageGuideline: "参考尺寸（inch）",
    backingRealSize: "底板尺寸（inch）",
    signageLighting: "灯光",
    signageMaterial: "立体字材料/型号",
    projectAutosave: "项目自动保存",
    projectFile: "项目文件",
    projectSavedNow: "刚刚保存",
    projectAutosaved: "已自动保存 {time}",
    stepProjectSetup: "项目设置",
    stepMaterialPricing: "材料和价格",
    signageWizardStatus: "逐步完成招牌报价。",
    statusProjectSetup: "填写客户/项目资料，然后上传照片或载入已保存项目。",
    statusGuideline: "画一条参考线，并确认真实尺寸。",
    statusRecognize: "运行 AI 识别，或输入修正提示后重新识别。",
    statusReview: "检查识别到的字母，修改尺寸，并查看单个字母的报价逻辑。",
    statusMaterialPricing: "选择材料和灯光，然后刷新 Google Sheet 报价。",
    statusExport: "检查最终报价，保存项目，导出 CSV，或打印/另存为 PDF。",
    customerName: "客户名称",
    projectName: "项目名称",
    customerContact: "电话 / 电邮",
    quoteDate: "报价日期",
    quoteValidity: "有效期",
    preparedBy: "报价人",
    projectNotes: "项目备注",
    loadProject: "载入项目",
    saveProject: "保存项目",
    exportCsv: "导出 CSV",
    backStep: "上一步",
    nextStep: "下一步",
    finishStep: "完成",
    calibrationHint: "使用工具 1 画一条水平或垂直的直参考线。再次绘制会替换上一条参考线。",
    quoteAction: "报价操作",
    refreshQuote: "刷新报价",
    frontLit: "正发光",
    backLit: "背发光",
    noLit: "不发光",
    stepGuideline: "标参考线",
    stepRecognize: "AI 识别",
    stepMaterial: "材料",
    stepPricing: "表格价格",
    stepReview: "检查报价",
    stepExport: "打印 / 图片",
    guidelineTool: "参考线",
    backingBoxTool: "底板框",
    letterBoxTool: "字母框",
    manualFallbackTool: "手动形状",
    zoomIn: "放大",
    zoomOut: "缩小",
    resetZoom: "重置",
    signageEmpty: "上传或载入招牌照片，然后标底板或参考尺寸。",
    correctionPrompt: "AI 修正提示",
    correctionPlaceholder: "告诉 AI 要修正什么。例如：字是 HAPPY，底板 96 x 24 inch，H 字高 18 inch。",
    promptReadAll: "识别全部字",
    promptUseScale: "使用比例",
    promptCorrectOnly: "只修正不清楚",
    rerunAi: "用修正重新识别",
    aiDetectionReview: "AI 识别检查",
    backingSize: "底板尺寸",
    wordGroup: "文字组",
    aiConfidence: "AI 信心",
    letter: "字母",
    widthIn: "宽度",
    heightIn: "高度",
    confidence: "信心",
    actions: "操作",
    deleteLetter: "删除",
    quoteDraft: "报价草稿",
    aiNoteEmpty: "运行 AI 识别后生成报价。",
    quoteItem: "项目",
    quantity: "数量",
    quoteTotal: "合计",
    totalQuotation: "报价总额",
    printQuote: "打印 / PDF",
    saveQuotePng: "保存报价 PNG",
    signagePhotoLoaded: "已载入招牌照片。请标参考尺寸，然后运行 AI 识别。",
    signageSampleLoaded: "范例招牌已载入，参考线为 144 inch。",
    signageRecognizing: "AI 正在读取照片和字母尺寸...",
    signagePricingLoading: "正在读取 Google Sheet 价格...",
    signageDrafting: "AI 正在写报价说明...",
    signageNeedPhoto: "请先上传招牌照片，或点击示例后再运行 AI。",
    signageRecognized: "AI 已识别 {count} 个字母项目。请检查后再打印。",
    signageRecognizeFailed: "AI 识别失败：{message}",
    signageQuoteReady: "已根据 Google Sheet 价格生成报价草稿。",
    signageQuoteRefreshed: "已根据选择的材料和灯光刷新报价。",
    signageNoQuoteToRefresh: "请先运行 AI 识别或载入示例，再刷新报价。",
    signageProjectSaved: "已保存项目文件 {fileName}。",
    signageProjectLoaded: "已载入项目文件 {fileName}。",
    signageProjectLoadFailed: "项目载入失败：{message}",
    signageCsvExported: "已导出报价 CSV {fileName}。",
    signagePngSaved: "已保存 {fileName}。",
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

if (!["resume-print", "simp3d-resume", "stl-viewer", "signage-quotation"].includes(activeTool)) {
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
  const isSignage = activeTool === "signage-quotation";
  const isResume = activeTool === "resume-print";
  document.body.dataset.activeTool = activeTool;

  resumeSettings.hidden = !isResume;
  resumeSettings.style.display = isResume ? "" : "none";
  simp3dSettings.hidden = !isSimp3d;
  simp3dSettings.style.display = isSimp3d ? "" : "none";
  stlSettings.hidden = !isStl;
  stlSettings.style.display = isStl ? "" : "none";
  signageSettings.hidden = !isSignage;
  signageSettings.style.display = isSignage ? "" : "none";
  stlWorkspace.hidden = !isStl;
  stlWorkspace.style.display = isStl ? "" : "none";
  signageWorkspace.hidden = !isSignage;
  signageWorkspace.style.display = isSignage ? "" : "none";
  gcodeWorkspace.hidden = isStl || isSignage;
  gcodeWorkspace.style.display = isStl || isSignage ? "none" : "";
  gcodeActions.hidden = isStl || isSignage;
  gcodeActions.style.display = isStl || isSignage ? "none" : "";

  const titleKey = isSignage ? "signageQuotation" : isStl ? "stlViewer" : isSimp3d ? "simp3dResumePrint" : "resumePrint";
  toolTitle.textContent = t(titleKey);
  processButton.textContent = t(isSimp3d ? "runSimp3dResumePrint" : "runResumePrint");
  fileInput.accept = isSignage ? "image/*" : isStl ? ".stl" : ".gcode,.gco,.gc,.txt";
  fileInputLabel.textContent = t(isSignage ? "openSignagePhoto" : isStl ? "openStl" : "openGcode");
  shortcutButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === activeTool);
  });

  if (isStl) {
    initStlViewer();
    resizeStlRenderer();
    updateStlControlMode();
    fileStatus.textContent = stlGeometry ? `${stlSourceName}.stl` : t("noFileLoaded");
  }

  if (isSignage) {
    initSignageCanvas();
    updateSignageWizard();
    loadSignagePricing().then(() => {
      if (signageRecognition) {
        refreshSignageQuoteFromEdits();
      }
    });
    fileStatus.textContent = signagePhotoDataUrl ? "Signage photo loaded" : t("noFileLoaded");
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

function downloadTextFile(fileName, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

function initSignageCanvas() {
  updateSignageCanvasZoom();
  updateSignageToolAvailability();
  renderSignageCanvas();
  renderSignageDetections();
  renderSignageQuote();
}

function signageContext() {
  return signageCanvas.getContext("2d");
}

function renderSignageCanvas() {
  const context = signageContext();
  context.clearRect(0, 0, signageCanvas.width, signageCanvas.height);

  if (signagePhotoImage) {
    drawSignagePhoto(context);
    signageEmpty.hidden = true;
  } else {
    drawSampleSignageBackground(context);
    signageEmpty.hidden = Boolean(signageRecognition);
  }

  drawLine(context, signageCalibration, "#9a3412", `${signageCalibration.inches} in`);
  const activeBackingBox = signageRecognition?.backing?.box || signageBackingBox;
  if (activeBackingBox) {
    drawBox(context, activeBackingBox, "#0f766e", "Backing");
  }

  if (signageRecognition) {
    (signageRecognition.wordGroups || []).forEach((group) => {
      drawBox(context, group.box, "#1d4ed8", `${group.text} ${formatControlNumber(group.widthIn)} in`);
    });

    (signageRecognition.letters || []).forEach((letter) => {
      const color = letter.confidence >= 0.85 ? "#dc2626" : "#9a3412";
      drawBox(context, letter.box, color, `${letter.text} ${formatControlNumber(letter.heightIn)} in`);
    });
  }

  if (signageDragPreview?.box) {
    drawBox(context, signageDragPreview.box, signageDragPreview.tool === "letter" ? "#7c3aed" : "#0f766e", signageDragPreview.label);
  }
}

function signageBackingSizeInputs() {
  return {
    widthIn: Number(signageBackingWidthInput.value) || 144,
    heightIn: Number(signageBackingHeightInput.value) || 36
  };
}

function signagePixelsPerInch() {
  const backingSize = signageBackingSizeInputs();
  const box = signageRecognition?.backing?.box || signageBackingBox;
  if (box?.width > 0 && box?.height > 0) {
    return {
      x: Math.max(0.001, box.width / backingSize.widthIn),
      y: Math.max(0.001, box.height / backingSize.heightIn)
    };
  }

  const lineLength = Math.hypot(signageCalibration.x2 - signageCalibration.x1, signageCalibration.y2 - signageCalibration.y1);
  const pixelsPerInch = Math.max(0.001, lineLength / (Number(signageCalibration.inches) || 144));
  return { x: pixelsPerInch, y: pixelsPerInch };
}

function signageBoxDimensionsIn(box) {
  const pixelsPerInch = signagePixelsPerInch();
  return {
    widthIn: box.width / pixelsPerInch.x,
    heightIn: box.height / pixelsPerInch.y
  };
}

function signagePhotoFrame() {
  if (!signagePhotoImage) {
    return { x: 0, y: 0, width: signageCanvas.width, height: signageCanvas.height };
  }

  const imageWidth = signagePhotoImage.naturalWidth || signagePhotoImage.width || signageCanvas.width;
  const imageHeight = signagePhotoImage.naturalHeight || signagePhotoImage.height || signageCanvas.height;
  const scale = Math.min(signageCanvas.width / imageWidth, signageCanvas.height / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: (signageCanvas.width - width) / 2,
    y: (signageCanvas.height - height) / 2,
    width,
    height
  };
}

function drawSignagePhoto(context) {
  const frame = signagePhotoFrame();
  context.save();
  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, signageCanvas.width, signageCanvas.height);
  context.drawImage(signagePhotoImage, frame.x, frame.y, frame.width, frame.height);
  context.strokeStyle = "#94a3b8";
  context.lineWidth = 2;
  context.strokeRect(frame.x, frame.y, frame.width, frame.height);
  context.restore();
}

function signageAiImageDataUrl() {
  if (!signagePhotoImage) {
    return "";
  }

  const canvas = document.createElement("canvas");
  canvas.width = signageCanvas.width;
  canvas.height = signageCanvas.height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const frame = signagePhotoFrame();
  context.drawImage(signagePhotoImage, frame.x, frame.y, frame.width, frame.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function drawSampleSignageBackground(context) {
  context.fillStyle = "#dce6ea";
  context.fillRect(0, 0, signageCanvas.width, signageCanvas.height * 0.38);
  context.fillStyle = "#eef1f2";
  context.fillRect(0, signageCanvas.height * 0.38, signageCanvas.width, signageCanvas.height * 0.62);
  context.strokeStyle = "#9aa9af";
  context.lineWidth = 2;
  context.strokeRect(96, 224, 1008, 360);
  context.fillStyle = "#d8e3e7";

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      context.fillRect(170 + column * 145, 292 + row * 72, 96, 38);
      context.strokeRect(170 + column * 145, 292 + row * 72, 96, 38);
    }
  }

  context.fillStyle = "#172026";
  context.font = "bold 58px Segoe UI, Arial";
  context.fillText("WEESENG", 360, 276);
}

function signageCalibrationBox() {
  return { x: 216, y: 150, width: 768, height: 158 };
}

function drawBox(context, box, color, label) {
  if (!box) {
    return;
  }

  context.save();
  context.strokeStyle = color;
  context.fillStyle = `${color}22`;
  context.lineWidth = 5;
  context.fillRect(box.x, box.y, box.width, box.height);
  context.strokeRect(box.x, box.y, box.width, box.height);
  context.fillStyle = color;
  context.font = "bold 18px Segoe UI, Arial";
  context.fillText(label, box.x + 8, Math.max(22, box.y - 8));
  context.restore();
}

function drawLine(context, line, color, label) {
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 9;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(line.x1, line.y1);
  context.lineTo(line.x2, line.y2);
  context.stroke();
  context.beginPath();
  context.arc(line.x1, line.y1, 10, 0, Math.PI * 2);
  context.arc(line.x2, line.y2, 10, 0, Math.PI * 2);
  context.fill();
  context.font = "bold 18px Segoe UI, Arial";
  context.fillText(label, (line.x1 + line.x2) / 2 - 28, (line.y1 + line.y2) / 2 + 34);
  context.restore();
}

function loadSignageImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Unknown image read error."));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve({ image, dataUrl: String(reader.result || "") });
      image.onerror = () => reject(new Error("Image could not be loaded."));
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function loadSignageImageFromDataUrl(dataUrl) {
  if (!dataUrl) {
    signagePhotoImage = null;
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      signagePhotoImage = image;
      resolve();
    };
    image.onerror = () => reject(new Error("Saved project photo could not be loaded."));
    image.src = dataUrl;
  });
}

async function loadSignagePhoto(file) {
  if (!file) {
    fileStatus.textContent = signagePhotoDataUrl ? "Signage photo loaded" : t("noFileLoaded");
    setLog(t("noFileSelected"), "warning");
    return;
  }

  try {
    setLog(t("fileReading", { fileName: file.name, percent: 0, size: formatBytes(file.size) }), "info");
    const result = await loadSignageImage(file);
    signagePhotoImage = result.image;
    signagePhotoDataUrl = result.dataUrl;
    signagePhotoName = file.name;
    signageRecognition = null;
    signageQuote = null;
    signageBackingBox = null;
    updateSignageToolAvailability();
    renderSignageCanvas();
    renderSignageDetections();
    renderSignageQuote();
    scheduleSignageAutosave();
    fileStatus.textContent = file.name;
    setLog(t("signagePhotoLoaded"), "success");
  } catch (error) {
    setLog(error.message, "warning");
  }
}

function loadSampleSignage() {
  signagePhotoImage = null;
  signagePhotoDataUrl = "";
  signagePhotoName = "Sample signage";
  signageCalibration = { x1: 216, y1: 338, x2: 984, y2: 338, inches: Number(signageGuidelineSizeInput.value) || 144 };
  signageBackingWidthInput.value = "144";
  signageBackingHeightInput.value = "36";
  signageBackingBox = signageCalibrationBox();
  signageRecognition = sampleSignageRecognition();
  signagePricing = signagePricing || sampleSignagePricing();
  signageQuote = calculateSignageQuote(signageRecognition, signagePricing);
  updateSignageToolAvailability();
  renderSignageCanvas();
  renderSignageDetections();
  renderSignageQuote();
  scheduleSignageAutosave();
  fileStatus.textContent = "Sample signage";
  setLog(t("signageSampleLoaded"), "success");
}

function sampleSignageRecognition() {
  const letters = ["W", "E", "E", "S", "E", "N", "G"];
  const widths = [18.5, 12, 12.1, 11.8, 12, 13.4, 13];
  const confidences = [0.92, 0.94, 0.93, 0.78, 0.94, 0.9, 0.89];
  const startX = 338;

  return {
    source: "sample",
    aiNote: "Sample recognition is ready. Letter S needs review before final quotation.",
    backing: { widthIn: 144, heightIn: 36, areaSqft: 36, box: signageCalibrationBox() },
    wordGroups: [{ text: "WEESENG", widthIn: 112, heightIn: 18, confidence: 0.92, box: { x: 312, y: 190, width: 576, height: 72 } }],
    letters: letters.map((text, index) => ({
      text,
      widthIn: widths[index],
      heightIn: index === 3 ? 17.6 : 18,
      confidence: confidences[index],
      box: { x: startX + index * 70, y: 202, width: index === 0 ? 64 : 52, height: 58 }
    })),
    reviewItems: ["Letter S confidence is low. Confirm its height before final quote."]
  };
}

function sampleSignagePricing() {
  return {
    currency: "MYR",
    backingRateSqft: 30,
    embossRateByLighting: {
      "front-lit": 20,
      "back-lit": 18,
      "no-lit": 13
    },
    embossMaterialOptions: ["Acrylic emboss", "Stainless steel emboss", "Aluminium emboss"],
    ledWattPerLetter: 12,
    ledCostPerWatt: 4.5,
    psuWatt: 200,
    psuUsableFactor: 0.8,
    psuCost: 130
  };
}

function updateSignageMaterialOptions(pricing) {
  const options = pricing?.embossMaterialOptions || [];
  if (!options.length) {
    return;
  }

  const current = signageMaterialSelect.value;
  signageMaterialSelect.innerHTML = "";
  options.forEach((option) => {
    const element = document.createElement("option");
    element.value = option;
    element.textContent = option;
    signageMaterialSelect.append(element);
  });

  if (options.includes(current)) {
    signageMaterialSelect.value = current;
  }
}

async function loadSignagePricing() {
  try {
    const response = await fetch("/api/signage/pricing");
    if (!response.ok) {
      throw new Error(await response.text());
    }

    signagePricing = await response.json();
    signageCurrency = signagePricing.currency || "MYR";
    updateSignageMaterialOptions(signagePricing);
  } catch {
    signagePricing = sampleSignagePricing();
    signageCurrency = signagePricing.currency;
  }
  return signagePricing;
}

function signageStepDefinitions() {
  return [
    { key: "stepProjectSetup", statusKey: "statusProjectSetup" },
    { key: "stepGuideline", statusKey: "statusGuideline" },
    { key: "stepRecognize", statusKey: "statusRecognize" },
    { key: "stepReview", statusKey: "statusReview" },
    { key: "stepMaterialPricing", statusKey: "statusMaterialPricing" },
    { key: "stepExport", statusKey: "statusExport" }
  ];
}

function updateSignageWizard() {
  const steps = signageStepDefinitions();
  activeSignageStep = Math.max(0, Math.min(steps.length - 1, activeSignageStep || 0));
  const current = steps[activeSignageStep];
  updateSignageGuidelineMirror();
  updateSignageToolAvailability();

  signageStepButtons.forEach((button) => {
    const index = Number(button.dataset.signageStep);
    button.classList.toggle("active", index === activeSignageStep);
    button.classList.toggle("complete", index < activeSignageStep);
  });

  signageStepPanels.forEach((panel) => {
    const isActive = Number(panel.dataset.signageStepPanel) === activeSignageStep;
    panel.hidden = !isActive;
    panel.style.display = isActive ? "" : "none";
  });

  signageStepEyebrow.textContent = t(current.key);
  signageStepTitle.textContent = t("signageQuotation");
  signageStageStatus.textContent = t(current.statusKey);
  signageBackStepButton.disabled = activeSignageStep === 0;
  signageNextStepButton.textContent = activeSignageStep === steps.length - 1 ? t("finishStep") : t("nextStep");
  localStorage.setItem("weesengSignageActiveStep", String(activeSignageStep));
}

function updateSignageGuidelineMirror() {
  const value = Number(signageGuidelineSizeInput.value) || signageCalibration.inches || 0;
  if (signageGuidelineSizeMirror) {
    signageGuidelineSizeMirror.value = `${formatControlNumber(value)} in`;
    signageGuidelineSizeMirror.textContent = `${formatControlNumber(value)} in`;
  }

  if (signageBackingSizeMirror) {
    const backingSize = signageBackingSizeInputs();
    const label = `${formatControlNumber(backingSize.widthIn)} in x ${formatControlNumber(backingSize.heightIn)} in`;
    signageBackingSizeMirror.value = label;
    signageBackingSizeMirror.textContent = label;
  }
}

function updateSignageToolAvailability() {
  if (!signageToolLetterButton) {
    return;
  }

  const hasRecognition = Boolean(signageRecognition);
  signageToolLetterButton.hidden = !hasRecognition;
  signageToolLetterButton.disabled = !hasRecognition;
  if (!hasRecognition && signageActiveTool === "letter") {
    signageActiveTool = "backing";
  }

  document.querySelectorAll(".signage-tools .tool-button").forEach((button) => {
    const tool = button.id.replace("signageTool", "").toLowerCase();
    button.classList.toggle("active", tool === signageActiveTool && !button.hidden);
  });
}

function updateSignageCanvasZoom() {
  signageCanvasZoom = Math.max(0.5, Math.min(3, Number(signageCanvasZoom) || 1));
  signageCanvas.style.width = `${signageCanvasZoom * 100}%`;
  signageCanvas.style.margin = signageCanvasZoom <= 1 ? "0 auto" : "0";
  signageCanvasBadge.textContent = `1200 x 720 canvas - ${Math.round(signageCanvasZoom * 100)}%`;
  signageZoomValue.textContent = `${Math.round(signageCanvasZoom * 100)}%`;
  localStorage.setItem("weesengSignageCanvasZoom", String(signageCanvasZoom));
}

function setSignageStep(step) {
  activeSignageStep = Math.max(0, Math.min(signageStepDefinitions().length - 1, Number(step) || 0));
  updateSignageWizard();
  scheduleSignageAutosave();
}

function defaultQuoteDate() {
  return new Date().toISOString().slice(0, 10);
}

function initSignageProjectFields() {
  if (!signageQuoteDateInput.value) {
    signageQuoteDateInput.value = defaultQuoteDate();
  }
}

function getSignageProjectFields() {
  return {
    customerName: signageCustomerNameInput.value.trim(),
    projectName: signageProjectNameInput.value.trim() || "Signage quotation",
    customerContact: signageCustomerContactInput.value.trim(),
    quoteDate: signageQuoteDateInput.value,
    validity: signageQuoteValidityInput.value.trim(),
    preparedBy: signagePreparedByInput.value.trim(),
    notes: signageProjectNotesInput.value.trim()
  };
}

function setSignageProjectFields(fields = {}) {
  signageCustomerNameInput.value = fields.customerName || "";
  signageProjectNameInput.value = fields.projectName || "Signage quotation";
  signageCustomerContactInput.value = fields.customerContact || "";
  signageQuoteDateInput.value = fields.quoteDate || defaultQuoteDate();
  signageQuoteValidityInput.value = fields.validity || "14 days";
  signagePreparedByInput.value = fields.preparedBy || "Weeseng Advertising";
  signageProjectNotesInput.value = fields.notes || "";
}

function createSignageProjectState() {
  return {
    schema: "weeseng-signage-quote",
    version: signageProjectSchemaVersion,
    savedAt: new Date().toISOString(),
    activeStep: activeSignageStep,
    project: getSignageProjectFields(),
    photo: {
      name: signagePhotoName,
      dataUrl: signagePhotoDataUrl
    },
    calibration: signageCalibration,
    backingBox: signageBackingBox,
    activeTool: signageActiveTool,
    recognition: signageRecognition,
    pricing: signagePricing,
    quote: signageQuote,
    settings: {
      lighting: signageLightingSelect.value,
      material: signageMaterialSelect.value,
      correctionPrompt: signageCorrectionPrompt.value,
      backingWidthIn: signageBackingWidthInput.value,
      backingHeightIn: signageBackingHeightInput.value,
      canvasZoom: signageCanvasZoom
    }
  };
}

async function applySignageProjectState(state) {
  if (!state || state.schema !== "weeseng-signage-quote") {
    throw new Error("This is not a Weeseng quotation project file.");
  }

  isRestoringSignageProject = true;
  setSignageProjectFields(state.project || {});
  signagePhotoName = state.photo?.name || "";
  signagePhotoDataUrl = state.photo?.dataUrl || "";
  await loadSignageImageFromDataUrl(signagePhotoDataUrl);
  signageCalibration = { ...signageCalibration, ...(state.calibration || {}) };
  signageGuidelineSizeInput.value = formatControlNumber(signageCalibration.inches || 144);
  signageBackingBox = state.backingBox || null;
  signageBackingWidthInput.value = state.settings?.backingWidthIn || state.recognition?.backing?.widthIn || 144;
  signageBackingHeightInput.value = state.settings?.backingHeightIn || state.recognition?.backing?.heightIn || 36;
  signageCanvasZoom = Number(state.settings?.canvasZoom) || signageCanvasZoom;
  signageRecognition = state.recognition || null;
  signagePricing = state.pricing || signagePricing || sampleSignagePricing();
  signageCurrency = signagePricing.currency || "MYR";
  updateSignageMaterialOptions(signagePricing);
  signageLightingSelect.value = state.settings?.lighting || signageLightingSelect.value;
  if (state.settings?.material) {
    signageMaterialSelect.value = state.settings.material;
  }
  signageCorrectionPrompt.value = state.settings?.correctionPrompt || "";
  signageQuote = state.quote || (signageRecognition ? calculateSignageQuote(signageRecognition, signagePricing) : null);
  activeSignageStep = Number.isInteger(state.activeStep) ? state.activeStep : 0;
  isRestoringSignageProject = false;

  renderSignageCanvas();
  renderSignageDetections();
  renderSignageQuote();
  updateSignageCanvasZoom();
  updateSignageToolAvailability();
  updateSignageWizard();
  fileStatus.textContent = signagePhotoName || t("noFileLoaded");
  scheduleSignageAutosave();
}

function scheduleSignageAutosave() {
  if (isRestoringSignageProject) {
    return;
  }

  clearTimeout(signageAutosaveTimer);
  signageAutosaveTimer = setTimeout(() => {
    try {
      const state = createSignageProjectState();
      localStorage.setItem(signageAutosaveKey, JSON.stringify(state));
      signageAutosaveStatus.textContent = t("projectAutosaved", { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
    } catch (error) {
      signageAutosaveStatus.textContent = error.message;
    }
  }, 250);
}

async function restoreSignageAutosave() {
  const raw = localStorage.getItem(signageAutosaveKey);
  if (!raw) {
    initSignageProjectFields();
    updateSignageWizard();
    return;
  }

  try {
    await applySignageProjectState(JSON.parse(raw));
  } catch {
    initSignageProjectFields();
    updateSignageWizard();
  }
}

function signageFileSlug() {
  const fields = getSignageProjectFields();
  return String(fields.projectName || fields.customerName || "signage-quotation")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "signage-quotation";
}

function saveSignageProjectFile() {
  const fileName = `${signageFileSlug()}.weeseng-quote.json`;
  downloadTextFile(fileName, JSON.stringify(createSignageProjectState(), null, 2), "application/json;charset=utf-8");
  signageAutosaveStatus.textContent = t("projectSavedNow");
  setLog(t("signageProjectSaved", { fileName }), "success");
}

async function loadSignageProjectFile(file) {
  if (!file) {
    return;
  }

  try {
    const state = JSON.parse(await readFileText(file));
    await applySignageProjectState(state);
    setLog(t("signageProjectLoaded", { fileName: file.name }), "success");
  } catch (error) {
    setLog(t("signageProjectLoadFailed", { message: error.message }), "warning");
  } finally {
    hideProgress();
  }
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function exportSignageQuoteCsv() {
  const fields = getSignageProjectFields();
  const lines = signageQuote?.lines || [];
  const rows = [
    ["Project", fields.projectName],
    ["Customer", fields.customerName],
    ["Contact", fields.customerContact],
    ["Quote date", fields.quoteDate],
    ["Validity", fields.validity],
    ["Prepared by", fields.preparedBy],
    [],
    ["Item", "Qty", "Total", "Currency"],
    ...lines.map((line) => [line.item, line.qty, Number(line.total || 0).toFixed(2), signageQuote?.currency || signageCurrency]),
    [],
    ["Total", "", Number(signageQuote?.total || 0).toFixed(2), signageQuote?.currency || signageCurrency],
    ["Notes", fields.notes]
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const fileName = `${signageFileSlug()}-quote.csv`;
  downloadTextFile(fileName, csv, "text/csv;charset=utf-8");
  setLog(t("signageCsvExported", { fileName }), "success");
}

async function recognizeSignage() {
  if (!signagePhotoDataUrl && signageRecognition?.source !== "sample") {
    signageAiNote.textContent = t("signageNeedPhoto");
    setLog(t("signageNeedPhoto"), "warning");
    return;
  }

  const originalButtonText = signageRerunButton.textContent;
  signageRerunButton.disabled = true;
  signageRerunButton.textContent = t("signageRecognizing");
  signageAiNote.textContent = t("signageRecognizing");

  try {
    setLog(t("signagePricingLoading"), "info");
    const pricing = await loadSignagePricing();
    const payload = {
      image: signageAiImageDataUrl() || signagePhotoDataUrl,
      imageFrame: signagePhotoFrame(),
      guideline: {
        ...signageCalibration,
        inches: Number(signageGuidelineSizeInput.value) || signageCalibration.inches
      },
      backingReference: {
        box: signageBackingBox,
        widthIn: signageBackingSizeInputs().widthIn,
        heightIn: signageBackingSizeInputs().heightIn
      },
      material: signageMaterialSelect.value,
      lighting: signageLightingSelect.value,
      correctionPrompt: signageCorrectionPrompt.value
    };
    setLog(t("signageRecognizing"), "info");
    const response = await fetch("/api/signage/recognize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    signageRecognition = normalizeSignageRecognition(await response.json());
    signageBackingBox = signageRecognition.backing?.box || signageBackingBox;
    signageQuote = calculateSignageQuote(signageRecognition, pricing);
    signageAiNote.textContent = signageRecognition.aiNote;
    await updateSignageDraft();
    updateSignageToolAvailability();
    renderSignageCanvas();
    renderSignageDetections();
    renderSignageQuote();
    setSignageStep(Math.max(activeSignageStep, 3));
    scheduleSignageAutosave();
    setLog(t("signageRecognized", { count: signageRecognition.letters.length }), "success");
  } catch (error) {
    signageAiNote.textContent = error.message;
    renderSignageCanvas();
    renderSignageDetections();
    renderSignageQuote();
    scheduleSignageAutosave();
    setLog(t("signageRecognizeFailed", { message: error.message }), "warning");
  } finally {
    signageRerunButton.disabled = false;
    signageRerunButton.textContent = originalButtonText || t("rerunAi");
  }
}

async function updateSignageDraft() {
  if (!signageQuote) {
    return;
  }

  try {
    signageAiNote.textContent = t("signageDrafting");
    const response = await fetch("/api/signage/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recognition: signageRecognition,
        quote: signageQuote,
        material: signageMaterialSelect.value,
        lighting: signageLightingSelect.value
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const draft = await response.json();
    signageQuote.note = draft.draft || signageQuote.note;
    scheduleSignageAutosave();
  } catch {
    signageQuote.note = signageQuote.note || t("signageQuoteReady");
    scheduleSignageAutosave();
  }
}

function normalizeSignageRecognition(result) {
  const backingSize = signageBackingSizeInputs();
  const fallbackBox = signageBackingBox || signageCalibrationBox();
  const pixelsPerInch = signagePixelsPerInch();
  const backing = result.backing || {
    widthIn: backingSize.widthIn,
    heightIn: backingSize.heightIn,
    box: fallbackBox
  };
  const wordGroups = Array.isArray(result.wordGroups) ? result.wordGroups : [];
  const letters = Array.isArray(result.letters) ? result.letters : [];

  if (!letters.length) {
    throw new Error(result.aiNote || "AI did not return any alphabet boxes. Try a clearer guideline or type the expected word in the correction prompt.");
  }

  return {
    source: result.source || "ai",
    aiNote: result.aiNote || "AI recognition completed. Review low-confidence items before final quote.",
    backing: {
      ...backing,
      widthIn: Number(backing.widthIn) || backingSize.widthIn,
      heightIn: Number(backing.heightIn) || backingSize.heightIn,
      areaSqft: Number(backing.areaSqft) || ((Number(backing.widthIn) || backingSize.widthIn) * (Number(backing.heightIn) || backingSize.heightIn)) / 144,
      box: backing.box || fallbackBox
    },
    wordGroups,
    letters: letters.map((letter, index) => ({
      ...letter,
      text: String(letter.text || "?"),
      widthIn: Number(letter.widthIn) || 0,
      heightIn: Number(letter.heightIn) || 0,
      confidence: Number(letter.confidence ?? 0.5),
      box: letter.box || {
        x: 260 + index * 64,
        y: 240,
        width: Math.max(24, (Number(letter.widthIn) || 8) * pixelsPerInch.x),
        height: Math.max(24, (Number(letter.heightIn) || 12) * pixelsPerInch.y)
      }
    })),
    reviewItems: Array.isArray(result.reviewItems) ? result.reviewItems : []
  };
}

function calculateSignageQuote(recognition, pricing) {
  const rates = pricing || sampleSignagePricing();
  const lighting = signageLightingSelect.value;
  const backingArea = Number(recognition.backing.areaSqft) || 0;
  const letterAreaSqin = recognition.letters.reduce((sum, letter) => {
    return sum + (Number(letter.widthIn) * Number(letter.heightIn));
  }, 0);
  const backingTotal = backingArea * Number(rates.backingRateSqft || 0);
  const embossPricing = rates.embossPricing;
  const selectedMaterial = signageMaterialSelect.value;
  const materialAddon = embossPricing?.materials?.find((material) => material.label === selectedMaterial);
  const lightingRate = embossPricing?.lighting?.[lighting];
  const embossTotal = lightingRate
    ? recognition.letters.reduce((sum, letter) => {
      const width = Number(letter.widthIn) || 0;
      const height = Number(letter.heightIn) || 0;
      const isSmall = height < 12;
      const base = isSmall
        ? height * Number(lightingRate.lessThan12PerHeightIn || 0)
        : width * height * Number(lightingRate.atLeast12PerSqIn || 0);
      const addon = isSmall
        ? height * Number(materialAddon?.lessThan12AddPerHeightIn || 0)
        : width * height * Number(materialAddon?.atLeast12AddPerSqIn || 0);
      return sum + base + addon;
    }, 0)
    : (letterAreaSqin / 144) * Number((rates.embossRateByLighting || {})[lighting] || rates.embossRateSqft || 0) * 5;
  const ledMeters = lighting === "no-lit" ? 0 : recognition.letters.reduce((sum, letter) => {
    return sum + (2 * (Number(letter.widthIn) + Number(letter.heightIn))) / 39.3701;
  }, 0);
  const sheetLedOption = rates.ledPricing?.options?.[0];
  const ledTotal = sheetLedOption
    ? ledMeters * Number(sheetLedOption.ratePerMeter || 0)
    : recognition.letters.length * Number(rates.ledWattPerLetter || 0) * Number(rates.ledCostPerWatt || 0);
  const ledWatts = lighting === "no-lit" ? 0 : recognition.letters.length * Number(rates.ledWattPerLetter || 0);
  const usablePsu = Number(rates.psuWatt || 1) * Number(rates.psuUsableFactor || 0.8);
  const psuQty = ledTotal > 0 ? Math.max(1, Math.ceil(ledWatts / usablePsu)) : 0;
  const psuCost = Number(rates.ledPricing?.psuOptions?.[0]?.unitCost || rates.psuCost || 0);
  const psuTotal = psuQty * psuCost;
  const lines = [
    { item: `Backing panel, ${formatControlNumber(backingArea)} sqft`, qty: "1", total: backingTotal },
    { item: `Emboss alphabet set, ${selectedMaterial}, ${lighting}`, qty: `${recognition.letters.length} letters`, total: embossTotal }
  ];

  if (ledTotal > 0) {
    lines.push({ item: `LED module and wiring, ${formatControlNumber(ledMeters)} m`, qty: "1", total: ledTotal });
    lines.push({ item: `PSU ${rates.psuWatt || 200}W`, qty: String(psuQty), total: psuTotal });
  }

  return {
    currency: rates.currency || "MYR",
    lines,
    total: lines.reduce((sum, line) => sum + line.total, 0),
    note: recognition.aiNote || t("signageQuoteReady")
  };
}

function money(value, currency = signageCurrency) {
  return `${currency} ${Number(value || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function signageLetterQuoteDetails(letter) {
  const rates = signagePricing || sampleSignagePricing();
  const lighting = signageLightingSelect.value;
  const selectedMaterial = signageMaterialSelect.value;
  const width = Number(letter.widthIn) || 0;
  const height = Number(letter.heightIn) || 0;
  const areaSqin = width * height;
  const isSmall = height < 12;
  const lightingRate = rates.embossPricing?.lighting?.[lighting];
  const materialAddon = rates.embossPricing?.materials?.find((material) => material.label === selectedMaterial);
  let embossBase = 0;
  let embossAddon = 0;
  let formula = "";

  if (lightingRate) {
    if (isSmall) {
      embossBase = height * Number(lightingRate.lessThan12PerHeightIn || 0);
      embossAddon = height * Number(materialAddon?.lessThan12AddPerHeightIn || 0);
      formula = `${formatControlNumber(height)} in height x ${money(Number(lightingRate.lessThan12PerHeightIn || 0))}/height in`;
    } else {
      embossBase = areaSqin * Number(lightingRate.atLeast12PerSqIn || 0);
      embossAddon = areaSqin * Number(materialAddon?.atLeast12AddPerSqIn || 0);
      formula = `${formatControlNumber(width)} x ${formatControlNumber(height)} = ${formatControlNumber(areaSqin)} sq in x ${money(Number(lightingRate.atLeast12PerSqIn || 0))}/sq in`;
    }
  } else {
    embossBase = (areaSqin / 144) * Number((rates.embossRateByLighting || {})[lighting] || rates.embossRateSqft || 0) * 5;
    formula = `${formatControlNumber(areaSqin / 144)} sqft x fallback rate`;
  }

  const ledMeters = lighting === "no-lit" ? 0 : (2 * (width + height)) / 39.3701;
  const ledRate = Number(rates.ledPricing?.options?.[0]?.ratePerMeter || 0);
  const ledTotal = ledMeters * ledRate;
  const psuShare = signageQuote && lighting !== "no-lit" && signageRecognition?.letters?.length
    ? (signageQuote.lines.find((line) => line.item.startsWith("PSU"))?.total || 0) / signageRecognition.letters.length
    : 0;
  const total = embossBase + embossAddon + ledTotal + psuShare;
  const lines = [
    `${letter.text || "?"} alphabet quote`,
    `Size: ${formatControlNumber(width)} in x ${formatControlNumber(height)} in`,
    `Emboss: ${formula} = ${money(embossBase, rates.currency)}`,
    `Material add-on: ${selectedMaterial} = ${money(embossAddon, rates.currency)}`
  ];

  if (lighting !== "no-lit") {
    lines.push(`LED: perimeter ${formatControlNumber(ledMeters)} m x ${money(ledRate, rates.currency)}/m = ${money(ledTotal, rates.currency)}`);
    lines.push(`PSU shared estimate: ${money(psuShare, rates.currency)}`);
  }

  lines.push(`Alphabet total estimate: ${money(total, rates.currency)}`);
  return lines.join("\n");
}

function ensureSignageLetterTooltip() {
  if (!signageLetterTooltip) {
    signageLetterTooltip = document.createElement("div");
    signageLetterTooltip.className = "floating-letter-tooltip";
    document.body.append(signageLetterTooltip);
  }

  return signageLetterTooltip;
}

function showSignageLetterTooltip(event) {
  const row = event.target.closest(".letter-quote-row");
  if (!row?.dataset.tooltip) {
    return;
  }

  const tooltip = ensureSignageLetterTooltip();
  tooltip.textContent = row.dataset.tooltip;
  tooltip.hidden = false;
  moveSignageLetterTooltip(event);
}

function moveSignageLetterTooltip(event) {
  if (!signageLetterTooltip || signageLetterTooltip.hidden) {
    return;
  }

  const offset = 16;
  const maxLeft = window.innerWidth - signageLetterTooltip.offsetWidth - 12;
  const maxTop = window.innerHeight - signageLetterTooltip.offsetHeight - 12;
  signageLetterTooltip.style.left = `${Math.max(12, Math.min(event.clientX + offset, maxLeft))}px`;
  signageLetterTooltip.style.top = `${Math.max(12, Math.min(event.clientY + offset, maxTop))}px`;
}

function hideSignageLetterTooltip(event) {
  if (!signageLetterTooltip) {
    return;
  }

  const nextRow = event.relatedTarget?.closest?.(".letter-quote-row");
  if (!nextRow) {
    signageLetterTooltip.hidden = true;
  }
}

function renderSignageDetections() {
  const recognition = signageRecognition;
  signageDetections.innerHTML = "";

  if (!recognition) {
    signageBackingSize.textContent = "-";
    signageWordGroup.textContent = "-";
    signageConfidence.textContent = "-";
    return;
  }

  signageBackingSize.textContent = `${formatControlNumber(recognition.backing.widthIn)} in x ${formatControlNumber(recognition.backing.heightIn)} in`;
  signageWordGroup.textContent = (recognition.wordGroups || []).map((group) => `${group.text} ${formatControlNumber(group.widthIn)} in`).join(", ");
  if (!recognition.letters.length) {
    signageConfidence.textContent = "0%";
    signageDetections.innerHTML = `<tr><td colspan="5">${t("aiNoteEmpty")}</td></tr>`;
    return;
  }

  const averageConfidence = recognition.letters.reduce((sum, letter) => sum + Number(letter.confidence || 0), 0) / recognition.letters.length;
  signageConfidence.textContent = `${Math.round(averageConfidence * 100)}%`;

  recognition.letters.forEach((letter, index) => {
    const row = document.createElement("tr");
    row.className = "letter-quote-row";
    row.dataset.tooltip = signageLetterQuoteDetails(letter);
    row.innerHTML = [
      `<td><input data-letter-index="${index}" data-field="text" value="${escapeXml(letter.text)}"></td>`,
      `<td><input data-letter-index="${index}" data-field="widthIn" type="number" step="0.01" value="${formatControlNumber(letter.widthIn)}"></td>`,
      `<td><input data-letter-index="${index}" data-field="heightIn" type="number" step="0.01" value="${formatControlNumber(letter.heightIn)}"></td>`,
      `<td><span class="confidence-pill${letter.confidence < 0.85 ? " warning" : ""}">${Math.round(letter.confidence * 100)}%</span></td>`,
      `<td><button class="letter-delete-button" type="button" data-delete-letter-index="${index}">${t("deleteLetter")}</button></td>`
    ].join("");
    signageDetections.append(row);
  });
}

function renderSignageQuote() {
  signageQuoteLines.innerHTML = "";

  if (!signageQuote) {
    signageAiNote.textContent = t("aiNoteEmpty");
    signageQuoteTotal.textContent = money(0);
    return;
  }

  signageAiNote.textContent = signageQuote.note;
  signageQuote.lines.forEach((line) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${line.item}</td><td>${line.qty}</td><td>${money(line.total, signageQuote.currency)}</td>`;
    signageQuoteLines.append(row);
  });
  signageQuoteTotal.textContent = money(signageQuote.total, signageQuote.currency);
}

function refreshSignageQuoteFromControls() {
  if (!signageRecognition) {
    setLog(t("signageNoQuoteToRefresh"), "warning");
    signageAiNote.textContent = t("signageNoQuoteToRefresh");
    return;
  }

  refreshSignageQuoteFromEdits();
  setLog(t("signageQuoteRefreshed"), "success");
}

function refreshSignageQuoteFromEdits(renderDetections = true) {
  if (!signageRecognition) {
    return;
  }

  signageQuote = calculateSignageQuote(signageRecognition, signagePricing || sampleSignagePricing());
  renderSignageCanvas();
  if (renderDetections) {
    renderSignageDetections();
  }
  renderSignageQuote();
  scheduleSignageAutosave();
}

function renderSignagePrintTemplate() {
  const fields = getSignageProjectFields();
  const quote = signageQuote || { lines: [], total: 0, currency: signageCurrency, note: t("aiNoteEmpty") };
  const rows = quote.lines.map((line) => `
    <tr>
      <td>${escapeXml(line.item)}</td>
      <td>${escapeXml(line.qty)}</td>
      <td>${escapeXml(money(line.total, quote.currency))}</td>
    </tr>
  `).join("");

  signagePrintTemplate.innerHTML = `
    <article class="print-quote-page">
      <header class="print-quote-header">
        <div>
          <strong>Weeseng Advertising</strong>
          <span>Signage Quotation</span>
        </div>
        <div class="print-quote-total">
          <span>Total</span>
          <strong>${escapeXml(money(quote.total, quote.currency))}</strong>
        </div>
      </header>
      <section class="print-quote-meta">
        <div><span>Customer</span><strong>${escapeXml(fields.customerName || "-")}</strong></div>
        <div><span>Project</span><strong>${escapeXml(fields.projectName || "-")}</strong></div>
        <div><span>Contact</span><strong>${escapeXml(fields.customerContact || "-")}</strong></div>
        <div><span>Date</span><strong>${escapeXml(fields.quoteDate || "-")}</strong></div>
        <div><span>Validity</span><strong>${escapeXml(fields.validity || "-")}</strong></div>
        <div><span>Prepared by</span><strong>${escapeXml(fields.preparedBy || "-")}</strong></div>
      </section>
      <table class="print-quote-table">
        <thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="3">No quote lines yet.</td></tr>`}</tbody>
      </table>
      <section class="print-quote-note">
        <h2>Notes</h2>
        <p>${escapeXml(quote.note || fields.notes || "")}</p>
        ${fields.notes ? `<p>${escapeXml(fields.notes)}</p>` : ""}
      </section>
    </article>
  `;
}

function printSignageQuote() {
  renderSignagePrintTemplate();
  window.print();
}

function saveSignageQuotePng() {
  const quoteLines = signageQuote ? signageQuote.lines : [];
  const rows = quoteLines.map((line, index) => {
    const y = 150 + index * 34;
    return `<text x="52" y="${y}" font-size="18" fill="#172026">${escapeXml(line.item)}</text><text x="570" y="${y}" font-size="18" fill="#172026">${escapeXml(line.qty)}</text><text x="690" y="${y}" font-size="18" fill="#172026">${escapeXml(money(line.total, signageQuote.currency))}</text>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="900" height="520" fill="#ffffff"/><text x="52" y="58" font-size="30" font-weight="700" fill="#172026">Weeseng Advertising</text><text x="52" y="92" font-size="20" fill="#0f766e">Signage Quotation Draft</text><line x1="52" y1="115" x2="848" y2="115" stroke="#d8e0e5"/><text x="52" y="132" font-size="15" font-weight="700" fill="#65727c">Item</text><text x="570" y="132" font-size="15" font-weight="700" fill="#65727c">Qty</text><text x="690" y="132" font-size="15" font-weight="700" fill="#65727c">Total</text>${rows}<rect x="52" y="420" width="796" height="58" fill="#f0fdfa" stroke="#99f6e4"/><text x="72" y="456" font-size="22" font-weight="700" fill="#115e59">Total quotation</text><text x="650" y="456" font-size="22" font-weight="700" fill="#115e59">${escapeXml(money(signageQuote?.total || 0, signageQuote?.currency || "MYR"))}</text></svg>`;
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 520;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `signage-quotation-${Date.now()}.png`;
      link.href = url;
      link.download = fileName;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setLog(t("signagePngSaved", { fileName }), "success");
    }, "image/png");
  };
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;"
  }[char]));
}

function signageCanvasPoint(event) {
  const rect = signageCanvas.getBoundingClientRect();
  const point = {
    x: ((event.clientX - rect.left) / rect.width) * signageCanvas.width,
    y: ((event.clientY - rect.top) / rect.height) * signageCanvas.height
  };
  return clampSignagePointToPhoto(point);
}

function clampSignagePointToPhoto(point) {
  if (!signagePhotoImage) {
    return point;
  }

  const frame = signagePhotoFrame();
  return {
    x: Math.max(frame.x, Math.min(frame.x + frame.width, point.x)),
    y: Math.max(frame.y, Math.min(frame.y + frame.height, point.y))
  };
}

function startSignageDrag(event) {
  if (activeTool !== "signage-quotation") {
    return;
  }

  if (signageActiveTool === "letter" && !signageRecognition) {
    return;
  }

  signageDragStart = signageCanvasPoint(event);
  signageDragPreview = null;
  if (event.pointerId !== undefined && signageCanvas.setPointerCapture) {
    signageCanvas.setPointerCapture(event.pointerId);
  }
}

function updateSignageDrag(event) {
  if (!signageDragStart || activeTool !== "signage-quotation") {
    return;
  }

  const point = signageCanvasPoint(event);

  if (signageActiveTool === "guideline") {
    const deltaX = Math.abs(point.x - signageDragStart.x);
    const deltaY = Math.abs(point.y - signageDragStart.y);
    const straightPoint = deltaX >= deltaY
      ? { x: point.x, y: signageDragStart.y }
      : { x: signageDragStart.x, y: point.y };
    signageCalibration = {
      x1: signageDragStart.x,
      y1: signageDragStart.y,
      x2: straightPoint.x,
      y2: straightPoint.y,
      inches: Number(signageGuidelineSizeInput.value) || signageCalibration.inches
    };
    signageRecognition = null;
    signageQuote = null;
    updateSignageToolAvailability();
    renderSignageDetections();
    renderSignageQuote();
  } else if (signageActiveTool === "backing") {
    const box = {
      x: Math.min(signageDragStart.x, point.x),
      y: Math.min(signageDragStart.y, point.y),
      width: Math.abs(point.x - signageDragStart.x),
      height: Math.abs(point.y - signageDragStart.y)
    };
    signageBackingBox = box;
    const backingSize = signageBackingSizeInputs();
    if (signageRecognition) {
      signageRecognition.backing = {
        widthIn: backingSize.widthIn,
        heightIn: backingSize.heightIn,
        areaSqft: (backingSize.widthIn * backingSize.heightIn) / 144,
        box
      };
      signageQuote = calculateSignageQuote(signageRecognition, signagePricing || sampleSignagePricing());
      renderSignageDetections();
      renderSignageQuote();
    }
  } else if (signageActiveTool === "letter" && signageRecognition) {
    const box = {
      x: Math.min(signageDragStart.x, point.x),
      y: Math.min(signageDragStart.y, point.y),
      width: Math.abs(point.x - signageDragStart.x),
      height: Math.abs(point.y - signageDragStart.y)
    };
    signageDragPreview = { tool: "letter", box, label: "New letter" };
  }

  renderSignageCanvas();
  scheduleSignageAutosave();
}

function finishSignageDrag(event) {
  if (signageDragPreview?.tool === "letter" && signageRecognition) {
    const box = signageDragPreview.box;
    if (box.width >= 8 && box.height >= 8) {
      const dimensions = signageBoxDimensionsIn(box);
      signageRecognition.letters.push({
        text: "?",
        widthIn: dimensions.widthIn,
        heightIn: dimensions.heightIn,
        confidence: 1,
        box
      });
      refreshSignageQuoteFromEdits();
      setSignageStep(3);
    }
  }

  signageDragStart = null;
  signageDragPreview = null;
  if (event?.pointerId !== undefined && signageCanvas.releasePointerCapture) {
    try {
      signageCanvas.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already be released by the browser.
    }
  }
  renderSignageCanvas();
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
  setLog(activeTool === "signage-quotation" ? t("openSignagePhoto") : activeTool === "stl-viewer" ? t("openStl") : t("filePickerReady"), "info");
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];

  if (activeTool === "signage-quotation") {
    await loadSignagePhoto(file);
    return;
  }

  if (activeTool === "stl-viewer") {
    await loadStlFile(file);
    return;
  }

  await loadGcodeFile(file);
});

fileInput.addEventListener("cancel", () => {
  if (activeTool === "signage-quotation") {
    fileStatus.textContent = signagePhotoDataUrl ? "Signage photo loaded" : t("noFileLoaded");
    setLog(t("fileCancelled"), "warning");
    return;
  }

  if (activeTool === "stl-viewer") {
    fileStatus.textContent = stlGeometry ? `${stlSourceName}.stl` : t("noFileLoaded");
    setLog(t("fileCancelled"), "warning");
    return;
  }

  fileStatus.textContent = inputGcode.value ? loadedFileName : t("noFileLoaded");
  setLog(t("fileCancelled"), "warning");
});

sampleButton.addEventListener("click", () => {
  if (activeTool === "signage-quotation") {
    loadSampleSignage();
    return;
  }

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

signageRerunButton.addEventListener("click", recognizeSignage);
signageRefreshQuoteButton.addEventListener("click", refreshSignageQuoteFromControls);
signageLightingSelect.addEventListener("change", refreshSignageQuoteFromControls);
signageMaterialSelect.addEventListener("change", refreshSignageQuoteFromControls);
signageGuidelineSizeInput.addEventListener("input", () => {
  signageCalibration.inches = Number(signageGuidelineSizeInput.value) || signageCalibration.inches;
  updateSignageGuidelineMirror();
  renderSignageCanvas();
  scheduleSignageAutosave();
});
[signageBackingWidthInput, signageBackingHeightInput].forEach((input) => {
  input.addEventListener("input", () => {
    updateSignageGuidelineMirror();
    if (signageRecognition?.backing && signageBackingBox) {
      const backingSize = signageBackingSizeInputs();
      signageRecognition.backing = {
        ...signageRecognition.backing,
        widthIn: backingSize.widthIn,
        heightIn: backingSize.heightIn,
        areaSqft: (backingSize.widthIn * backingSize.heightIn) / 144,
        box: signageBackingBox
      };
      refreshSignageQuoteFromEdits();
    } else {
      renderSignageCanvas();
      scheduleSignageAutosave();
    }
  });
});

signageZoomOutButton.addEventListener("click", () => {
  signageCanvasZoom -= 0.1;
  updateSignageCanvasZoom();
  scheduleSignageAutosave();
});
signageZoomInButton.addEventListener("click", () => {
  signageCanvasZoom += 0.1;
  updateSignageCanvasZoom();
  scheduleSignageAutosave();
});
signageZoomResetButton.addEventListener("click", () => {
  signageCanvasZoom = 1;
  updateSignageCanvasZoom();
  scheduleSignageAutosave();
});

[
  signageCustomerNameInput,
  signageProjectNameInput,
  signageCustomerContactInput,
  signageQuoteDateInput,
  signageQuoteValidityInput,
  signagePreparedByInput,
  signageProjectNotesInput
].forEach((input) => {
  input.addEventListener("input", scheduleSignageAutosave);
});

signageStepButtons.forEach((button) => {
  button.addEventListener("click", () => setSignageStep(Number(button.dataset.signageStep)));
});

signageBackStepButton.addEventListener("click", () => setSignageStep(activeSignageStep - 1));
signageNextStepButton.addEventListener("click", () => setSignageStep(activeSignageStep + 1));
signageLoadProjectButton.addEventListener("click", () => {
  signageProjectFileInput.value = "";
  signageProjectFileInput.click();
});
signageProjectFileInput.addEventListener("change", async () => {
  await loadSignageProjectFile(signageProjectFileInput.files[0]);
});
signageSaveProjectButton.addEventListener("click", saveSignageProjectFile);
signageSaveProjectButtonBottom.addEventListener("click", saveSignageProjectFile);
signageExportCsvButton.addEventListener("click", exportSignageQuoteCsv);

signageDetections.addEventListener("input", (event) => {
  const input = event.target;
  const index = Number(input.dataset.letterIndex);
  const field = input.dataset.field;

  if (!signageRecognition || !Number.isInteger(index) || !field) {
    return;
  }

  signageRecognition.letters[index][field] = field === "text" ? input.value : Number(input.value);
  refreshSignageQuoteFromEdits(false);
  const row = input.closest(".letter-quote-row");
  if (row) {
    row.dataset.tooltip = signageLetterQuoteDetails(signageRecognition.letters[index]);
    if (signageLetterTooltip && !signageLetterTooltip.hidden) {
      signageLetterTooltip.textContent = row.dataset.tooltip;
    }
  }
});
signageDetections.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-letter-index]");
  if (!button || !signageRecognition) {
    return;
  }

  const index = Number(button.dataset.deleteLetterIndex);
  if (!Number.isInteger(index)) {
    return;
  }

  signageRecognition.letters.splice(index, 1);
  refreshSignageQuoteFromEdits();
});
signageDetections.addEventListener("mouseover", showSignageLetterTooltip);
signageDetections.addEventListener("mousemove", moveSignageLetterTooltip);
signageDetections.addEventListener("mouseout", hideSignageLetterTooltip);

document.querySelectorAll(".signage-tools .tool-button").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled || button.hidden) {
      return;
    }
    document.querySelectorAll(".signage-tools .tool-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    signageActiveTool = button.id.replace("signageTool", "").toLowerCase();
    scheduleSignageAutosave();
  });
});

signagePromptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const current = signageCorrectionPrompt.value.trim();
    signageCorrectionPrompt.value = current ? `${current}\n${button.dataset.prompt}` : button.dataset.prompt;
    signageCorrectionPrompt.focus();
    scheduleSignageAutosave();
  });
});

signagePrintButton.addEventListener("click", printSignageQuote);
signagePngButton.addEventListener("click", saveSignageQuotePng);
signageCanvas.addEventListener("pointerdown", startSignageDrag);
signageCanvas.addEventListener("pointermove", updateSignageDrag);
signageCanvas.addEventListener("pointerup", finishSignageDrag);
window.addEventListener("pointerup", finishSignageDrag);
signageCanvas.addEventListener("mousedown", startSignageDrag);
signageCanvas.addEventListener("mousemove", updateSignageDrag);
signageCanvas.addEventListener("mouseup", finishSignageDrag);
window.addEventListener("mouseup", finishSignageDrag);

await restoreSignageAutosave();
applyLanguage();
updateStats();
resetStlMeasurements();
initSignageCanvas();
