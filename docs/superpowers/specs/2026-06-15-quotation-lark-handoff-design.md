# Quotation to Lark Job Handoff Design

Date: 2026-06-15
Status: Approved design

## Purpose

Reduce repeated data entry between the Weeseng Signage Quotation tool and the future Lark Production Management v2 Base.

After a manager records that the customer accepted a quotation, the quotation tool exports one portable `.weeseng-job` package. Lark imports the package as a Draft Job and Draft Job Items. Production tasks are generated only after a manager performs a separate production approval in Lark.

## Scope

This design covers:

- The commercial approval state in the quotation tool.
- The `.weeseng-job` package format.
- Import into Lark as Draft Job and Job Items.
- Validation, duplicate prevention and error handling.
- Attachment transfer.
- Revision and audit information.

This design does not cover:

- Automatic creation of Production Tasks during import.
- Direct API synchronization between the quotation tool and Lark.
- Customer approval through a public link.
- Historical quotation migration.
- Final Lark table field identifiers, which will be assigned while building Production Management v2.

## Existing Quotation Capability

The quotation tool already supports:

- Customer and project details.
- Source photos.
- Guideline calibration and backing measurements.
- Detected and manually corrected letters.
- Product, material and lighting selections.
- Rate overrides and manual add-on costs.
- Deterministic quotation calculation.
- Browser autosave.
- Save/load through `.weeseng-quote.json`.
- CSV, PNG and print/PDF output.

The existing `.weeseng-quote.json` remains the editable working-project format. It is not the Lark import format because it contains editor state, canvas data, pricing internals and embedded image data that Lark does not require.

## Selected Approach

Use one `.weeseng-job` package created only after the manager confirms customer acceptance.

The package is a ZIP archive with a custom extension. It contains structured JSON plus the files needed by production.

Reasons:

- One file is easy for staff to understand and transfer.
- Attachments cannot be separated or lost accidentally.
- The package can be validated before any Lark records are created.
- The schema can evolve through explicit version numbers.
- It supports manual import first and direct API transfer later without replacing the data contract.

## Approval Model

There are two separate approvals.

### Commercial Approval

Performed in the quotation tool by a manager after receiving customer acceptance.

Commercial approval:

- Records the approving manager and timestamp.
- Records an optional customer acceptance reference or note.
- Freezes an immutable quotation revision for export.
- Enables `.weeseng-job` export.
- Does not create production tasks.

Editing commercially important values after approval creates a new quotation revision and requires approval again. Important values include customer, items, dimensions, materials, quantities, prices, total and production specifications.

### Production Approval

Performed in Lark after package import.

Production approval:

- Confirms delivery date, production template, selected stages and responsible manager.
- Confirms imported attachments and specifications are sufficient.
- Changes the Job from Draft to Approved.
- Generates Production Tasks using the approved templates.
- Uses an idempotency key so repeated clicks cannot create duplicate tasks.

## User Flow

1. Staff prepares and reviews the quotation.
2. Customer accepts the quotation outside the tool.
3. Manager selects `Confirm Customer Acceptance`.
4. The tool creates a locked accepted revision.
5. Manager selects `Export for Production`.
6. The tool creates one `.weeseng-job` package.
7. Manager uploads the package to the Lark Import Inbox.
8. Lark validates the package without creating production tasks.
9. Lark creates or updates one Draft Job and its Draft Job Items.
10. Manager reviews production fields and attachments.
11. Manager approves the Job.
12. Lark generates Production Tasks exactly once.

## Package Layout

```text
customer-project-QT-2026-001.weeseng-job
├── manifest.json
├── quotation/
│   ├── accepted-quotation.pdf
│   └── quotation-preview.png
├── attachments/
│   ├── source-photo-01.jpg
│   ├── customer-drawing-01.pdf
│   └── artwork-01.png
└── checksums.json
```

`manifest.json` is required. Other files are optional unless referenced by the manifest.

The package must not include API keys, private configuration, Google Sheet URLs, raw AI prompts or browser-local state.

## Manifest Contract

The manifest uses UTF-8 JSON and contains:

```json
{
  "schema": "weeseng-production-job",
  "schemaVersion": 1,
  "packageId": "jobpkg_01J...",
  "exportedAt": "2026-06-15T11:30:00.000Z",
  "source": {
    "application": "weeseng-signage-quotation",
    "quotationId": "QT-2026-001",
    "revision": 3
  },
  "commercialApproval": {
    "status": "approved",
    "approvedBy": "Manager Name",
    "approvedAt": "2026-06-15T11:20:00.000Z",
    "acceptanceReference": "Customer confirmed by WhatsApp"
  },
  "job": {
    "title": "Customer - Frontlit Signage",
    "jobType": "full_product",
    "customerName": "Customer Sdn Bhd",
    "customerContact": "Name / phone / email",
    "requestedDeliveryDate": null,
    "currency": "MYR",
    "quotationTotal": 1714.12,
    "notes": "Production-facing notes",
    "suggestedProductTemplate": "Frontlit"
  },
  "items": [
    {
      "externalItemId": "item_01",
      "name": "Frontlit signage",
      "quantity": 1,
      "unit": "set",
      "widthIn": 144,
      "heightIn": 36,
      "material": "Aluminium edgeless",
      "lighting": "front-lit",
      "specifications": {
        "letters": 13,
        "backingAreaSqft": 36
      },
      "productionNotes": "Use approved dimensions and attached artwork.",
      "attachmentPaths": [
        "attachments/source-photo-01.jpg",
        "attachments/artwork-01.png"
      ]
    }
  ],
  "quotation": {
    "pdfPath": "quotation/accepted-quotation.pdf",
    "previewPath": "quotation/quotation-preview.png",
    "lineSummary": [
      {
        "description": "Frontlit signage",
        "quantity": 1,
        "total": 1714.12
      }
    ]
  }
}
```

## Data Mapping

### Draft Job

| Package field | Lark destination |
| --- | --- |
| `packageId` | Import Package ID |
| `source.quotationId` | Quotation ID |
| `source.revision` | Quotation Revision |
| `job.title` | Job Name |
| `job.jobType` | Job Type |
| `job.customerName` | Customer |
| `job.customerContact` | Customer Contact |
| `job.requestedDeliveryDate` | Requested Delivery Date |
| `job.currency` | Currency |
| `job.quotationTotal` | Accepted Quotation Total |
| `job.notes` | Job Notes |
| `job.suggestedProductTemplate` | Suggested Product Template |
| approval fields | Commercial Approval audit fields |

Imported Jobs always start with:

- Job Status: `Draft`
- Production Approval: `Not Approved`
- Task Generation Status: `Not Started`
- Import Review Status: `Needs Review`

### Draft Job Items

Each `items[]` entry becomes one linked Job Item. Dimensions, material, lighting, quantity, specifications, production notes and attachments remain item-level values.

Quotation pricing lines may be stored as a summary or attachment. They must not be treated as production stages.

## Import Validation

Before creating records, the importer validates:

- ZIP structure is readable.
- `manifest.json` exists and contains valid JSON.
- `schema` equals `weeseng-production-job`.
- `schemaVersion` is supported.
- Commercial approval status is `approved`.
- `packageId`, quotation ID and revision are present.
- Job title and customer are present.
- At least one Job Item exists.
- Every attachment path stays inside the package.
- Referenced attachments exist.
- File sizes and allowed extensions meet configured limits.
- Checksums match when supplied.
- Currency and numeric values are valid.

Validation failure creates an Import Inbox error record and does not create a partial Job.

## Duplicate Handling

`packageId` is the primary import idempotency key.

- Importing the same package again must not create another Job.
- If the same quotation ID and revision arrive with a different package ID, Lark flags it for manager review.
- A newer approved quotation revision may update the existing Draft Job only while production approval is still pending.
- A newer revision cannot silently overwrite an approved or active production Job. It creates a revision exception requiring manager action.

Task generation uses a separate idempotency key derived from Job ID plus production approval revision.

## Attachment Handling

The importer uploads production-relevant files to the Draft Job or related Job Item.

Recommended categories:

- Accepted quotation.
- Source/customer photo.
- Customer drawing.
- Approved artwork.
- Measurement or site reference.

The package manifest stores relative file paths and labels. It does not store absolute Windows paths.

Embedded photo `dataUrl` values from `.weeseng-quote.json` must be converted into normal files inside `attachments/`.

## Quotation Tool Changes

The quotation tool will need:

- Stable quotation ID and revision.
- Commercial approval state.
- Approving manager and timestamp.
- Customer acceptance reference.
- Detection of changes that invalidate approval.
- `Confirm Customer Acceptance` action.
- `Export for Production` action.
- ZIP package creation.
- A mapper from quotation state to the production manifest.
- Validation before download.
- Accepted quotation PDF/preview generation for the package.
- Clear display of Draft, Approved and Changed After Approval states.

The existing `Save Project` action remains available and continues producing `.weeseng-quote.json`.

## Lark Changes

Production Management v2 will need:

- Import Inbox table and attachment upload form.
- Package extraction service or approved automation endpoint.
- Manifest validation.
- Draft Job and Job Item creation.
- Attachment upload and linking.
- Import log and error message.
- Duplicate-package detection.
- Review action leading to production approval.

Lark Base automations alone may not be suitable for ZIP extraction. A small integration service can perform package validation and call the Lark APIs while Base remains the user-facing review and approval system.

## Security

- Reject archive entries containing `..`, absolute paths or executable extensions.
- Enforce compressed and extracted size limits.
- Do not execute package content.
- Do not include secrets in exports.
- Treat imported text as untrusted input.
- Record uploader, import timestamp, package checksum and validation result.

## Failure Recovery

- Package validation is all-or-nothing.
- Record creation uses a staged import transaction where feasible.
- If attachments fail after Draft records are created, mark the import `Incomplete`; do not permit production approval.
- Retrying an incomplete import reuses the same Package ID and updates the same Draft records.
- Import errors must identify the field or file that needs correction.

## Testing

### Quotation Tool

- Approved quotation exports a valid package.
- Unapproved quotation cannot export for production.
- Editing commercial values invalidates approval.
- Package contains all referenced files.
- Manifest excludes API keys and editor-only data.
- Existing project save/load remains compatible.

### Lark Import

- Valid package creates one Draft Job and correct Job Items.
- Imported attachments open successfully.
- Duplicate package creates no duplicate records.
- Unsupported schema version is rejected clearly.
- Missing or unsafe attachment paths are rejected.
- New quotation revision follows the revision rules.
- Import never generates Production Tasks.
- Production approval generates tasks exactly once.

## Delivery Phases

### Phase Q0: Contract

- Finalize manifest fields and Lark mappings.
- Create representative sample packages.
- Define size, attachment and validation limits.

Acceptance: sample packages can be reviewed without referring to quotation editor internals.

### Phase Q1: Quotation Approval

- Add quotation identity, revision and commercial approval.
- Invalidate approval when protected values change.

Acceptance: only an unchanged approved revision can be exported.

### Phase Q2: Package Export

- Generate manifest, quotation output, attachments and checksums.
- Download one `.weeseng-job` file.

Acceptance: exported packages pass local validation and reopen as standard ZIP archives.

### Phase Q3: Lark Draft Import

- Build Import Inbox workflow and package validation service.
- Create Draft Job and Draft Job Items.

Acceptance: import transfers the accepted quotation without manual re-keying and creates no tasks.

### Phase Q4: Production Approval

- Add review checks, template selection and task-generation safeguards.

Acceptance: manager approval generates the expected tasks exactly once.

### Phase Q5: Polish and Direct Transfer

- Improve user messages, revision comparison and retry handling.
- Optionally replace manual file upload with direct transfer using the same manifest contract.

Acceptance: direct transfer and file import produce equivalent Draft Jobs.

## Success Measures

- Staff do not re-key customer, project, item, dimension, material or quotation-total data.
- A package imports into a reviewable Draft Job in under two minutes.
- No Production Task is created before production approval.
- Duplicate imports create zero duplicate Jobs and tasks.
- Production staff can access every required drawing and photo from the Job or Job Item.
- The working quotation project can still be reopened independently from its production handoff.

