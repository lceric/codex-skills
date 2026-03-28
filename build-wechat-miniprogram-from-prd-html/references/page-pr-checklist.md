# Mini Program Page PR Checklist

Use this checklist for page-level changes (new page, page refactor, entry navigation, PRD conversion).

## 1) Route and Entry Wiring

- [ ] `app.json` includes the new non-tab page path in `pages`.
- [ ] Entry node in WXML has `bindtap` with a clear handler name.
- [ ] Page JS handler exists and calls `wx.navigateTo({ url })` with the exact path.
- [ ] Target page exists with the full file set (`index.wxml/js/json` and style file).

## 2) Template Validity

- [ ] No raw web tags remain in final WXML (`<div>`, `<span>`, `<svg>`, `<h*>`, `<img>`).
- [ ] No web-only attrs remain (`onclick`, `onchange`, `className`, React/Vue syntax).
- [ ] TDesign components used in WXML are registered in page/component `usingComponents`.
- [ ] Long repeated blocks are converted to `data + wx:for`, not manually duplicated.

## 3) Nested Loop Safety

- [ ] Inner loops define explicit aliases (for example `wx:for-item="nutrient"`).
- [ ] No alias shadowing between outer/inner loops (`item` reused accidentally).
- [ ] `wx:key` is stable and meaningful (`id`/`name` preferred over fragile index when possible).

## 4) Data and Style Contracts

- [ ] Page data owns display config and content; template stays thin.
- [ ] Dynamic style fields are separated by semantics (for example tag/icon/value class fields).
- [ ] Reused blocks use a consistent object schema to reduce template branching.
- [ ] Tailwind utility classes are kept when compatible with project conventions.

## 5) Interaction and Event Flow

- [ ] User action path is complete: interaction -> handler -> `setData`/navigation.
- [ ] Component events (if any) use stable `event.detail` contracts.
- [ ] No dead handlers remain after refactor/extraction.

## 6) Verification Pass

- [ ] Run quick raw-tag scan on touched WXML.
- [ ] Open affected files again after scripted edits to catch syntax/format corruption.
- [ ] Build/dev check was attempted, or blocker is explicitly recorded in PR notes.
- [ ] Mention known gaps clearly (for example environment/config issue unrelated to this PR).
