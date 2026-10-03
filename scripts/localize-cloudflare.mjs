import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const languages = ['ko', 'en', 'ja'];
const names = { ko: '한국어', en: 'English', ja: '日本語' };
const labels = { ko: '언어 선택', en: 'Language', ja: '言語を選択' };
const englishNames = { ko: 'Korean', en: 'English', ja: 'Japanese' };
const searchNames = { ko: 'ko ko-KR 한국어 Korean 한국', en: 'en en-US English 영어 영문 英語', ja: 'ja ja-JP 日本語 Japanese 일본어 일본' };
const menuCopy = {
  ko: { title: '언어 선택', close: '언어 선택 닫기', search: '검색', searchLabel: '언어 이름 또는 코드로 검색', empty: '일치하는 언어가 없습니다.', results: '{count}개 언어' },
  en: { title: 'Select a language', close: 'Close language selector', search: 'Search', searchLabel: 'Search by language name or code', empty: 'No matching languages.', results: '{count} languages' },
  ja: { title: '言語を選択', close: '言語選択を閉じる', search: '検索', searchLabel: '言語名またはコードで検索', empty: '一致する言語がありません。', results: '{count}言語' },
};
const globe = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
const families = {
  home: { ko: '/', en: '/en/', ja: '/ja/' },
  product: { ko: '/products/momentap/', en: '/en/products/momentap/', ja: '/ja/products/momentap/' },
  support: { ko: '/support/', en: '/en/support/', ja: '/ja/support/' },
  privacy: { ko: '/privacy/', en: '/en/privacy/', ja: '/ja/privacy/' },
};
const fileFor = route => `${route.slice(1)}index.html`;

function languagePicker(language, routes, { markCurrentPage = true } = {}) {
  const copy = menuCopy[language];
  const trigger = `${globe}<span lang="${language}">${names[language]}</span>`;
  const choices = languages.map(code => `<li data-language-search="${searchNames[code]}"><a class="language-choice" href="${routes[code]}" hreflang="${code}"${code === language && markCurrentPage ? ' aria-current="page"' : ''}><span class="language-choice-label"><span lang="${code}">${names[code]}</span><small lang="en">${englishNames[code]}</small></span>${code === language ? '<span class="language-check" aria-hidden="true">✓</span>' : ''}</a></li>`).join('');
  return `<div class="language-picker">
    <details class="language-fallback"><summary class="language-trigger" aria-label="${labels[language]}: ${names[language]}">${trigger}</summary><ul class="language-options" aria-label="${copy.title}">${choices}</ul></details>
    <button class="language-trigger" type="button" aria-label="${labels[language]}: ${names[language]}" aria-haspopup="dialog" aria-controls="language-dialog" aria-expanded="false" hidden>${trigger}</button>
    <dialog class="language-dialog" id="language-dialog" aria-labelledby="language-title" data-results-label="${copy.results}"${language === 'en' ? ' data-result-one="1 language"' : ''}>
      <div class="language-panel">
        <div class="language-panel-header"><h2 id="language-title">${copy.title}</h2><button class="language-close" type="button" aria-label="${copy.close}" autofocus><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div>
        <ul class="language-list" aria-label="${copy.title}">${choices}</ul>
        <p class="language-empty" hidden>${copy.empty}</p>
      </div>
      <label class="language-search">${'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>'}<input id="language-search" type="search" placeholder="${copy.search}" aria-label="${copy.searchLabel}" autocomplete="off" spellcheck="false"></label>
      <p class="language-status" role="status" aria-live="polite"></p>
    </dialog>
  </div>`;
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
  const menuScript = await readFile(path.join(root, 'cloudflare/language-menu.js'), 'utf8');
  const digest = createHash('sha256').update(menuScript).digest();
  const integrity = `sha256-${digest.toString('base64')}`;
  const scriptPath = `assets/language-menu-${digest.toString('hex').slice(0, 12)}.js`;
  const allowMenuScript = html => html.replace("default-src 'none';", `default-src 'none'; script-src '${integrity}';`)
    .replace('</head>', `<script src="/${scriptPath}" integrity="${integrity}" defer></script>\n</head>`);
  await write(scriptPath, menuScript);
  await write('_headers', (await readOutput('_headers')).replace("default-src 'none';", `default-src 'none'; script-src '${integrity}';`));

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
      await write(file, allowMenuScript(languageNavigation(html, language, routes, origin)));
    }
  }
  let notFound = await readOutput('404.html');
  notFound = notFound.replace('<nav class="footer-links"', '<p lang="ja">ページが見つかりません。以下のリンクからお進みください。</p>\n    <nav class="footer-links"')
    .replace('</head>', '<link rel="stylesheet" href="/assets/languages.css">\n</head>');
  notFound = removeLanguageLinks(notFound).replace('</header>', languagePicker('ko', families.home, { markCurrentPage: false }) + '</header>');
  await write('404.html', allowMenuScript(notFound));
  await write('assets/languages.css', await readFile(path.join(root, 'cloudflare/language-menu.css'), 'utf8') + `
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
`);
  // Existing visitors may still have the previous selector CSS cached. Version
  // the stylesheet with its contents, just like the script, before publishing.
  const styles = await readOutput('assets/languages.css');
  const styleHash = createHash('sha256').update(styles).digest('hex').slice(0, 12);
  const stylePath = `assets/languages-${styleHash}.css`;
  await rename(path.join(output, 'assets/languages.css'), path.join(output, stylePath));
  for (const file of [...Object.values(families).flatMap(routes => Object.values(routes).map(fileFor)), '404.html']) {
    await write(file, (await readOutput(file)).replace('href="/assets/languages.css"', `href="/${stylePath}"`));
  }
  const routes = Object.values(families).flatMap(family => Object.values(family));
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>${origin}${route}</loc></url>`).join('\n')}\n</urlset>\n`);
}
