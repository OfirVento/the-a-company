# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Live Avatar Lab (HeyGen LiveAvatar)

Real-time voice + text chat with a HeyGen LiveAvatar, built on
[`@heygen/liveavatar-web-sdk`](https://www.npmjs.com/package/@heygen/liveavatar-web-sdk)
and the [LiveAvatar API](https://docs.liveavatar.com/).

### Setup

1. Get your API key from [app.liveavatar.com/developers](https://app.liveavatar.com/developers).
2. Copy `.env.example` to `.env` and set `LIVEAVATAR_API_KEY`.
3. `npm install && npm run dev`, then open the app and click **Live Avatar Lab**
   (or go straight to `/#avatar-lab`).

### How it works

- `vite.config.ts` runs a tiny dev-server proxy (`/api/liveavatar/*`) that calls
  `api.liveavatar.com` with your API key server-side — the key never reaches the browser.
- The browser exchanges that for a short-lived session token
  (`POST /v1/sessions/token`, FULL mode: HeyGen hosts the LLM + voice), then the
  web SDK opens a WebRTC (LiveKit) connection to stream the avatar.
- You can talk with the mic (toggle it on in the session controls), or type —
  both sides of the conversation are transcribed live into the chat panel.
- Pick any of your custom avatars or a public gallery avatar on the start screen.

Note: FULL-mode sessions consume LiveAvatar credits per minute — end sessions
with the hang-up button when you're done testing.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
