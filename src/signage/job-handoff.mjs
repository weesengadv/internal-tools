const PRODUCTION_SCHEMA = "weeseng-production-job";
const PRODUCTION_SCHEMA_VERSION = 1;

function cleanText(value) {
  return String(value ?? "").trim();
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sortObject(value[key])])
    );
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(sortObject(value));
}

function safePath(path) {
  const value = cleanText(path).replaceAll("\\", "/");
  if (!value || value.startsWith("/") || /^[a-z]:\//i.test(value)) {
    return false;
  }
  return !value.split("/").some((part) => part === ".." || part === "");
}

export function createQuotationId(now = new Date(), randomValues) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) {
    throw new Error("A valid date is required to create a quotation ID.");
  }
  const bytes = randomValues || globalThis.crypto?.getRandomValues?.(new Uint8Array(4));
  if (!bytes || bytes.length < 4) {
    throw new Error("Four random bytes are required to create a quotation ID.");
  }
  const datePart = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("");
  const randomPart = [...bytes.slice(0, 4)]
    .map((value) => Number(value).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `QT-${datePart}-${randomPart}`;
}

export function createProtectedQuotationState(input = {}) {
  const project = input.project || {};
  const settings = input.settings || {};
  const recognition = input.recognition || {};
  const quote = input.quote || {};
  return {
    project: {
      customerName: cleanText(project.customerName),
      customerContact: cleanText(project.customerContact),
      projectName: cleanText(project.projectName),
      requestedDeliveryDate: project.requestedDeliveryDate || null,
      notes: cleanText(project.notes)
    },
    settings: {
      productCategory: cleanText(settings.productCategory),
      productOption: cleanText(settings.productOption),
      material: cleanText(settings.material),
      lighting: cleanText(settings.lighting),
      rateOverrides: settings.rateOverrides || {},
      skyliftCost: finiteNumber(settings.skyliftCost),
      assemblyCost: finiteNumber(settings.assemblyCost),
      installationCost: finiteNumber(settings.installationCost)
    },
    backings: (input.backings || []).map((backing) => ({
      id: cleanText(backing.id),
      name: cleanText(backing.name),
      material: cleanText(backing.material),
      widthIn: finiteNumber(backing.widthIn),
      heightIn: finiteNumber(backing.heightIn),
      areaSqft: finiteNumber(backing.areaSqft)
    })),
    recognition: {
      backing: recognition.backing ? {
        widthIn: finiteNumber(recognition.backing.widthIn),
        heightIn: finiteNumber(recognition.backing.heightIn),
        areaSqft: finiteNumber(recognition.backing.areaSqft)
      } : null,
      letters: (recognition.letters || []).map((letter) => ({
        text: cleanText(letter.text),
        widthIn: finiteNumber(letter.widthIn),
        heightIn: finiteNumber(letter.heightIn),
        backingId: cleanText(letter.backingId)
      }))
    },
    quote: {
      currency: cleanText(quote.currency || "MYR"),
      total: finiteNumber(quote.total),
      lines: (quote.lines || []).map((line) => ({
        item: cleanText(line.item),
        dimension: cleanText(line.dimension),
        qty: cleanText(line.qty),
        unit: cleanText(line.unit),
        total: finiteNumber(line.total)
      }))
    }
  };
}

export function fingerprintQuotationState(state) {
  const text = stableJson(state);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function approveQuotation({
  quotationId,
  revision = 1,
  approvedBy,
  acceptanceReference = "",
  approvedAt = new Date().toISOString(),
  quotation
}) {
  if (!cleanText(quotationId)) {
    throw new Error("Quotation ID is required.");
  }
  if (!cleanText(approvedBy)) {
    throw new Error("Approving manager is required.");
  }
  const protectedState = createProtectedQuotationState(quotation);
  if (!protectedState.project.customerName) {
    throw new Error("Customer name is required before approval.");
  }
  if (!protectedState.project.projectName) {
    throw new Error("Project name is required before approval.");
  }
  if (!protectedState.quote.lines.length || protectedState.quote.total <= 0) {
    throw new Error("A positive quotation with at least one line is required before approval.");
  }
  return {
    status: "approved",
    approvedRevision: Math.max(1, Math.trunc(finiteNumber(revision, 1))),
    approvedBy: cleanText(approvedBy),
    approvedAt: new Date(approvedAt).toISOString(),
    acceptanceReference: cleanText(acceptanceReference),
    protectedFingerprint: fingerprintQuotationState(protectedState)
  };
}

export function getApprovalStatus(quotation, approval) {
  if (!approval || approval.status !== "approved" || !approval.protectedFingerprint) {
    return "draft";
  }
  const current = fingerprintQuotationState(createProtectedQuotationState(quotation));
  return current === approval.protectedFingerprint ? "approved" : "changed";
}

export function shouldNormalizeLoadedRecognition(projectVersion) {
  return !Number.isFinite(Number(projectVersion)) || Number(projectVersion) < 3;
}

function suggestedTemplate(settings) {
  const option = cleanText(settings.productOption);
  const category = cleanText(settings.productCategory);
  if (option) {
    return option;
  }
  if (category === "emboss") {
    const lighting = cleanText(settings.lighting);
    return lighting === "front-lit" ? "Frontlit" : lighting === "back-lit" ? "Backlit" : "Nolit";
  }
  return category;
}

function buildJobItem(quotation, sourcePhotoPath) {
  const project = quotation.project || {};
  const settings = quotation.settings || {};
  const recognition = quotation.recognition || {};
  const backings = quotation.backings || [];
  const primaryBacking = backings[0] || recognition.backing || {};
  const attachmentPaths = sourcePhotoPath ? [sourcePhotoPath] : [];
  return {
    externalItemId: "item_01",
    name: cleanText(project.projectName) || "Signage item",
    quantity: 1,
    unit: "set",
    widthIn: finiteNumber(primaryBacking.widthIn),
    heightIn: finiteNumber(primaryBacking.heightIn),
    material: cleanText(settings.material || primaryBacking.material),
    lighting: cleanText(settings.lighting),
    specifications: {
      productCategory: cleanText(settings.productCategory),
      productOption: cleanText(settings.productOption),
      backingAreaSqft: finiteNumber(primaryBacking.areaSqft),
      backings: backings.map((backing) => ({
        name: cleanText(backing.name),
        material: cleanText(backing.material),
        widthIn: finiteNumber(backing.widthIn),
        heightIn: finiteNumber(backing.heightIn),
        areaSqft: finiteNumber(backing.areaSqft)
      })),
      letters: (recognition.letters || []).map((letter) => ({
        text: cleanText(letter.text),
        widthIn: finiteNumber(letter.widthIn),
        heightIn: finiteNumber(letter.heightIn)
      }))
    },
    productionNotes: cleanText(project.notes),
    attachmentPaths
  };
}

export function buildProductionManifest({
  packageId,
  exportedAt = new Date().toISOString(),
  quotationId,
  revision = 1,
  approval,
  quotation,
  sourcePhotoPath = null,
  previewPath = null
}) {
  const protectedState = createProtectedQuotationState(quotation);
  const approvalStatus = getApprovalStatus(quotation, approval);
  const project = protectedState.project;
  const settings = protectedState.settings;
  const quote = protectedState.quote;
  return {
    schema: PRODUCTION_SCHEMA,
    schemaVersion: PRODUCTION_SCHEMA_VERSION,
    packageId: cleanText(packageId),
    exportedAt: new Date(exportedAt).toISOString(),
    source: {
      application: "weeseng-signage-quotation",
      quotationId: cleanText(quotationId),
      revision: Math.max(1, Math.trunc(finiteNumber(revision, 1)))
    },
    commercialApproval: {
      status: approvalStatus,
      approvedBy: cleanText(approval?.approvedBy),
      approvedAt: approval?.approvedAt || null,
      acceptanceReference: cleanText(approval?.acceptanceReference),
      protectedFingerprint: cleanText(approval?.protectedFingerprint)
    },
    job: {
      title: project.projectName,
      jobType: "full_product",
      customerName: project.customerName,
      customerContact: project.customerContact,
      requestedDeliveryDate: project.requestedDeliveryDate,
      currency: quote.currency || "MYR",
      quotationTotal: quote.total,
      notes: project.notes,
      suggestedProductTemplate: suggestedTemplate(settings)
    },
    items: [buildJobItem(protectedState, sourcePhotoPath)],
    quotation: {
      pdfPath: null,
      previewPath,
      lineSummary: quote.lines.map((line) => ({
        description: line.item,
        quantity: line.qty || "1",
        total: line.total
      }))
    }
  };
}

export function validateProductionManifest(manifest, availablePaths = new Set()) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") {
    return ["Manifest must be an object."];
  }
  if (manifest.schema !== PRODUCTION_SCHEMA) {
    errors.push(`Unsupported schema: ${manifest.schema || "missing"}.`);
  }
  if (manifest.schemaVersion !== PRODUCTION_SCHEMA_VERSION) {
    errors.push(`Unsupported schema version: ${manifest.schemaVersion || "missing"}.`);
  }
  if (!cleanText(manifest.packageId)) {
    errors.push("Package ID is required.");
  }
  if (!cleanText(manifest.source?.quotationId)) {
    errors.push("Quotation ID is required.");
  }
  if (!Number.isInteger(manifest.source?.revision) || manifest.source.revision < 1) {
    errors.push("Quotation revision must be a positive integer.");
  }
  if (manifest.commercialApproval?.status !== "approved") {
    errors.push("Commercial approval must be approved.");
  }
  if (!cleanText(manifest.commercialApproval?.approvedBy)) {
    errors.push("Approving manager is required.");
  }
  if (!cleanText(manifest.job?.title)) {
    errors.push("Job title is required.");
  }
  if (!cleanText(manifest.job?.customerName)) {
    errors.push("Customer name is required.");
  }
  if (!Number.isFinite(Number(manifest.job?.quotationTotal)) || Number(manifest.job.quotationTotal) <= 0) {
    errors.push("Quotation total must be greater than zero.");
  }
  if (!Array.isArray(manifest.items) || !manifest.items.length) {
    errors.push("At least one Job Item is required.");
  }

  const referencedPaths = [
    manifest.quotation?.pdfPath,
    manifest.quotation?.previewPath,
    ...(manifest.items || []).flatMap((item) => item.attachmentPaths || [])
  ].filter(Boolean);

  referencedPaths.forEach((path) => {
    if (!safePath(path)) {
      errors.push(`Unsafe attachment path: ${path}.`);
    } else if (!availablePaths.has(path)) {
      errors.push(`Referenced file is missing: ${path}.`);
    }
  });

  return errors;
}
