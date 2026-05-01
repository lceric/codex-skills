---
name: gpt-image
description: Generate images using gpt-image-2 API. Use this skill when the user asks to generate, create, or draw an image. Triggers on prompts like "generate an image of...", "create a picture showing...", "draw...", "设计一个...图片", "生成...图", or any request to produce visual content. Also use for generating reference sheets, concept art, UI mockups, character designs, and layered component breakdowns for animation (Spine2D, Live2D, etc.).
---

# GPT Image Generator

Generate images using the gpt-image-2 model via API.

## Setup

The skill reads these environment variables:
- `IMAGE_BASE_URL` — API base URL (e.g., `https://api.openai.com/v1`)
- `IMAGE_API_KEY` — API key for authentication

These are typically stored in `.claude/settings.local.json` under the `env` key, or in a `.env` file in the project root.

## Quick Start

```bash
python scripts/generate_image.py "a cute chibi cat in kawaii style" "output.png"
```

Optional parameters (positional):
```bash
python scripts/generate_image.py "<prompt>" "<output_path>" "<size>" "<quality>" "<response_format>"
```

| Parameter | Default | Options |
|-----------|---------|---------|
| size | `1024x1024` | `1536x1024`, `1024x1536` |
| quality | `standard` | `hd` |
| response_format | `b64_json` | `url` |

## Prompt Engineering

### What works well with gpt-image-2

gpt-image-2 responds best to **descriptive, structured prompts**. Think of it as briefing a concept artist — be specific about composition, style, colors, and constraints.

**Effective prompt structure:**
1. **Subject**: What to draw (the main focus)
2. **Style**: Art style, technique, mood (e.g., "2D flat vector", "watercolor", "chibi anime")
3. **Composition**: Layout, positioning, framing
4. **Colors**: Palette direction (e.g., "pastel macaron", "warm earth tones", "monochrome blue")
5. **Quality constraints**: What to include and exclude
6. **Negative prompts**: What NOT to render

### Pattern for complex compositing

When generating reference sheets, character breakdowns, or UI layouts with multiple panels:

**DO:**
- Describe the overall canvas layout first, then each panel in order
- Use clear delimiters between panels (LEFT PANEL, RIGHT PANEL, etc.)
- Specify spatial relationships explicitly ("left side shows...", "right side shows...")
- State the constraint that parts must match ("all parts extracted from the same character")
- List each component individually with labels

**DON'T:**
- Mix panel descriptions together
- Rely on the model to infer spatial layout from a wall of text
- Forget to mention the constraint that separated parts must be from the same source

### Balancing detail vs. flexibility

- **Too little detail** → generic output that misses structural requirements
- **Too much detail** → the model may struggle to satisfy every constraint simultaneously
- **Sweet spot**: Be exhaustive on structural/layout constraints (mandatory), flexible on decorative details (optional). For example, insist on "head must be complete contour without eyes or mouth" but let the model choose exact ear shape.

### Negative prompts

Always include a NEGATIVE section at the end listing what to avoid. gpt-image-2 respects negative constraints better than positive micro-details:
```
NEGATIVE: realistic 3D rendering, complex background, strong shadows,
perspective distortion, noise, texture, photorealistic
```

## Parameters

### size
- `1024x1024` — Square (default). Best for reference sheets and most use cases.
- `1536x1024` — Landscape. Good for wide scenes, multi-panel horizontal layouts.
- `1024x1536` — Portrait. Good for tall compositions, full-body characters.
- `1792x1024` / `1024x1792` — Wide/tall HD variants (may not be available on all providers).

### quality
- `standard` — Default. Faster and cheaper, sufficient for most generation.
- `hd` — Higher detail. Use when fine details matter (small text labels, intricate patterns). Costs more and takes longer.

### response_format
- `b64_json` — Default. Image data returned directly in the API response. No extra download step needed.
- `url` — Returns a hosted URL. Only use this if the API provider requires it.

### timeout
The script has a default 180s timeout with automatic retry on transient failures:
- 3 retries with exponential backoff (2s → 4s → 8s)
- Timeouts automatically increase by 60s per retry (up to 300s)
- Server errors (5xx) and rate limits (429) are retried
- Authentication errors (401/403) and bad requests (400) fail immediately

## Troubleshooting

### Timeout errors
```
ERROR: Request timed out after 180s
```
**Causes:**
- Prompt is very long (>2000 chars) — the model takes longer to process
- Server is under heavy load
- HD quality on a complex prompt

**Fixes:**
- The script automatically retries with increased timeout — wait for it
- If it still fails, condense the prompt (remove redundant phrasing, merge bullet points)
- Use `standard` quality instead of `hd`
- Split into multiple simpler generations

### Content filter rejection (400 error)
```
ERROR: Bad request (400): The prompt may have been rejected by content filters
```
**Fix:** Remove potentially flagged words, rephrase descriptions involving violence/horror/nsfw, even in a stylized context.

### Authentication errors (401/403)
```
ERROR: Authentication failed (401)
```
**Fix:** Verify `IMAGE_API_KEY` in `.claude/settings.local.json` is valid and not expired.

### Rate limiting (429)
```
ERROR: Rate limited (429)
```
**Fix:** The script auto-retries. If persistent, wait a minute between generations.

## Workflow

When the user asks to generate an image:

1. **Parse the request** — extract the visual description, intended use, and any constraints the user specified (layout, style, components)
2. **Translate to prompt** — convert user intent into structured English with composition, style, subject, constraints, and negatives. For Chinese-speaking users, translate their requirements into an English prompt (gpt-image-2 works best with English prompts)
3. **Choose parameters** — default to `1024x1024` standard quality unless the user requests otherwise
4. **Run the script** — `python scripts/generate_image.py "<prompt>" "<filename.png>"`
5. **Report results** — tell the user the file path and key characteristics (size, resolution). If the user opens reference sheets: remind them to verify layer separation quality

## Examples

### Simple generation
```
User: "generate an image of a sunset over mountains"
→ python scripts/generate_image.py "A serene landscape at sunset, mountains silhouette
against orange and pink sky, minimalist flat vector style, clean composition"
→ Saves to sunset_over_mountains.png
```

### Character design reference (Spine2D/Live2D)
```
User: "Q版小猫Spine2D分层参考图，左右分栏，左侧完整角色，右侧拆分部件"
→ Construct a prompt with:
  - LEFT PANEL: Complete chibi cat, front-facing, kawaii style
  - RIGHT PANEL: Grid of 15 separated parts (head, body, arms, legs, tail,
    ears, eyes, eyebrows, nose, mouth) each in dashed-border cards
  - Critical constraints: head contains ZERO facial features, body contains
    NO limbs, all parts from same source character
  - NEGATIVE: realistic, 3D, parts stuck together, head containing facial features
→ python scripts/generate_image.py "<prompt>" "spine2d_cat_reference.png"
```

### UI mockup / design spec
```
User: "设计一个手机APP首页的UI设计稿"
→ Construct a prompt with:
  - Composition: Phone frame centered, clean light background
  - Components: Navigation bar, hero section, card grid, bottom tab bar
  - Style: Mobile UI design, flat design, specific color scheme
  - Quality: Clean edges, readable labels, consistent spacing
→ python scripts/generate_image.py "<prompt>" "app_homepage_mockup.png" "1024x1536"
```

## Tips

- **English prompts work best** — if the user provides Chinese requirements, translate to English rather than passing Chinese directly
- **Structure over prose** — use labeled sections (LEFT/RIGHT, DO/DON'T) rather than paragraph-style descriptions for complex layouts
- **Negative constraints at the end** — put all "do not include" items in a NEGATIVE section after the main prompt
- **One complex thing at a time** — if you need perfect character + perfect layout + perfect labels, consider whether two simpler generations would work better
- **Verify after generation** — for Spine2D sheets, check that separated parts match the complete character and that no parts are stuck together
