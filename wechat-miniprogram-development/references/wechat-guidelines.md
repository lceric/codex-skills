# WeChat Mini Program Guidelines (Quick)

## Scope

Use this reference when implementing or refactoring pages/components in 微信小程序 projects.

## Quick Checks

- Confirm page/component registration in `index.json`.
- Prefer component extraction for repeated or complex view blocks.
- Keep event payloads small and explicit via `event.detail`.
- Keep page-level `setData` focused on source-of-truth state.
- Keep styles colocated with component when styles are component-specific.
- If popup branch markup becomes large, extract branch content into an independent component.
- Verify every TDesign icon name against local `node_modules/tdesign-miniprogram/miniprogram_dist/icon/icon.wxss` before merge.

## Event/Data Patterns

- From component to page:
  - Component: `this.triggerEvent('change', { value })`
  - Page: `onChange(e) { const { value } = e.detail; ... }`
- Prefer immutable array updates:
  - `list.map((item, i) => (i === target ? { ...item, checked: true } : item))`

## Component Extraction Template

1. Create `src/components/<Name>/index.wxml`
2. Create `src/components/<Name>/index.js`
3. Create `src/components/<Name>/index.json`
4. Create `src/components/<Name>/index.scss`
5. Register in parent page `index.json`
6. Replace original WXML block with component usage
7. Rewire page handlers to read `event.detail`

## Popup Branch Extraction

- Keep popup state/type in page `data` (for example `currentRemindType`).
- Move each complex popup branch into `src/components/<Name>/index.wxml`.
- Pass one object payload property from page to component (for example `risk-data="{{riskPopup}}"`).
- Register component in parent page `index.json`, and register component-level TDesign dependencies in component `index.json`.
- Keep page focused on orchestration and leave branch rendering to the component.
- Add or adjust mock entry points when needed so every branch can be opened and checked in runtime.
## Performance Notes

- Avoid oversized `setData` payloads in hot paths.
- Keep lists keyed (`wx:key`) with stable ids when possible.
- Reduce deeply nested conditional rendering in one template by extracting components.

## PR/Review Notes

When summarizing work, include:

- component boundaries,
- event contract changes,
- removed dead code,
- unverified runtime behaviors if tests were not run.
