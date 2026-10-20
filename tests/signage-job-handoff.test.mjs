import assert from "node:assert/strict";
import {
  approveQuotation,
  buildProductionManifest,
  createProtectedQuotationState,
  createQuotationId,
  fingerprintQuotationState,
  getApprovalStatus,
  shouldNormalizeLoadedRecognition,
  validateProductionManifest
} from "../src/signage/job-handoff.mjs";

const quoteInput = {
  project: {
    customerName: "Acme Sdn Bhd",
    customerContact: "Jane / 0123456789",
    projectName: "Frontlit reception sign",
    requestedDeliveryDate: "2026-07-01",
    notes: "Match approved artwork."
  },
  settings: {
    productCategory: "emboss",
    productOption: "",
    material: "Aluminium edgeless",
    lighting: "front-lit",
    rateOverrides: {},
    skyliftCost: "0",
    assemblyCost: "50",
    installationCost: "100"
  },
  recognition: {
    backing: { widthIn: 144, heightIn: 36, areaSqft: 36 },
    letters: [
      { text: "A", widthIn: 12, heightIn: 18 },
      { text: "B", widthIn: 11, heightIn: 18 }
    ]
  },
  backings: [
    {
      id: "backing-1",
      name: "Main backing",
      widthIn: 144,
      heightIn: 36,
      areaSqft: 36,
      material: "ACP"
    }
  ],
  quote: {
    currency: "MYR",
    total: 2500,
    lines: [
      {
        item: "Main backing - ACP",
        dimension: "144 in x 36 in",
        qty: "36 sqft",
        total: 900
      },
      {
        item: "Emboss letters",
        dimension: "2 letters",
        qty: "1 set",
        total: 1600
      }
    ]
  }
};

const protectedA = createProtectedQuotationState(quoteInput);
const protectedB = createProtectedQuotationState({
  ...quoteInput,
  activeStep: 5,
  photo: { dataUrl: "data:image/png;base64,ignored" }
});

assert.deepEqual(protectedA, protectedB);
assert.equal(fingerprintQuotationState(protectedA), fingerprintQuotationState(protectedB));

const quoteId = createQuotationId(
  new Date("2026-06-15T12:00:00.000Z"),
  new Uint8Array([1, 2, 3, 4])
);
assert.equal(quoteId, "QT-20260615-01020304");

const approval = approveQuotation({
  quotationId: quoteId,
  revision: 2,
  approvedBy: "Project Manager",
  acceptanceReference: "Customer accepted by WhatsApp",
  approvedAt: "2026-06-15T12:30:00.000Z",
  quotation: quoteInput
});

assert.equal(approval.status, "approved");
assert.equal(approval.approvedRevision, 2);
assert.equal(getApprovalStatus(quoteInput, approval), "approved");

const changedQuote = {
  ...quoteInput,
  quote: { ...quoteInput.quote, total: 2600 }
};
assert.equal(getApprovalStatus(changedQuote, approval), "changed");
assert.equal(getApprovalStatus(quoteInput, null), "draft");
assert.equal(shouldNormalizeLoadedRecognition(2), true);
assert.equal(shouldNormalizeLoadedRecognition(3), false);

const manifest = buildProductionManifest({
  packageId: "jobpkg_test_001",
  exportedAt: "2026-06-15T13:00:00.000Z",
  quotationId: quoteId,
  revision: 2,
  approval,
  quotation: quoteInput,
  sourcePhotoPath: "attachments/source-photo-01.jpg",
  previewPath: "quotation/quotation-preview.png"
});

assert.equal(manifest.schema, "weeseng-production-job");
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.source.quotationId, quoteId);
assert.equal(manifest.commercialApproval.approvedBy, "Project Manager");
assert.equal(manifest.job.customerName, "Acme Sdn Bhd");
assert.equal(manifest.job.jobType, "full_product");
assert.equal(manifest.job.quotationTotal, 2500);
assert.equal(manifest.items.length, 1);
assert.equal(manifest.items[0].widthIn, 144);
assert.equal(manifest.items[0].heightIn, 36);
assert.equal(manifest.items[0].specifications.letters.length, 2);
assert.deepEqual(manifest.items[0].attachmentPaths, ["attachments/source-photo-01.jpg"]);
assert.equal("pricing" in manifest, false);
assert.equal("photo" in manifest, false);

assert.deepEqual(
  validateProductionManifest(
    manifest,
    new Set([
      "manifest.json",
      "attachments/source-photo-01.jpg",
      "quotation/quotation-preview.png"
    ])
  ),
  []
);

const unapprovedManifest = structuredClone(manifest);
unapprovedManifest.commercialApproval.status = "draft";
assert.match(validateProductionManifest(unapprovedManifest, new Set())[0], /approved/i);

const missingAttachmentManifest = structuredClone(manifest);
assert.match(
  validateProductionManifest(
    missingAttachmentManifest,
    new Set(["manifest.json", "quotation/quotation-preview.png"])
  ).join(" "),
  /source-photo-01\.jpg/
);

console.log("signage job handoff tests passed");
