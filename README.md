# EverydayFix

Content site built with Astro, deployed on Cloudflare Pages.

> 🧑‍🚀 **Seasoned astronaut?** The layout sections below are the original
> starter scaffolding; EverydayFix-specific docs are in their own section.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── components
│   ├── layouts
│   ├── lib
│   └── pages
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 📊 Analytics & Cookie Consent

The site includes a GDPR/ePrivacy-safe Google Analytics 4 integration with a
full cookie consent panel (accept / reject / customise).

**How it works**

- **Opt-in by default.** Google Consent Mode v2 is registered with every
  storage type `denied`, and the `gtag.js` script is *not even loaded* until
  the visitor grants analytics consent — no request reaches Google beforehand.
- **Consent panel.** A banner appears on first visit with "Accept all",
  "Reject all" and "Cookie settings". The panel lists strictly necessary
  cookies (always on) and analytics cookies (opt-in). The "Cookie Settings"
  link in the footer reopens the panel at any time to review or withdraw the
  choice; withdrawing deletes the previously set GA cookies.
- **Measurement ID via env var.** Set `PUBLIC_GA4_ID` (see `.env.example`).
  When it is unset, the consent layer still runs but no Google script loads.

**Setup**

1. Create a GA4 property in Google Analytics and copy the Web-stream
   Measurement ID (`G-XXXXXXXXXX`).
2. Locally: create a `.env` file in the project root and set `PUBLIC_GA4_ID=G-...`.
3. On Cloudflare Pages: add `PUBLIC_GA4_ID` to the environment variables of
   your project (Settings → Environment variables) and redeploy. `PUBLIC_`-prefixed
   variables are inlined at build time.

**Events included**

- `outbound_click` — clicks to external sites, `mailto:` and `tel:` links.
- `search_select` — when a visitor opens an article from the search results.
- A global `window.trackEvent(name, params)` helper (safe to call at any time;
  it only sends once consent is granted) for future custom events.