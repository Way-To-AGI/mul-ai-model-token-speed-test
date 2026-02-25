# AGENTS.md

## Cursor Cloud specific instructions

This is a pure client-side React + Vite SPA (no backend, no database, no Docker). All AI API calls are made directly from the browser using the `openai` npm package with `dangerouslyAllowBrowser: true`.

### Quick Reference

- **Package manager**: Yarn (v1, classic) — lockfile is `yarn.lock`
- **Dev server**: `yarn dev` (Vite, default port 5173)
- **Lint**: `yarn lint` (ESLint flat config; note: pre-existing unused-import warning on `Divider` in `src/App.jsx`)
- **Build**: `yarn build` (Vite production build to `dist/`)
- **Preview**: `yarn preview` (serves the production build)

### Caveats

- The app requires real AI provider API keys (OpenAI-compatible) to test actual streaming responses. Without valid keys, the "开始测试" button will trigger requests that return errors — this is expected behavior, not a bug.
- All state is stored in `localStorage` under the key `deepseek-models`.
- There are no automated tests (no test framework configured). Validation is done via manual UI interaction.
