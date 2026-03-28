---
name: build-wechat-miniprogram-from-prd-html
description: Convert PRD HTML, static web mockups, or prototype markup into production-ready WeChat Mini Program pages and components. Use when Codex needs to translate HTML/CSS/SVG ideas into mini-program-native `wxml` / `js` / `json` / `scss`, rebuild a page inside an existing 微信小程序 project, replace unsupported web syntax with compatible structures, preserve the source TailwindCSS class style where compatible, or implement UI while prioritizing the current project's `tdesign-miniprogram` components and icons.
---

# Build Wechat Miniprogram From Prd Html

Build WeChat Mini Program pages from PRD HTML or static web mockups without carrying over unsupported web syntax. Prefer the existing project's patterns first, keep compatible TailwindCSS utility classes in place, then prefer `tdesign-miniprogram` components and icons before custom markup.

## Workflow

1. Read the source artifact carefully.
   - Extract page sections, states, data fields, interactions, and repeated blocks.
   - Decide whether the request is a full page, a component slice, or a targeted edit.

2. Inspect the target project before writing code.
   - Find similar pages or components with `rg -n "usingComponents|<t-|tdesign-miniprogram" src`.
   - Confirm page file structure, style file type, naming, and event-binding conventions.
   - Read [references/project-conventions.md](references/project-conventions.md) when working in an existing project.

3. Plan the conversion in mini-program terms.
   - Re-map web DOM into `view`, `text`, `image`, `block`, `scroll-view`, and TDesign components.
   - Replace inline SVG or icon fonts with `t-icon` first.
   - For check/toggle interactions (permission switch, enable/disable state), prefer `t-switch` first, then `t-checkbox` or `t-radio-group` when semantics require it. Avoid handcrafted Tailwind peer-selector toggles.
   - Keep the original TailwindCSS utility class intent whenever the class is compatible with the project's mini-program Tailwind setup.
   - Decide which data should live in `*.js`, which components must be registered in `*.json`, and which layout rules belong in `*.scss` only when utility classes are insufficient or awkward.
   - Read [references/html-to-miniprogram.md](references/html-to-miniprogram.md) for tag mapping and component selection.

4. Implement the result as mini-program files.
   - Write `*.wxml` with mini-program syntax only.
   - Update `*.json` to register every `tdesign-miniprogram` component used.
   - Add or update `*.js` data, lifecycle hooks, and handler stubs needed by the page.
   - Preserve TailwindCSS utility classes in `*.wxml` whenever they already express the desired layout and visual style clearly.
   - Add or update `*.scss` only for layout, spacing, typography, and local overrides that are not cleanly expressed with existing utility classes.

5. Review the result against the source PRD.
   - Keep visual hierarchy and interaction intent, but simplify brittle web-only structure when needed.
   - Remove raw HTML tags, DOM-only events, React/Vue syntax, and unsupported inline SVG.
   - Check `wx:if`, `wx:for`, `bindtap`, `slot`, component registration, and placeholder data completeness.

## Output Contract

- Produce native mini-program code, not HTML pasted into WXML.
- Prefer existing project components and composition patterns over inventing a new design language.
- Preserve compatible TailwindCSS class expressions from the source whenever possible instead of rewriting them into custom SCSS.
- Prefer `tdesign-miniprogram` for common UI building blocks such as nav, cells, cards, tabs, buttons, forms, dialogs, tags, loading, and icons.
- Prefer `t-icon` over inline `svg`, iconfont fragments, or raw path markup.
- For check-like UI controls, prefer TDesign controls (`t-switch`, `t-checkbox`, `t-radio-group`) instead of custom `view` + pseudo-element toggles.
- Register components explicitly in the page or component `*.json`.
- Keep units and layout choices aligned with the project; preserve existing utility classes first and default to `rpx` when creating new styles in `*.scss`.
- Keep data-driven or repeated regions in `*.js` + `wx:for` rather than hardcoding every item.

## Conversion Rules

- Convert `div`, `section`, `article`, `header`, `footer`, `main`, and `aside` into `view` unless a better mini-program container exists.
- Convert inline labels into `text` when that improves clarity.
- Convert `img` into `image` or `t-image`.
- Convert `button` into `t-button` when the UI is a standard action.
- Convert check/toggle UI into `t-switch`, `t-checkbox`, or `t-radio-group` first instead of custom peer-based switch markup.
- Keep TailwindCSS utility classes on converted nodes whenever those classes are already supported by the project's mini-program Tailwind pipeline.
- Convert settings, list rows, and profile rows into `t-cell-group` + `t-cell` where appropriate.
- Convert repeated icon badges, metrics, or shortcuts into `t-grid` + `t-grid-item` when that matches the layout.
- Convert tabs, pickers, uploaders, notices, dialogs, and form controls into their TDesign counterparts before writing custom primitives.
- Drop only Tailwind classes that are web-only, unsupported, or made irrelevant by the chosen mini-program component.
- Avoid Tailwind peer variants like `peer-checked:*` and `peer-focus:*` for toggle behavior; these often compile into sibling selectors such as `~`, which can cause WXSS compile incompatibilities.
- Replace `onclick`, `onchange`, `className`, `style={{}}`, `v-if`, `v-for`, `@click`, and JSX fragments with mini-program syntax.

## PRD HTML Interpretation

- Treat the PRD as intent, not as a literal DOM contract.
- Preserve information architecture, module ordering, and key interactions.
- Normalize overly absolute-positioned or decorative web layouts into maintainable mini-program structure when possible.
- If the PRD includes unsupported or ambiguous behavior, implement a sensible mini-program fallback and state that assumption.

## References

- Read [references/html-to-miniprogram.md](references/html-to-miniprogram.md) for element mapping, unsupported-pattern cleanup, and TDesign-first selection rules.
- Read [references/project-conventions.md](references/project-conventions.md) for project-specific implementation conventions and example paths.

