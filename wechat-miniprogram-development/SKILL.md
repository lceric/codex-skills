---
name: wechat-miniprogram-development
description: Implement, refactor, and troubleshoot WeChat Mini Program features using native project conventions (pages/components/wxml/wxss/js/json), event/data binding, and common ecosystem practices (e.g., TDesign, request封装, 分包与性能优化). Use this skill whenever the user asks to build pages/components, convert web snippets to 小程序, fix rendering or interaction bugs, optimize data flow, or align code with 微信小程序开发规范.
---

# WeChat Mini Program Development

## Goal

Build maintainable WeChat Mini Program features quickly while preserving the project's existing architecture and coding style.

## Workflow

1. Confirm project conventions before coding.
2. Implement with native Mini Program patterns first.
3. Verify data/event flow end-to-end.
4. Keep changes small, composable, and easy to review.

## 1) Read Context First

- Inspect related files in this order:
  `page/index.json` -> `page/index.wxml` -> `page/index.js` -> `page/index.scss|wxss`.
- Check shared utilities and component dependencies before adding new logic:
  `src/utils/*`, `src/components/*`, `app.json`, page `usingComponents`.
- Reuse existing naming and folder patterns; avoid introducing a parallel style.

## 2) Preferred Implementation Rules

- Prefer extracting reusable UI into components when a block has clear boundaries.
- Keep page as orchestration layer:
  - page owns data source/state transitions,
  - component owns local rendering and emits events.
- Use explicit custom events and stable payloads:
  - `this.triggerEvent('event-name', { ...detail })`
  - page reads from `event.detail`, not `event.currentTarget.dataset` for child events.
- When handling toggle/select lists, update with immutable map operations to avoid index/state drift.

## 3) WXML / WXSS Guidance

- Avoid web-only patterns that don't map cleanly to Mini Program runtime.
- Keep template readable:
  - extract heavy conditional branches into components,
  - avoid oversized inline logic in a single page template.
- Keep class naming consistent with project conventions.
- If the project uses utility classes (e.g., Tailwind-like), continue using them consistently.

## 4) Page/Component Contracts

When creating a component, always define:

- `properties`: typed inputs with safe defaults.
- `methods`: user actions and event emitters.
- `index.json` `usingComponents`: only required dependencies.
- local styles in component `index.scss|wxss`.

Recommended event contract:

- `permissiontap` -> `{ index }`
- `permissionchange` -> `{ index, value }`
- action events like `accept` / `reject` with no extra payload when unnecessary.

## 5) Common Tasks Checklist

### Extract block into component

- Move WXML block to `src/components/<Name>/index.wxml`.
- Move block-specific styles to component stylesheet.
- Create component `index.js` with properties + triggerEvent methods.
- Register component in page `index.json`.
- Replace original block with component tag and bind events.
- Update page handlers to consume `event.detail`.

### Convert web snippet to Mini Program

- Replace DOM/web attributes with WXML-compatible equivalents.
- Replace unsupported interactions with `bindtap`, `catchtap`, and component events.
- Keep semantics and visual hierarchy, then adapt syntax.

### Debug interaction/data issues

- Validate source of truth in page `data`.
- Check whether change path is:
  user interaction -> component method -> triggerEvent -> page handler -> `setData`.
- Check `data-*` / `event.detail` mismatch first; this is a common break point.

## 5.1) PRD HTML Popup Refactor Pattern

- For multi-branch popup content (`wx:if` / `wx:elif` / `wx:else`), extract each heavy branch into an isolated component instead of keeping one giant page template.
- Keep page as orchestration layer:
  - page maintains branch type and popup payload object (for example `riskPopup`),
  - component receives one typed object property (for example `riskData`) and only renders.
- Convert copied web markup aggressively:
  - replace `div/span/h*` with `view/text`,
  - replace `img` with `image` or `t-image`,
  - replace inline `svg` with `t-icon`.
- Validate icon names before finalizing:
  - check `node_modules/tdesign-miniprogram/miniprogram_dist/icon/icon.wxss`.
- If a branch lacks a trigger in current data, add a temporary/mock entry (for example `type: 'risk'`) so the branch can be verified end-to-end.
## 6) Quality Bar

Before finishing, verify:

- Component/page responsibilities are clear.
- `usingComponents` is complete and minimal.
- No dead handlers remain after extraction.
- Data updates still drive expected UI states.
- No raw HTML tags (`<div>`, `<svg>`, `<img>`) remain in final WXML.
- Files stay ASCII unless existing file already uses non-ASCII intentionally.

## 7) Output Style

When delivering changes:

- Start with what was built/refactored.
- List touched files.
- Call out event/data contract changes explicitly.
- Mention any verification gaps (if runtime not executed).

## References

- Read [wechat-guidelines.md](references/wechat-guidelines.md) for a compact implementation checklist and reusable prompts.

## 8) Popup Branch Refactor Lessons

When converting or adding reminder popup branches (for example `risk` / `exercise` / `sleep`), follow this pattern to avoid regressions:

- Keep page as orchestration only:
  - page decides branch type (`currentRemindType`) and owns popup data objects (`riskPopup`, `exercisePopup`, `sleepPopup`),
  - branch component receives one object prop and renders only.
- Never keep raw web HTML in page popup branches:
  - remove `<div>`, `<span>`, `<h*>`, `<svg>` from WXML branch blocks,
  - replace with component tags + `t-icon`.
- Add branch support as a complete set, not partially:
  - add component files,
  - register in page `usingComponents`,
  - add page data object,
  - wire branch rendering in popup `wx:elif`.
- Validate icon names from local `tdesign-miniprogram` icon definitions before finalizing.
- After edits, run a quick raw-tag scan on touched WXML:
  - check for `<div|<svg|<span|<h` and clean remaining web-only tags.
- Keep a safe fallback branch (`wx:else`) in popup when product allows it, so unknown types do not render blank content.

## 9) Editing Reliability Notes

When patching JSON/JS/WXML in bulk:

- Prefer structural edits over brittle string replacement that can inject literal escape artifacts (for example accidental `` `n `` in JSON).
- Re-open modified files immediately and verify syntax/format after scripted replacements.
- If a scripted replacement corrupts formatting, rewrite the full file content once to restore canonical structure.
