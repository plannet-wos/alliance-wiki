# Alliance Wiki

A wiki app for **Whiteout Survival** alliances — browseable articles with a rich-text editor (Tiptap), backed by Firebase Firestore. Articles support text, formatting, and Cloudinary-uploaded images.

Live: **https://alliance-wiki.web.app**
Part of the [plannet-wos](https://github.com/plannet-wos) suite.

## Setup

```bash
npm install
npm start
```

Then open `http://localhost:4201/`. To run multiple apps side-by-side, override the port with `npm start -- --port 4XXX`.

## Firebase / Cloudinary config

The Firebase web API key and Cloudinary `cloudName`/`uploadPreset` in `src/environments/environment.ts` are intentionally checked in. Firebase web API keys are [designed to be public](https://firebase.google.com/docs/projects/api-keys) — security is enforced by Firestore/Auth rules, not the key. Cloudinary unsigned upload presets are similarly client-safe.

## Contributing

Fork the repo, create a branch, open a PR. No write access needed.

<details>
<summary>Angular CLI commands</summary>

```bash
ng generate component component-name   # scaffold a component
ng build                                # production build into dist/
ng test                                 # run Vitest unit tests
```

For more, see the [Angular CLI reference](https://angular.dev/tools/cli).

</details>
