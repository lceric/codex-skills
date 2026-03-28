# Project Conventions

Use this reference when the target project matches the current health-front style or uses a similar stack.

## Stack Summary

- `weapp-vite` drives page and component builds.
- `weapp-tailwindcss` is available and should be preserved in markup when the utility classes already express the desired result.
- `tdesign-miniprogram` is the main UI component library.
- Pages commonly use `*.wxml`, `*.js`, `*.json`, and `*.scss`.

## Implementation Rules

- Inspect the target page's sibling files before editing.
- Register every TDesign component explicitly in the page or component `*.json` under `usingComponents`.
- Keep page data and interaction handlers in `*.js`.
- Keep compatible Tailwind utility classes in `*.wxml` instead of moving them into `*.scss` by default.
- For check/toggle interactions, use `t-switch` (or `t-checkbox`/`t-radio-group` as needed) rather than custom peer-selector switches.
- Keep local visual overrides in `*.scss` only for cases the utility layer does not cover cleanly.
- Reuse patterns already present in nearby pages when possible.

## Useful Example Paths

- Page-level TDesign composition: `src/pages/mine/index.wxml`
- Tabs and richer page composition: `src/pages/home/index.wxml`
- Form-heavy editing page: `src/pages/mine/info-edit/index.wxml`
- Typical page component registration: `src/pages/mine/index.json`
- Typical component registration: `src/components/PersonCard/index.json`

## Existing TDesign Usage In This Project

- Profile rows and settings: `t-cell-group`, `t-cell`
- Avatars and lightweight status tags: `t-avatar`, `t-tag`
- Shortcut areas: `t-grid`, `t-grid-item`
- Navigation: `t-navbar`
- Feedback: `t-toast`, `t-message`, `t-dialog`, `t-loading`
- Forms: `t-input`, `t-textarea`, `t-radio-group`, `t-picker`, `t-upload`
- Binary toggles: `t-switch`
- Icons: `t-icon`

## Search Patterns

Use these searches to find implementation references quickly:

- `rg -n "usingComponents" src/pages src/components`
- `rg -n "<t-" src/pages src/components`
- `rg -n "tdesign-miniprogram" src`
- `rg -n "t-icon|t-cell|t-grid|t-button|t-input" src`

## Common Output Checklist

1. Update `*.wxml` to use mini-program-native nodes and TDesign components.
2. Update `*.json` with every new `usingComponents` entry.
3. Update `*.js` with data, derived labels, and handler stubs.
4. Preserve useful Tailwind classes in `*.wxml`; update `*.scss` only for necessary local styling.
5. Remove any remaining web-only syntax before finishing.

