# HTML To Mini Program

Use this reference when converting PRD HTML, prototype markup, or static web snippets into WeChat Mini Program code.

## TailwindCSS Preservation

- Preserve compatible TailwindCSS utility classes during conversion instead of rewriting everything into page-level `scss`.
- Change the node type first, then keep the original class list as much as possible.
- Remove only classes tied to unsupported HTML structure, inline SVG behavior, or browser-only interactions.
- Use `scss` only for rules that are repetitive, unsupported in the utility layer, or clearer as local component styles.
- If a TDesign component replaces a raw node, keep useful layout wrapper classes around that component when needed.

## Tag Mapping

| Web / PRD pattern | Prefer in mini program |
| --- | --- |
| `div`, `section`, `article`, `header`, `footer`, `main`, `aside` | `view` |
| `span`, `strong`, `em`, short labels | `text` |
| paragraph-like text block | `view` containing `text`, or direct text when simple |
| `img` | `image` or `t-image` |
| `button` | `t-button` first, raw `button` only when necessary |
| `input` | `t-input` first |
| `textarea` | `t-textarea` first |
| `ul` / `ol` / repeated cards | `block` + `wx:for`, or `t-grid` / `t-cell-group` |
| `a` / anchor row | `navigator`, `t-cell`, or `view` with `bindtap` |
| `svg`, iconfont, web icon component | `t-icon` first; fallback to image asset only if needed |

## TDesign-First Component Picks

- Navigation/header: `t-navbar`
- List rows / settings / profile info: `t-cell-group`, `t-cell`
- Buttons and primary actions: `t-button`
- Tabs: `t-tabs`, `t-tab-panel`
- Tags and badges: `t-tag`, `t-badge`
- Grid shortcuts or feature entries: `t-grid`, `t-grid-item`
- Avatar and images: `t-avatar`, `t-image`
- Form input: `t-input`, `t-textarea`, `t-radio-group`, `t-picker`, `t-date-time-picker`, `t-upload`
- Toggle and checked state: `t-switch` first for binary on/off, then `t-checkbox` or `t-radio-group` based on semantics
- Notice and feedback: `t-notice-bar`, `t-toast`, `t-message`, `t-dialog`, `t-loading`
- Icons: `t-icon`

## Unsupported Web Patterns To Remove

- Raw HTML tags copied directly into WXML
- Inline `<svg>` markup
- DOM event props such as `onclick`, `onchange`, `onscroll`
- React/Vue syntax such as `className`, `style={{}}`, fragments, `v-if`, `v-for`, `@click`
- Browser-only navigation or form assumptions
- Tailwind classes are not part of the unsupported list by default; keep them unless they no longer apply after conversion.
- Tailwind peer-selector toggle patterns (for example `peer-checked:*`, `peer-focus:*`) when they rely on sibling selector outputs such as `~` in WXSS.

## WXML Rewrites

- Use `wx:if` and `wx:elif` / `wx:else` for conditional rendering.
- Use `wx:for` for repeated regions and keep repeated data in `*.js`.
- Use `bindtap` for taps and `bind:change` or component-specific bindings for inputs.
- Use `slot` only when the chosen component supports it.
- Keep text nodes explicit when the structure would otherwise be hard to read.
- Keep `class="..."` in Tailwind utility style when the project already uses `weapp-tailwindcss`.

## Layout Guidance

- Preserve the PRD's module order and emphasis, not every wrapper.
- Prefer a simple container hierarchy over deep nested wrappers copied from the web.
- Preserve existing utility classes for spacing, typography, borders, colors, shadows, and gradients when they already fit the target layout.
- Use local `*.scss` for spacing and fine-tuning around TDesign components only when utility classes are insufficient.
- Default to `rpx` when introducing new layout sizes in a mini-program page.
- Rebuild decorative SVG accents with borders, background colors, gradients, or existing icons when practical.

## Popup Branch Extraction Pattern

- For `t-popup` with multiple branches, keep page-level branch selector (`currentType`) and extract heavy branch body into standalone components.
- Prefer one object prop contract from page to component (for example `risk-data="{{riskPopup}}"`) rather than many flat props.
- Register extracted component in page `index.json`; keep TDesign dependencies scoped in component `index.json`.
- Keep popup branch rendering in component and keep branch switching logic in page.
- Add mock trigger data if a branch has no natural entry in current API response, then remove/adjust mock data as needed.

## TDesign Icon Validation

- Validate icon names against local `node_modules/tdesign-miniprogram/miniprogram_dist/icon/icon.wxss`.
- Prefer icon names already used by the project to reduce visual inconsistency and runtime surprises.
- If no suitable icon exists, use image asset fallback rather than leaving inline SVG.
## Decision Heuristics

- If the PRD block looks like a settings row, inspect existing `t-cell` usage before writing custom layout.
- If the PRD block looks like a dashboard shortcut grid, inspect existing `t-grid-item` usage first.
- If the PRD uses a generic icon next to a label, find an existing `t-icon` name already used in the project before inventing a new pattern.
- If the PRD already has readable Tailwind utility classes, preserve them on the converted mini-program nodes unless a component replacement makes them obsolete.
- If the PRD suggests a complex web interaction that the current project does not support, implement the simplest mini-program-compatible version and note the assumption.
- If the PRD shows a custom web checkbox/toggle, prefer replacing it with `t-switch` to avoid WXSS selector-compatibility issues from handcrafted peer-state CSS.

