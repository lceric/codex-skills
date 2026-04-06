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
- Read [page-pr-checklist.md](references/page-pr-checklist.md) before finishing page-level PRs to avoid route/loop/template regressions.

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

## 10) Popup Scroll Ownership (Important)

When popup content is long in WeChat Mini Program, keep one and only one vertical scroll owner.

- For `t-popup` content that can exceed viewport height, assign exactly one scroll container.
- Preferred page-level pattern:
  - wrap popup content with `<scroll-view type="list" scroll-y style="height: 80vh">...</scroll-view>`.
- If page-level wrapper is the scroll owner, remove component-internal scroll constraints:
  - remove nested `<scroll-view>` in the child component,
  - remove `max-height` / `overflow-y` on the component root when they duplicate scrolling.
- Avoid mixed nested scroll systems (`scroll-view` + CSS `overflow-y`) for the same axis; this commonly causes no-scroll or gesture conflicts.
- Keep the same popup family on one scroll pattern so behavior is predictable across branches.
- If a fixed header is required inside popup, split structure into `header` + `scroll body` instead of making the entire popup node scroll.

Quick debug checklist when popup cannot scroll:

- Confirm content actually overflows target height (`70vh`/`80vh`).
- Check there is no competing parent/child vertical scroll container.
- Check whether `prevent-scroll-through` is enabled and whether internal scroll owner still receives gestures.
- Reproduce on device and DevTools; nested scroll conflicts are often device-sensitive.

## 11) Component-Local Popup Pattern

For detail popups launched from reusable components (for example a person card "AI insight" entry):

- Keep responsibilities clear:
  - component owns popup visibility and close/open methods,
  - page remains orchestration only for cross-component concerns.
- Use explicit event hooks for observability without coupling:
  - component may `triggerEvent('insightopen')` and `triggerEvent('insightclose')`,
  - page can listen when needed, but should not be forced to mirror popup UI state.
- Normalize PRD rich text to typed data:
  - use arrays like `analysisList -> [{ id, dotColor, parts: [{ text, tone }] }]`,
  - render with `wx:for` and class variants instead of hardcoded repeated blocks.
- Keep one vertical scroll owner in popup content:
  - recommended: popup root with fixed header + one content `scroll-view`,
  - avoid mixed `sticky + nested scroll-view + overflow-y` combinations.
- Verification checklist for this pattern:
  - `t-popup` is registered in component `usingComponents`,
  - popup opens from `bindtap` on trigger row and can close by overlay/button,
  - no raw web tags (`<div>`, `<svg>`) remain in converted WXML branch.

## 12) Page Entry Navigation Checklist

For “click card -> open new page” requirements, enforce this three-point check together:

- WXML entry node has `bindtap` and a clear handler name.
- Page JS implements the handler with `wx.navigateTo({ url })`.
- Target page path is registered in `src/app.json` `pages` (for non-tab pages).

If any one is missing, navigation will silently fail or report route-not-found.

## 13) Nested `wx:for` Safety

When templates contain nested loops:

- Always define `wx:for-item` for the inner loop (for example `nutrient`) and avoid alias reuse with outer loop items.
- Keep display classes split by semantic target (`tag`, `icon`, `value`), rather than reusing one mixed class string.
- Prefer putting loop config in page `data` arrays to keep template logic thin and maintainable.

## 14) Period Switch Split-Render Pattern

For requirements like "keep `day` old layout, migrate only `week/month/year` to new PRD layout":

- Use page-level conditional rendering:
  - `wx:if="{{ activePeriod === 'day' }}"` for legacy day block,
  - `wx:else` (or explicit branches) for the new report component.
- Keep page as orchestration layer:
  - `updatePeriodContent(period)` decides branch and calls `setData`,
  - component only renders incoming `reportData`.
- Maintain separate sources of truth to avoid coupling:
  - `sections` for day list cards,
  - `reportDataMap` (plus optional normalize/decorate step) for period reports.
- Keep `usingComponents` complete after refactor:
  - include both legacy dependencies (`remind-card`, `t-icon`) and new component registration.
- Preserve backwards-compatible styles for legacy branch and avoid leaking overrides into new component styles.
- Quick verification checklist:
  - each tab renders expected structure,
  - switch state does not retain stale data from previous branch,
  - no removed handler/component is still referenced in WXML.

## 15) Tailwind Extraction Safety (Important)

When a project uses Tailwind-like utilities in Mini Program:

- Keep key utility classes literal in `wxml` whenever possible; avoid hiding core layout/visual classes inside JS-only strings.
- Assume dynamic class strings in `data` (`item.className`) may be dropped by extraction in some pipelines; if used, verify generated CSS explicitly.
- Prefer simple, deterministic rendering for repeated blocks:
  - keep structure in `wx:for`,
  - keep critical classes static in template nodes,
  - move unstable variants to `scss` fallback classes when necessary.
- For unsupported or weakly-supported web behaviors (hover groups, advanced filters, list marker semantics on `view`), implement Mini Program-native fallback instead of forcing parity.
- Add a quick production-artifact check before finishing:
  - search `dist/app.wxss` for several must-have classes from the touched page,
  - if missing, rewrite to static classes or add scoped `scss` equivalents.
