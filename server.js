const http = require("http");
const fs = require("fs");
const path = require("path");
const { handlePricingApi } = require("./src/server/pricing-api.cjs");
const { createPricingStore } = require("./src/server/pricing-sync.cjs");
const { loadRuntimeConfigFromPaths, resolveRuntimePaths } = require("./src/server/runtime-config.cjs");
const { resolveStaticFile } = require("./src/server/static-paths.cjs");
const { createWordToolsService } = require("./src/server/word-tools-service.cjs");
const { allowOfficeRequest } = require('./src/server/office-access.cjs');
const { proxyWordTools } = require('./src/server/word-tools-proxy.cjs');
const { createPublisherApi } = require('./src/server/office-publisher-api.cjs');
const { createTubeFrameService, createTubeFrameApi } = require("./src/server/tube-frame-service.cjs");

const root = path.resolve(process.env.WEESENG_APP_ROOT || __dirname);
const runtimePaths = resolveRuntimePaths({
  appRoot: root,
  configDir: process.env.WEESENG_CONFIG_DIR || root
});
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".wasm": "application/wasm",
  ".gz": "application/gzip"
};

function send(response, status, body, contentType = "application/json; charset=utf-8") {
  response.writeHead(status, { "Content-Type": contentType });
  response.end(typeof body === "string" ? body : JSON.stringify(body));
}

function loadSignageConfig() {
  return loadRuntimeConfigFromPaths(runtimePaths);
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function parseCsvMatrix(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      value += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows.map((line) => line.map((cell) => String(cell || "").trim()));
}

function parseCsv(text) {
  const rows = parseCsvMatrix(text);
  const headers = rows.shift() || [];
  return rows
    .filter((line) => line.some(Boolean))
    .map((line) => Object.fromEntries(headers.map((header, index) => [header.trim(), (line[index] || "").trim()])));
}

function asNumber(value) {
  const match = String(value || "").replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function csvUrlForTab(config, gid) {
  const spreadsheetId = config.googleSheetId || String(config.googleSheetCsvUrl || "").match(/\/d\/([^/]+)/)?.[1];
  if (!spreadsheetId) {
    return config.googleSheetCsvUrl;
  }
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

function samplePricing() {
  return {
    currency: "MYR",
    backingRateSqft: 30,
    embossRateByLighting: {
      "front-lit": 20,
      "back-lit": 18,
      "no-lit": 13
    },
    ledWattPerLetter: 12,
    ledCostPerWatt: 4.5,
    psuWatt: 200,
    psuUsableFactor: 0.8,
    psuCost: 130,
    source: "sample"
  };
}

function pricingFromRows(rows, config) {
  const mapping = config.sheetMapping || {};
  const typeColumn = mapping.type || "type";
  const keyColumn = mapping.key || "key";
  const valueColumn = mapping.value || "value";
  const pricing = samplePricing();

  rows.forEach((row) => {
    const type = String(row[typeColumn] || "").toLowerCase();
    const key = String(row[keyColumn] || "").toLowerCase();
    const value = Number(row[valueColumn]);

    if (!Number.isFinite(value)) {
      return;
    }

    if (type === "backing" || key === "backingratesqft") pricing.backingRateSqft = value;
    if (key === "front-lit") pricing.embossRateByLighting["front-lit"] = value;
    if (key === "back-lit") pricing.embossRateByLighting["back-lit"] = value;
    if (key === "no-lit") pricing.embossRateByLighting["no-lit"] = value;
    if (key === "ledwattperletter") pricing.ledWattPerLetter = value;
    if (key === "ledcostperwatt") pricing.ledCostPerWatt = value;
    if (key === "psuwatt") pricing.psuWatt = value;
    if (key === "psuusablefactor") pricing.psuUsableFactor = value;
    if (key === "psucost") pricing.psuCost = value;
  });

  pricing.source = "google-sheet";
  pricing.currency = config.currency || pricing.currency;
  return pricing;
}

function parseEmbossTab(matrix) {
  const lightingMap = {
    frontlitledface: "front-lit",
    backlithaloglow: "back-lit",
    nolitstandard: "no-lit"
  };
  const emboss = {
    lighting: {},
    materials: [],
    baseOptions: [],
    chineseMultiplier: { no: 1, yes: 1.5 }
  };
  let section = "";

  matrix.forEach((row) => {
    const first = String(row[0] || "").trim();
    const second = String(row[1] || "").trim();
    if (first) {
      section = normalizeKey(first);
    }

    if (section === "casing" && second) {
      const key = lightingMap[normalizeKey(second)];
      if (key) {
        emboss.lighting[key] = {
          label: second,
          lessThan12PerHeightIn: asNumber(row[2]),
          atLeast12PerSqIn: asNumber(row[3])
        };
      }
    }

    if (section === "material" && second) {
      emboss.materials.push({
        label: second,
        lessThan12AddPerHeightIn: asNumber(row[2]),
        atLeast12AddPerSqIn: asNumber(row[3])
      });
    }

    if (section === "base" && second) {
      emboss.baseOptions.push({
        label: second,
        lessThan12Multiplier: asNumber(row[2]) || 1,
        atLeast12Multiplier: asNumber(row[3]) || 1
      });
    }

    if (section === "ischineseword" && normalizeKey(second) === "yes") {
      emboss.chineseMultiplier.yes = asNumber(row[2]) || asNumber(row[3]) || 1.5;
    }
  });

  return emboss;
}

function parseBackingTab(matrix) {
  return matrix.slice(1)
    .filter((row) => row[0] && row[2])
    .map((row) => ({
      type: row[0],
      color: row[1],
      rateSqft: asNumber(row[2])
    }));
}

function parseCutMaterialTab(matrix) {
  return matrix.slice(1)
    .filter((row) => row[0] && row[1] && row[2] && !/^material$/i.test(row[0]))
    .map((row) => ({
      material: row[0],
      thicknessMm: row[1],
      rateSqIn: asNumber(row[2]),
      includeMaterial: /^yes$/i.test(row[3] || "")
    }));
}

function parseLedTab(matrix) {
  const led = { options: [], psuOptions: [] };
  let section = "";

  matrix.forEach((row) => {
    const first = String(row[0] || "").trim();
    const second = String(row[1] || "").trim();

    if (normalizeKey(first) === "type" && normalizeKey(second).includes("meter")) {
      section = "led";
      return;
    }

    if (normalizeKey(first) === "type" && normalizeKey(second).includes("unit")) {
      section = "psu";
      return;
    }

    if (section === "led" && first && second) {
      led.options.push({
        type: first,
        ratePerMeter: asNumber(second),
        acrylic6mm: /^yes$/i.test(row[2] || ""),
        rateSqIn: asNumber(row[3])
      });
    }

    if (section === "psu" && first && second) {
      led.psuOptions.push({
        type: first,
        unitCost: asNumber(second),
        watt: asNumber(first)
      });
    }
  });

  return led;
}

function parseSimpleRateTab(matrix, unit) {
  const rows = matrix.filter((row) => row.some(Boolean));
  const header = rows[0] || [];
  return rows.slice(1)
    .filter((row) => row.some(Boolean))
    .map((row) => {
      const first = row[0] || "";
      const second = row[1] || "";
      const third = row[2] || "";
      const rateCell = [...row].reverse().find((cell) => asNumber(cell) > 0) || "";
      return {
        label: [first, second].filter(Boolean).join(" - ") || first || "Option",
        type: first,
        detail: second,
        rate: asNumber(rateCell),
        unit,
        header
      };
    })
    .filter((option) => option.rate > 0);
}

function pricingFromWorkbook(tabs, config) {
  const pricing = samplePricing();
  const workbook = {};

  tabs.forEach((tab) => {
    workbook[tab.name] = tab.rows;
  });

  const emboss = tabs.find((tab) => normalizeKey(tab.name) === "embossword");
  if (emboss) {
    pricing.embossPricing = parseEmbossTab(emboss.matrix);
    pricing.embossMaterialOptions = pricing.embossPricing.materials.map((material) => material.label);
    Object.entries(pricing.embossPricing.lighting).forEach(([key, value]) => {
      pricing.embossRateByLighting[key] = value.atLeast12PerSqIn;
    });
  }

  const backing = tabs.find((tab) => normalizeKey(tab.name) === "backingwithmetalframe");
  if (backing) {
    pricing.backingOptions = parseBackingTab(backing.matrix);
    pricing.backingRateSqft = pricing.backingOptions[0]?.rateSqft || pricing.backingRateSqft;
  }

  const cut = tabs.find((tab) => normalizeKey(tab.name) === "cutmaterial");
  if (cut) {
    pricing.cutMaterialOptions = parseCutMaterialTab(cut.matrix);
  }

  const led = tabs.find((tab) => normalizeKey(tab.name) === "led");
  if (led) {
    pricing.ledPricing = parseLedTab(led.matrix);
    const defaultPsu = pricing.ledPricing.psuOptions[0];
    pricing.psuCost = defaultPsu?.unitCost || pricing.psuCost;
    pricing.psuWatt = defaultPsu?.watt || pricing.psuWatt;
  }

  const etching = tabs.find((tab) => normalizeKey(tab.name) === "etching");
  if (etching) {
    pricing.etchingOptions = parseSimpleRateTab(etching.matrix, "sqin");
  }

  const paibian = tabs.find((tab) => normalizeKey(tab.name) === "paibianplaquehouseplate");
  if (paibian) {
    pricing.paibianOptions = parseSimpleRateTab(paibian.matrix, "sqft");
  }

  const notice = tabs.find((tab) => normalizeKey(tab.name) === "noticesigndangersignwarningsign");
  if (notice) {
    pricing.noticeOptions = parseSimpleRateTab(notice.matrix, "sqft");
  }

  const skylift = tabs.find((tab) => normalizeKey(tab.name) === "skylift");
  if (skylift) {
    pricing.skyliftDefault = asNumber(skylift.matrix.flat().find((cell) => asNumber(cell) > 0));
  }

  pricing.otherTabs = tabs
    .filter((tab) => !["embossword", "backingwithmetalframe", "cutmaterial", "led", "etching", "paibianplaquehouseplate", "noticesigndangersignwarningsign", "skylift"].includes(normalizeKey(tab.name)))
    .map((tab) => ({ name: tab.name, rows: tab.matrix }));
  pricing.source = "google-workbook";
  pricing.currency = config.currency || pricing.currency;
  pricing.workbookTabs = tabs.map((tab) => ({ name: tab.name, gid: tab.gid, rowCount: tab.rows.length }));
  return pricing;
}

async function fetchWorkbookPricing(config) {
  const tabs = config.googleSheetTabs || [];
  if (!tabs.length) {
    return null;
  }

  const loadedTabs = [];
  for (const tab of tabs) {
    const url = tab.csvUrl || csvUrlForTab(config, tab.gid);
    const sheetResponse = await fetch(url);
    if (!sheetResponse.ok) {
      throw new Error(`${tab.name} failed: ${sheetResponse.status}`);
    }
    const text = await sheetResponse.text();
    const matrix = parseCsvMatrix(text).filter((row) => row.some(Boolean));
    if (!matrix.length) {
      throw new Error(`${tab.name} returned no pricing rows.`);
    }
    loadedTabs.push({
      name: tab.name,
      gid: tab.gid,
      matrix,
      rows: parseCsv(text)
    });
  }

  return pricingFromWorkbook(loadedTabs, config);
}

async function fetchConfiguredPricing(config) {
  const workbookPricing = await fetchWorkbookPricing(config);
  if (workbookPricing) {
    return workbookPricing;
  }
  if (!config.googleSheetCsvUrl) {
    throw new Error("Google Sheet pricing is not configured.");
  }
  const sheetResponse = await fetch(config.googleSheetCsvUrl);
  if (!sheetResponse.ok) {
    throw new Error(`Google Sheet request failed: ${sheetResponse.status}`);
  }
  return pricingFromRows(parseCsv(await sheetResponse.text()), config);
}

const pricingStore = createPricingStore({
  cachePath: runtimePaths.cachePath,
  fetchPricing: fetchConfiguredPricing
});

async function handlePricing(request, response) {
  const result = await handlePricingApi({
    method: request.method,
    config: loadSignageConfig(),
    store: pricingStore
  });
  send(response, result.status, result.body);
}

function sampleRecognition() {
  const letters = ["W", "E", "E", "S", "E", "N", "G"];
  const widths = [18.5, 12, 12.1, 11.8, 12, 13.4, 13];
  const confidences = [0.92, 0.94, 0.93, 0.78, 0.94, 0.9, 0.89];
  return {
    source: "sample",
    aiNote: "Sample/local fallback recognition. Letter S needs review before final quotation.",
    backing: { widthIn: 144, heightIn: 36, areaSqft: 36, box: { x: 216, y: 150, width: 768, height: 158 } },
    wordGroups: [{ text: "WEESENG", widthIn: 112, heightIn: 18, confidence: 0.92, box: { x: 312, y: 190, width: 576, height: 72 } }],
    letters: letters.map((text, index) => ({
      text,
      widthIn: widths[index],
      heightIn: index === 3 ? 17.6 : 18,
      confidence: confidences[index],
      box: { x: 338 + index * 70, y: 202, width: index === 0 ? 64 : 52, height: 58 }
    })),
    reviewItems: ["Letter S confidence is low. Confirm its height before final quote."]
  };
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(raw);
}

async function handleRecognize(request, response) {
  const config = loadSignageConfig();
  const body = await collectBody(request);
  const apiKey = process.env.SIGNAGE_AI_API_KEY || config.apiKey;

  if (!body.image) {
    send(response, 400, { error: "No uploaded signage photo was sent to AI. Please upload a photo first." });
    return;
  }

  if (!apiKey || !config.baseUrl || !config.model) {
    send(response, 200, sampleRecognition());
    return;
  }

  const prompt = [
    config.recognitionPrompt || "Recognize signage emboss alphabet dimensions from the marked backing/guideline.",
    config.alphabetLibrary ? `Alphabet/library notes: ${config.alphabetLibrary}` : "",
    "Do not use sample words. Read only the uploaded photo. Never return WEESENG unless that exact word is visible in the uploaded photo.",
    "Use the guideline as the true real-world scale. If recognition is uncertain, still return best-effort boxes and mark low confidence.",
    "Detect each visible character individually. A Chinese character counts as one letter item. Do not merge multiple characters into one letter box.",
    "Letter boxes must be tight around the visible white/colored character strokes only. Do not box the red backing panel, truck graphic, arrow, whole word, logo background, or empty sign area.",
    "If a character is partly connected, still return the smallest rectangle around that character only. Large boxes covering more than one character are invalid; split them into separate characters or omit them with a reviewItems note.",
    "Do not force every character to the same height. Lowercase letters, uppercase letters, numbers, and stylized symbols can have different real widths/heights.",
    "Ignore tiny printed secondary text such as address, SINCE year, phone, footer labels, or shop-info captions unless the user correction explicitly asks for them.",
    "Coordinates must align to the actual character position in the working image. Do not estimate columns; place x/y exactly around the visible glyph.",
    "Return only JSON with: backing {widthIn,heightIn,areaSqft,box}, wordGroups [{text,widthIn,heightIn,confidence,box}], letters [{text,widthIn,heightIn,confidence,box}], reviewItems, aiNote.",
    "The uploaded image is a 1200 x 720 working canvas. The real photo is fitted inside it without stretching, so blank margins may appear.",
    "Each box must use canvas coordinates for the 1200 x 720 working canvas: {x,y,width,height}. Keep boxes on the fitted photo area, not the blank margins.",
    body.imageFrame ? `Fitted photo area on canvas: x=${body.imageFrame.x}, y=${body.imageFrame.y}, width=${body.imageFrame.width}, height=${body.imageFrame.height}.` : "",
    `Guideline inches: ${body.guideline?.inches || 144}.`,
    `Guideline canvas line: x1=${body.guideline?.x1}, y1=${body.guideline?.y1}, x2=${body.guideline?.x2}, y2=${body.guideline?.y2}.`,
    body.backingReference?.box ? `Backing reference box: x=${body.backingReference.box.x}, y=${body.backingReference.box.y}, width=${body.backingReference.box.width}, height=${body.backingReference.box.height}. Real backing size: ${body.backingReference.widthIn} in x ${body.backingReference.heightIn} in.` : "",
    `Material: ${body.material || "not selected"}. Lighting: ${body.lighting || "front-lit"}.`,
    body.correctionPrompt ? `User correction: ${body.correctionPrompt}` : ""
  ].filter(Boolean).join("\n");

  const aiResponse = await fetch(`${String(config.baseUrl).replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: body.image, detail: "high" } }
          ]
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });

  if (!aiResponse.ok) {
    throw new Error(`AI request failed: ${aiResponse.status} ${await aiResponse.text()}`);
  }

  const data = await aiResponse.json();
  send(response, 200, extractJson(data.choices?.[0]?.message?.content || "{}"));
}

async function handleDraft(request, response) {
  const config = loadSignageConfig();
  const body = await collectBody(request);
  const apiKey = process.env.SIGNAGE_AI_API_KEY || config.apiKey;

  if (!apiKey || !config.baseUrl || !config.model) {
    send(response, 200, {
      draft: "Quotation draft generated from calculated line items. Please review dimensions, material, lighting, LED, and PSU before sending to customer."
    });
    return;
  }

  const aiResponse = await fetch(`${String(config.baseUrl).replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: "Write a concise customer-facing signage quotation note. Do not change calculated prices." },
        { role: "user", content: JSON.stringify(body) }
      ],
      temperature: 0.2
    })
  });

  if (!aiResponse.ok) {
    throw new Error(`AI draft failed: ${aiResponse.status}`);
  }

  const data = await aiResponse.json();
  send(response, 200, { draft: data.choices?.[0]?.message?.content || "" });
}

function handleCodexCowartLink(_request, response) {
  const cowartUrl = "http://127.0.0.1:43217/";
  const prompt = [
    "Open the Cowart canvas for this project in the Codex in-app browser.",
    `Use ${cowartUrl} if the Cowart service is already running.`
  ].join(" ");
  const params = new URLSearchParams({
    path: root,
    prompt
  });

  send(response, 200, {
    codexUrl: `codex://new?${params.toString()}`,
    cowartUrl,
    projectPath: root
  });
}

async function handleApi(request, response, pathname) {
  try {
    if (request.method === "GET" && pathname === "/api/codex-cowart-link") {
      handleCodexCowartLink(request, response);
      return true;
    }

    if (request.method === "GET" && pathname === "/api/signage/pricing") {
      await handlePricing(request, response);
      return true;
    }

    if (request.method === "POST" && pathname === "/api/signage/pricing/sync") {
      await handlePricing(request, response);
      return true;
    }

    if (request.method === "POST" && pathname === "/api/signage/recognize") {
      await handleRecognize(request, response);
      return true;
    }

    if (request.method === "POST" && pathname === "/api/signage/draft") {
      await handleDraft(request, response);
      return true;
    }
  } catch (error) {
    send(response, 500, { error: error.message });
    return true;
  }

  return false;
}

function serveStatic(request, response, pathname) {
  const filePath = resolveStaticFile(root, pathname);

  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": types[path.extname(filePath)] || "text/plain; charset=utf-8"
    });
    response.end(data);
  });
}

function createWeesengServer(options = {}) {
  const office = options.office || (process.env.WEESENG_OFFICE_ADDRESS ? {
    address: process.env.WEESENG_OFFICE_ADDRESS,
    subnet: process.env.WEESENG_OFFICE_SUBNET || '192.168.0.0/24'
  } : null);
  const tubeFrameApi = createTubeFrameApi(options.tubeFrameService || createTubeFrameService({ configDir: runtimePaths.configDir || root }));
  const publisherApi = createPublisherApi(root, office);
  const wordTools = options.wordToolsService || createWordToolsService({
    appDir: process.env.WEESENG_WORD_TOOLS_ROOT || path.join(root, 'tools', 'word-tools'),
    configDir: runtimePaths.configDir || process.env.WEESENG_CONFIG_DIR || root
  });
  const server = http.createServer(async (request, response) => {
    if (!allowOfficeRequest(request, office)) { send(response, 403, { error: 'Office network access only' }); return; }
    const url = new URL(request.url, "http://127.0.0.1");
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { send(response, 400, { error: 'Invalid request path' }); return; }

    if (await publisherApi(request, response, pathname)) return;
    if (pathname === '/api/health') { send(response, 200, { ok: true, release: process.env.WEESENG_RELEASE_ID || 'development' }); return; }
    if (pathname.startsWith('/word-tools/')) { await proxyWordTools(request, response, wordTools); return; }

    if (await tubeFrameApi(request, response, pathname)) return;
    if (pathname === '/api/word-tools/start' && request.method === 'POST') {
      try { await wordTools.ensureStarted(); send(response, 200, { url: '/word-tools/' }); }
      catch (error) { send(response, 503, { error: error.message }); }
      return;
    }

    if (await handleApi(request, response, pathname)) {
      return;
    }

    serveStatic(request, response, pathname);
  });
  server.stopWordTools = () => wordTools.stop();
  server.on('close', () => { wordTools.stop(); });
  return server;
}

function startServer(options = {}) {
  const config = loadSignageConfig();
  const host = options.host || process.env.HOST || config.serverHost || "127.0.0.1";
  const port = Number(options.port ?? process.env.PORT ?? config.serverPort ?? 4173);
  const server = createWeesengServer();

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      const url = `http://127.0.0.1:${actualPort}/`;
      console.log(`Weeseng Software running at ${url}`);
      resolve({ server, host, port: actualPort, url });
    });
  });
}

if (require.main === module) {
  startServer().then(({ server }) => {
    let closing = false;
    const shutdown = async () => {
      if (closing) return;
      closing = true;
      await server.stopWordTools();
      server.close(() => process.exit(0));
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { createWeesengServer, startServer };
