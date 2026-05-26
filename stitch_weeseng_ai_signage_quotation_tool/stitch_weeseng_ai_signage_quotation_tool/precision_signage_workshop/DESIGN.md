---
name: Precision Signage Workshop
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  sidebar-width: 260px
  toolbar-height: 56px
---

## Brand & Style
The design system is engineered for operational clarity and high-density information management. It serves professionals in the signage and advertising fabrication industry, where technical accuracy and workflow velocity are paramount. 

The aesthetic is **Corporate / Modern** with a lean toward **Minimalism**, prioritizing content over chrome. The interface evokes a sense of reliability and architectural precision through a rigorous adherence to a grid, generous but controlled whitespace, and a focus on utilitarian beauty. The emotional goal is to provide a "calm cockpit" experience—reducing cognitive load during complex fabrication planning and media buying tasks.

## Colors
The palette is built on a foundation of "Slate" neutrals to ensure a sophisticated, technical atmosphere. 

- **Primary Action (Teal):** Reserved for the "Path of Success"—primary buttons, active workflow steps, and key focus states.
- **Surface Strategy:** The design system utilizes a layered grayscale approach. `#FFFFFF` is used for the main workspace and cards, `#F8FAFC` for page backgrounds, and `#F1F5F9` for inset components like sidebars and toolbar wells.
- **Functional Accents:** Amber, Emerald, and Rose are used strictly for status signaling (Review, Success, and Error) to ensure these high-priority messages are never missed in a dense UI.
- **Typography:** Deep Slate (`#0F172A`) provides maximum contrast for readability, while muted Slate (`#334155`) handles secondary metadata.

## Typography
This design system employs a dual-font strategy to balance character with utility.

- **Hanken Grotesk** is used for headlines and section titles. Its sharp, contemporary geometry reinforces the "workshop" and "precision" narrative.
- **Inter** is the workhorse for all body text, inputs, and data tables. It is chosen for its exceptional legibility at small sizes and high x-height, which is critical for dense operational dashboards.
- **Labels:** Use `label-bold` for section headers and table headers to create a strong visual hierarchy through uppercase styling and increased tracking.
- **Density:** Favor `body-md` (14px) for primary application content to maximize information density without sacrificing accessibility.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for the main content areas to ensure predictable fabrication previews, while the administrative dashboards utilize a **Fluid Grid** to maximize screen real estate.

- **Grid:** A 12-column system with 16px gutters is standard for dashboard views. 
- **The Sidebar:** A fixed-width (260px) left navigation provides persistent access to workflow stages. It should use a subtle vertical border (`#E2E8F0`) rather than a shadow.
- **Operational Density:** Use the 8px (`sm`) and 16px (`md`) spacing units for most component internal padding. This "tight" rhythm supports the tool's requirement for operational efficiency.
- **Breakpoints:**
  - Desktop: 1280px+ (Full 12-column)
  - Tablet: 768px - 1279px (Sidebar collapses to icons)
  - Mobile: Below 768px (Stacked layout, hidden sidebars)

## Elevation & Depth
Depth in this design system is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. This maintains a "flat" professional look that feels like a precision instrument.

- **Base Layer:** `#F8FAFC` (Page Background).
- **Surface Layer:** `#FFFFFF` (Cards, Tables, Main Workspace). These surfaces use a 1px border of `#E2E8F0`.
- **Active Layer:** A very soft, diffused shadow (`0 4px 6px -1px rgba(0, 0, 0, 0.05)`) is used only for floating elements like dropdown menus or active modals to lift them slightly from the workspace.
- **Canvas Depth:** The "Integrated Canvas" area should use an inner shadow or a slightly darker well (`#F1F5F9`) to differentiate the creative zone from the administrative controls.

## Shapes
The shape language is strictly defined by an **8px (0.5rem)** corner radius. 

- **Cards & Modals:** Use `rounded-lg` (16px) for large containers to provide a modern, polished feel.
- **Controls:** Buttons, Input fields, and Stepper nodes use the base 8px radius. This "precise" roundedness avoids the playfulness of pill shapes while feeling more approachable than sharp 90-degree corners.
- **Data Indicators:** Small status dots or notification pips should remain circular (full rounded).

## Components
Consistent component execution is vital for a production-focused tool.

- **Buttons:** Primary buttons use Teal (`#0D9488`) with white text. Secondary buttons use a Slate (`#334155`) outline with no fill.
- **Workflow Steppers:** Use a horizontal line connector. Active steps are Teal with a white icon; completed steps are Emerald; pending steps are Light Grey (`#E2E8F0`).
- **Data Tables:** High-density rows (40px height). Headers use `label-bold` with a light grey background (`#F8FAFC`). Use zebra-striping sparingly or stick to subtle bottom borders.
- **Input Fields:** 1px border in `#CBD5E1`. On focus, the border shifts to Teal with a subtle 2px outer glow in 10% Teal.
- **Canvas Toolbars:** Floating or docked at the top of the workspace. Use `#FFFFFF` with a 1px border and 8px spacing between icon-only buttons.
- **Status Bars:** Use a 40px height bar at the very top of the app for global system health and user notifications, utilizing the functional colors (Success, Warning, Error) as thin top-border accents.