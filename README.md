# MomenTap Support

Public support and privacy pages for MomenTap (repository name retained from its development name, IntentionalUse).

## IANJI website on Cloudflare Pages

The company website at https://ianji.net/ has Korean, English, and Japanese versions. Each language has a company page, a MomenTap product page, a support page, and a privacy page. In the Cloudflare build, the language control next to the brand opens a native HTML dialog with a searchable, scrollable list of languages. Selecting a language opens the equivalent page. The close button, Escape key, or a click outside the dialog closes it and returns focus to the trigger. A basic HTML `details/summary` list remains available until the site's own JavaScript has initialized, including when the script cannot load. The existing `/privacy/` page also retains its English text for compatibility.

| Language | Company | Product | Support | Privacy |
| --- | --- | --- | --- | --- |
| Korean | `/` | `/products/momentap/` | `/support/` | `/privacy/` |
| English | `/en/` | `/en/products/momentap/` | `/en/support/` | `/en/privacy/` |
| Japanese | `/ja/` | `/ja/products/momentap/` | `/ja/support/` | `/ja/privacy/` |

Run `node scripts/build-cloudflare.mjs` to generate `dist/`. The original Korean/English GitHub Pages HTML files remain the source for existing content. `scripts/localize-cloudflare.mjs` applies reviewed English edits from `cloudflare/english-copy.json`, incorporates the translated pages in `cloudflare/`, and generates equivalent-page language links, canonical URLs, and the sitemap. English replacements deliberately fail when their source text no longer matches, so later changes receive another translation review. When privacy processing changes, update the Korean source and all translated provisions together.

The build uses Node.js built-ins only. The language selector uses one small, external JavaScript file served by this site. The build computes its SHA-256 hash for both Subresource Integrity (SRI) and the Content Security Policy (CSP), allowing that script without broadly allowing same-origin scripts or inline code. Language searches only filter the list in the browser; search text is not stored or transmitted. Selecting a language makes a normal request for the corresponding page. The script does not use cookies or browser storage. No remote fonts, analytics, tracking, information-submission forms, or new services are added. Deploy only `dist/`; do not deploy local verification evidence or private account files. Deployment configuration is described in [CLOUDFLARE_PAGES.md](CLOUDFLARE_PAGES.md).

## Existing GitHub Pages URLs

- Support: https://leauchoux.github.io/intentionaluse-support/
- Privacy policy: https://leauchoux.github.io/intentionaluse-support/privacy.html
- Public support issues: https://github.com/leauchoux/intentionaluse-support/issues
- IANJI business website (Korean): https://leauchoux.github.io/intentionaluse-support/organization/
- IANJI business website (English): https://leauchoux.github.io/intentionaluse-support/organization/en/

This repository contains public documentation only. It does not contain the application source code, Screen Time tokens, user data, analytics, or tracking scripts.

The original GitHub Pages business pages identify IANJI (이안지), its mobile software work, MomenTap, and its published business contact details. Those original pages remain static HTML and CSS, with no forms, client-side scripts, cookies, or third-party assets. The Cloudflare build adds the language selector described above without changing these originals. Product status remains in development and testing.

GitHub Pages serves the repository root. Existing support and privacy URLs remain unchanged. The organization pages use relative asset and navigation paths so they also work beneath the repository path. The canonical and language-alternate URLs should be updated if a custom domain is connected later.

For Apple membership updates, website publication alone does not establish eligibility as an organization. Apple separately verifies legal entity status, D-U-N-S information, and organization-associated website and work email requirements. A GitHub Pages subdomain and a Gmail address should not be presented as already accepted by Apple.

## App icon source

The organization pages use `organization/assets/momentap-11fc3604.png`, exported from the app's active `IntentionalUse/Resources/IntentionalUse_260817.icon` document with Icon Composer's `ictool`: iOS, Default rendition, design generation 26, 512 × 512, scale 1. The filename includes the PNG's SHA-256 prefix to avoid stale image caches. The export already includes the platform corner shape, so CSS does not add another mask. Both app build configurations select `IntentionalUse_260817`; the old `AppIcon.appiconset/AppIcon-1024.png` is a retained legacy asset and must not be used for this page.
