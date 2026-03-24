# Codex Skills 仓库

这个仓库用于存放可被 Codex 自动触发和调用的本地技能（skills）。

## 安装位置

请将本仓库放在本机的 `.codex/skills` 目录下。

- Windows 示例：`C:\Users\<你的用户名>\.codex\skills`
- macOS / Linux 示例：`~/.codex/skills`

如果你是通过 Git 管理，推荐在 `.codex` 目录内直接克隆：

```bash
git clone <your-repo-url> ~/.codex/skills
```

## 当前技能

### 1) build-wechat-miniprogram-from-prd-html

用途：
- 将 PRD HTML、静态网页稿、原型标注转换为微信小程序原生代码
- 输出/改造为 `wxml`、`js`、`json`、`scss`
- 优先适配现有项目约定，并优先使用 `tdesign-miniprogram` 组件与图标

适用场景：
- “把这份 PRD 页面做成小程序页面”
- “把这段 HTML 改成微信小程序可运行代码”

### 2) git-smart-commit

用途：
- 基于当前变更自动生成 Conventional Commits 风格提交信息
- 支持按需自动暂存并提交
- 约束提交类型（`feat`/`fix`/`docs` 等）和格式一致性

适用场景：
- “帮我提交代码”
- “按规范生成 commit message”

### 3) skill-creator

用途：
- 创建新技能、优化已有技能、补充评测与迭代流程
- 支持技能描述优化、验证脚本与评测报告相关工作流

适用场景：
- “帮我做一个新 skill”
- “优化这个 skill 的触发描述和效果”

## 目录结构（简版）

```text
skills/
├─ build-wechat-miniprogram-from-prd-html/
├─ git-smart-commit/
├─ skill-creator/
└─ .system/
```

## 使用建议

- 技能说明文件统一在各目录的 `SKILL.md`
- 触发效果依赖 `SKILL.md` 的 `description`（何时触发 + 做什么）
- 迭代技能时，建议同时更新示例、脚本和说明文档，保证可维护性

