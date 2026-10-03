import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const languages = ['ko', 'en', 'ja'];
const names = { ko: '한국어', en: 'English', ja: '日本語' };
const labels = { ko: '언어 선택', en: 'Language', ja: '言語を選択' };
const families = {
  home: { ko: '/', en: '/en/', ja: '/ja/' },
  product: { ko: '/products/momentap/', en: '/en/products/momentap/', ja: '/ja/products/momentap/' },
  support: { ko: '/support/', en: '/en/support/', ja: '/ja/support/' },
  privacy: { ko: '/privacy/', en: '/en/privacy/', ja: '/ja/privacy/' },
};
const fileFor = route => `${route.slice(1)}index.html`;

function languagePicker(language, routes, { markCurrentPage = true } = {}) {
  return `<details class="language-picker">
    <summary aria-label="${labels[language]}: ${names[language]}"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg><span lang="${language}">${names[language]}</span></summary>
    <ul class="language-options" aria-label="${labels[language]}">${languages.map(code =>
      `<li><a href="${routes[code]}" lang="${code}" hreflang="${code}"${code === language && markCurrentPage ? ' aria-current="page"' : ''}><span>${names[code]}</span>${code === language ? '<span aria-hidden="true">✓</span>' : ''}</a></li>`
    ).join('')}</ul>
  </details>`;
}

function removeLanguageLinks(html) {
  return html.replace(/\s*<a\b[^>]*>\s*(?:한국어|English|日本語)\s*<\/a>/g, '')
    .replace(/\s*<nav\b[^>]*>\s*<\/nav>/g, '');
}

function languageNavigation(html, language, routes, origin) {
  // Every language switch retains the current page, including support/privacy.
  let headerFound = false;
  html = html.replace(/(<header\b[^>]*>)([\s\S]*?)(<\/header>)/, (_, opening, contents, closing) => {
    headerFound = true;
    contents = contents.replace(/\s*<a\b[^>]*class="language"[^>]*>[\s\S]*?<\/a>/g, '');
    if (!contents.includes('</nav>')) throw new Error('Missing header navigation');
    return opening + contents + languagePicker(language, routes) + closing;
  });
  if (!headerFound) throw new Error('Missing page header');
  // One consistent selector replaces legacy footer language lists as well.
  html = html.replace(/(<footer\b[^>]*>)([\s\S]*?)(<\/footer>)/,
    (_, opening, contents, closing) => opening + removeLanguageLinks(contents) + closing);
  html = html.replace(/\s*<link rel="(?:canonical|alternate)"[^>]*>/g, '');
  const links = [`<link rel="canonical" href="${origin}${routes[language]}">`,
    ...languages.map(code => `<link rel="alternate" hreflang="${code}" href="${origin}${routes[code]}">`),
    `<link rel="alternate" hreflang="x-default" href="${origin}${routes.ko}">`,
    '<link rel="stylesheet" href="/assets/languages.css">'];
  return html.replace('</head>', `  ${links.join('\n  ')}\n</head>`);
}

function englishPrivacy(bilingual) {
  const article = bilingual.match(/<article lang="en" class="english-policy">([\s\S]*?)<\/article>/)?.[1];
  if (!article) throw new Error('English privacy source not found');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="MomenTap privacy policy: on-device data, optional history, retention, deletion, and support.">
  <meta name="color-scheme" content="light dark">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'">
  <title>Privacy Policy — MomenTap</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/support.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <a class="brand" href="/en/support/" aria-label="MomenTap support home"><span class="brand-mark" aria-hidden="true">⌛</span><span>MomenTap</span></a>
    <nav aria-label="Main navigation"><a href="/en/">About IANJI</a><a href="/en/products/momentap/">MomenTap</a><a href="/en/support/">Support</a><a aria-current="page" href="/en/privacy/">Privacy policy</a></nav>
  </header>
  <main id="main" class="policy-page"><article>${article}</article></main>
  <footer><p><a href="/en/support/">Support home</a> · <a href="https://github.com/leauchoux/intentionaluse-support/issues">Public support issues</a></p></footer>
</body>
</html>
`;
}

export async function localizeSite({ root, output, origin }) {
  const readOutput = relative => readFile(path.join(output, relative), 'utf8');
  const write = async (relative, html) => {
    const file = path.join(output, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, html);
  };

  // Strict replacements leave the original GitHub Pages sources intact and
  // stop the build if their wording changes without another translation review.
  const corrections = JSON.parse(await readFile(path.join(root, 'cloudflare/english-copy.json'), 'utf8'));
  for (const file of new Set(corrections.map(row => row.file))) {
    let html = await readOutput(file);
    for (const row of corrections.filter(row => row.file === file)) {
      if (!html.includes(row.before)) throw new Error(`Review English copy in ${file}: ${row.before.slice(0, 80)}`);
      html = html.replaceAll(row.before, row.after);
    }
    await write(file, html);
  }

  await write('en/privacy/index.html', englishPrivacy(await readOutput('privacy/index.html')));
  for (const relative of ['ja/index.html', 'ja/products/momentap/index.html', 'ja/support/index.html', 'ja/privacy/index.html', 'en/support/index.html']) {
    await write(relative, await readFile(path.join(root, 'cloudflare', relative), 'utf8'));
  }
  for (const routes of Object.values(families)) {
    for (const language of languages) {
      const file = fileFor(routes[language]);
      let html = await readOutput(file);
      if (language === 'en') {
        html = html.replaceAll('href="/support/" hreflang="ko"', 'href="/en/support/" hreflang="en"')
          .replaceAll('href="/support/"', 'href="/en/support/"')
          .replaceAll('href="/privacy/"', 'href="/en/privacy/"')
          .replaceAll('App support (Korean)', 'App support');
      }
      await write(file, languageNavigation(html, language, routes, origin));
    }
  }
  let notFound = await readOutput('404.html');
  notFound = notFound.replace('<nav class="footer-links"', '<p lang="ja">ページが見つかりません。以下のリンクからお進みください。</p>\n    <nav class="footer-links"')
    .replace('</head>', '<link rel="stylesheet" href="/assets/languages.css">\n</head>');
  notFound = removeLanguageLinks(notFound).replace('</header>', languagePicker('ko', families.home, { markCurrentPage: false }) + '</header>');
  await write('404.html', notFound);
  await write('assets/languages.css', `/* Language navigation and Japanese typography; no scripts or remote fonts. */
.language-picker { position: relative; z-index: 10; flex: 0 0 auto; max-width: 100%; margin: 0; padding: 0; border: 0; font-size: .9375rem; }
.language-picker:last-child { border: 0; }
.language-picker > summary { display: flex; align-items: center; gap: .5rem; min-height: 44px; padding: .45rem .85rem; border: 1px solid var(--line); border-radius: 100px; background: var(--paper); color: var(--ink); font-weight: 600; line-height: 1.4; list-style: none; cursor: pointer; }
.language-picker > summary::-webkit-details-marker { display: none; }
.language-picker > summary svg { width: 18px; height: 18px; flex: none; }
.language-picker > summary::after { content: ''; width: .4rem; height: .4rem; margin-left: .3rem; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: translateY(-2px) rotate(45deg); }
.language-picker[open] > summary { border-color: currentColor; }
.language-picker[open] > summary::after { transform: translateY(2px) rotate(225deg); }
.language-picker:not([open]) > .language-options { display: none; }
.language-options { position: absolute; inset-inline-end: 0; top: calc(100% + .5rem); width: max-content; min-width: min(11rem, calc(100vw - 40px)); max-width: calc(100vw - 40px); max-height: min(60vh, 22rem); overflow-y: auto; overscroll-behavior: contain; margin: 0; padding: .35rem; list-style: none; border: 1px solid var(--line); border-radius: 14px; background: var(--surface, var(--paper)); box-shadow: 0 10px 32px rgb(20 20 40 / 14%); }
.language-options li { margin: 0; padding: 0; }
.language-options a { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; min-height: 44px; padding: .5rem .75rem; border-radius: 8px; color: var(--ink); line-height: 1.4; text-decoration: none; overflow-wrap: anywhere; }
.language-options a:hover, .language-options a[aria-current="page"] { background: var(--soft, var(--violet-soft)); }
.language-options a[aria-current="page"] { font-weight: 700; }
.language-picker > summary:focus-visible, .language-options a:focus-visible { outline: 3px solid var(--focus, var(--brand)); outline-offset: 2px; }
.site-header nav { flex-wrap: wrap; align-items: center; }
.site-header > nav { margin-inline-start: auto; }
.site-header > .language-picker:last-child { margin-inline-start: auto; }
html:lang(ja) { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif; }
html:lang(ja) body { word-break: normal; line-break: strict; overflow-wrap: break-word; }
html:lang(ja) h1, html:lang(ja) h2, html:lang(ja) h3 { letter-spacing: -.02em; }
html:lang(ja) .hero h1 { font-size: clamp(2rem, 3.6vw, 3.2rem); }
html:lang(ja) .eyebrow { letter-spacing: .04em; }
html:lang(en) h1#hero-title { font-size: clamp(2rem, 4.8vw, 3.5rem); }
.skip-link { position: absolute; z-index: 10; top: -100px; left: 1rem; padding: .75rem 1rem; background: var(--paper); }
.skip-link:focus { top: 1rem; }
@media (max-width: 700px) {
  .site-header > nav { order: 1; width: 100%; margin-inline-start: 0; }
  .site-header:not(.wrap) { flex-wrap: wrap; gap: .75rem; }
  .site-header:not(.wrap) nav { width: 100%; flex-direction: row; justify-content: flex-start; gap: .35rem 1rem; text-align: left; }
  .site-header:not(.wrap) nav > a { display: inline-flex; align-items: center; min-height: 44px; }
  html:lang(ja) .hero h1 { font-size: clamp(1.5rem, 7vw, 2.25rem); }
}
@media (max-width: 360px) {
  .language-picker > summary { gap: .35rem; padding-inline: .65rem; font-size: .875rem; }
}
`);
  const routes = Object.values(families).flatMap(family => Object.values(family));
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>${origin}${route}</loc></url>`).join('\n')}\n</urlset>\n`);
}
