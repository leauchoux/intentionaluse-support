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

function languageNavigation(html, language, routes, origin) {
  // Every language switch retains the current page, including support/privacy.
  const navigation = `<span class="language-links" role="group" aria-label="${labels[language]}">${languages.map(code =>
    `<a class="language" href="${routes[code]}" lang="${code}" hreflang="${code}"${code === language ? ' aria-current="page"' : ''}>${names[code]}</a>`
  ).join('')}</span>`;
  let headerFound = false;
  html = html.replace(/(<header\b[^>]*>)([\s\S]*?)(<\/header>)/, (_, opening, contents, closing) => {
    headerFound = true;
    contents = contents.replace(/\s*<a\b[^>]*class="language"[^>]*>[\s\S]*?<\/a>/g, '');
    if (!contents.includes('</nav>')) throw new Error('Missing header navigation');
    return opening + contents.replace('</nav>', `${navigation}\n    </nav>`) + closing;
  });
  if (!headerFound) throw new Error('Missing page header');
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
    .replace('<a href="/support/">', '<a href="/ja/" lang="ja">日本語</a><a href="/support/">');
  await write('404.html', notFound);
  await write('assets/languages.css', `/* Language navigation and Japanese typography; no scripts or remote fonts. */
.language-links { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
.language-links a { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding-inline: .8rem; border: 1px solid var(--line); border-radius: 100px; text-decoration: none; white-space: nowrap; }
.language-links a[aria-current="page"] { color: var(--ink); border-color: currentColor; font-weight: 700; }
.site-header nav { flex-wrap: wrap; align-items: center; }
.site-header .language-links { margin-left: auto; }
html:lang(ja) { font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif; }
html:lang(ja) body { word-break: normal; line-break: strict; overflow-wrap: break-word; }
html:lang(ja) h1, html:lang(ja) h2, html:lang(ja) h3 { letter-spacing: -.02em; }
html:lang(ja) .hero h1 { font-size: clamp(2rem, 3.6vw, 3.2rem); }
html:lang(ja) .eyebrow { letter-spacing: .04em; }
html:lang(en) h1#hero-title { font-size: clamp(2rem, 4.8vw, 3.5rem); }
.skip-link { position: absolute; z-index: 10; top: -100px; left: 1rem; padding: .75rem 1rem; background: var(--paper); }
.skip-link:focus { top: 1rem; }
@media (max-width: 700px) {
  .site-header .language-links { flex-basis: 100%; margin-left: 0; }
  .site-header:not(.wrap) { flex-wrap: wrap; gap: .75rem; }
  .site-header:not(.wrap) nav { width: 100%; flex-direction: row; justify-content: flex-start; gap: .35rem 1rem; text-align: left; }
  .site-header:not(.wrap) nav > a { display: inline-flex; align-items: center; min-height: 44px; }
  html:lang(ja) .hero h1 { font-size: clamp(1.5rem, 7vw, 2.25rem); }
}
`);
  const routes = Object.values(families).flatMap(family => Object.values(family));
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>${origin}${route}</loc></url>`).join('\n')}\n</urlset>\n`);
}
