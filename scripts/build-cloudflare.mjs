import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Build a separate Cloudflare site without changing the GitHub Pages sources.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const origin = 'https://ianji.net';
const email = 'contact@ianji.net';
const icon = 'momentap-11fc3604.png';
const oldOrigin = 'https://leauchoux.github.io/intentionaluse-support';

function replaceRequired(html, before, after) {
  if (!html.includes(before)) {
    throw new Error(`Source changed; review this Cloudflare adaptation: ${before.slice(0, 100)}`);
  }
  return html.replaceAll(before, after);
}

function mapLinks(html, links) {
  return html.replace(/\b(href|src)="([^"]+)"/g, (match, attribute, value) =>
    Object.hasOwn(links, value) ? `${attribute}="${links[value]}"` : match);
}

function canonical(html, route) {
  return html.replace('</head>', `  <link rel="canonical" href="${origin}${route}">\n</head>`);
}

async function read(relative) {
  return readFile(path.join(root, relative), 'utf8');
}

async function write(relative, contents) {
  const destination = path.join(output, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents);
}

async function companySource(language) {
  const english = language === 'en';
  let html = await read(english ? 'organization/en/index.html' : 'organization/index.html');
  html = replaceRequired(html, `${oldOrigin}/organization/en/`, `${origin}/en/`);
  html = replaceRequired(html, `${oldOrigin}/organization/`, `${origin}/`);
  html = replaceRequired(html, 'leauchoux@gmail.com', email);
  html = english
    ? replaceRequired(html, 'is kept on the device for up to 90 days.', 'is kept on the device for the selected retention period.')
    : replaceRequired(html, '켜면 최대 90일 동안 기기에 보관합니다.', '켜면 선택한 보관 기간 동안 기기에 보관합니다.');
  html = mapLinks(html, english ? {
    './': '/en/', '../': '/', '../../': '/support/', '../../privacy.html': '/privacy/',
    '../styles.css': '/assets/company.css', [`../assets/${icon}`]: `/assets/${icon}`,
  } : {
    './': '/', 'en/': '/en/', '../': '/support/', '../privacy.html': '/privacy/',
    'styles.css': '/assets/company.css', [`assets/${icon}`]: `/assets/${icon}`,
  });
  html = html.replace('</head>', `  <link rel="alternate" hreflang="x-default" href="${origin}/">\n</head>`);
  html = html.replace('</head>', '  <link rel="stylesheet" href="/assets/site.css">\n</head>');
  return html;
}

function productSection(html) {
  const section = html.match(/<section id="product"[\s\S]*?<\/section>/)?.[0];
  if (!section) throw new Error('Source changed; MomenTap product section was not found.');
  return section;
}

async function company(language) {
  const english = language === 'en';
  let html = await companySource(language);
  const productRoute = english ? '/en/products/momentap/' : '/products/momentap/';
  const catalog = `<section id="products" class="section section-grid" aria-labelledby="products-title">
      <div>
        <h2 id="products-title" class="section-heading">${english ? 'Our products' : '제품'}</h2>
        <p class="section-sub">${english ? 'Mobile software by IANJI' : '이안지가 만드는 모바일 소프트웨어'}</p>
      </div>
      <div class="product-list">
        <a class="product-card" href="${productRoute}">
          <img class="product-card-icon" src="/assets/${icon}" alt="" width="80" height="80">
          <div>
            <span class="status">${english ? 'In development &amp; testing' : '개발 · 테스트 중'}</span>
            <h3>MomenTap</h3>
            <p>${english ? 'A digital wellbeing app for iPhone, designed for more intentional smartphone habits.' : '스마트폰 사용 습관을 스스로 돌아보도록 돕는 iPhone 디지털 웰빙 앱.'}</p>
            <span class="product-card-link">${english ? 'Explore MomenTap' : '제품 알아보기'} <span aria-hidden="true">→</span></span>
          </div>
        </a>
      </div>
    </section>`;
  html = replaceRequired(html, productSection(html), catalog);
  html = mapLinks(html, { '#product': '#products' });
  html = english
    ? replaceRequired(html, '>Meet MomenTap</a>', '>Explore our products</a>')
    : replaceRequired(html, '>MomenTap 알아보기</a>', '>제품 보기</a>');
  if (english) html = replaceRequired(html, '>Product</a>', '>Products</a>');
  return html;
}

async function product(language) {
  const english = language === 'en';
  const source = await companySource(language);
  const home = english ? '/en/' : '/';
  const route = english ? '/en/products/momentap/' : '/products/momentap/';
  const alternate = english ? '/products/momentap/' : '/en/products/momentap/';
  const section = productSection(source);
  const description = english
    ? 'MomenTap is an iPhone app by IANJI that helps people reflect on habitual app use and make time for the access they need.'
    : 'MomenTap은 이안지(IANJI)가 개발하는 iPhone 앱으로, 습관적인 앱 사용을 돌아보고 필요한 만큼 사용할 수 있도록 돕습니다.';
  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'">
  <title>MomenTap — ${english ? 'An iPhone app by IANJI' : '이안지의 iPhone 앱'}</title>
  <link rel="canonical" href="${origin}${route}">
  <link rel="alternate" hreflang="ko" href="${origin}/products/momentap/">
  <link rel="alternate" hreflang="en" href="${origin}/en/products/momentap/">
  <link rel="alternate" hreflang="x-default" href="${origin}/products/momentap/">
  <link rel="icon" href="/assets/${icon}" type="image/png">
  <link rel="stylesheet" href="/assets/company.css">
  <link rel="stylesheet" href="/assets/site.css">
</head>
<body>
  <a class="skip-link" href="#main">${english ? 'Skip to content' : '본문으로 바로가기'}</a>
  <header class="site-header wrap">
    <a class="wordmark" href="${home}" aria-label="${english ? 'IANJI company home' : '이안지 IANJI 회사 홈'}">IANJI<small lang="ko">이안지</small></a>
    <nav class="site-nav" aria-label="${english ? 'Main navigation' : '주요 메뉴'}">
      <a href="${home}#about">${english ? 'About' : '회사 소개'}</a>
      <a href="${home}#products">${english ? 'Products' : '제품'}</a>
      <a href="${home}#contact">${english ? 'Contact' : '문의'}</a>
      <a class="language" href="${alternate}" lang="${english ? 'ko' : 'en'}" hreflang="${english ? 'ko' : 'en'}">${english ? '한국어' : 'English'}</a>
    </nav>
  </header>
  <main id="main" class="wrap">
    <section class="product-intro" aria-labelledby="product-page-title">
      <nav class="breadcrumbs" aria-label="${english ? 'Breadcrumb' : '현재 위치'}">
        <a href="${home}">IANJI</a><span aria-hidden="true">/</span><a href="${home}#products">${english ? 'Products' : '제품'}</a><span aria-hidden="true">/</span><span aria-current="page">MomenTap</span>
      </nav>
      <h1 id="product-page-title">MomenTap</h1>
      <p class="hero-copy">${description}</p>
    </section>
    ${section}
    <section class="section section-grid" aria-labelledby="help-title">
      <div><h2 id="help-title" class="section-heading">${english ? 'Support &amp; contact' : '지원 · 문의'}</h2></div>
      <div>
        <p>${english ? 'For product support and business inquiries, contact IANJI.' : '제품 지원과 업무 문의는 이안지에 연락해 주세요.'}</p>
        <a class="text-link" href="mailto:${email}">${email}</a>
      </div>
    </section>
  </main>
  <footer class="site-footer wrap">
    <p>© 2026 IANJI · <span lang="ko">이안지</span></p>
    <nav class="footer-links" aria-label="${english ? 'Related pages' : '관련 페이지'}"><a href="${home}">${english ? 'Company home' : '회사 홈'}</a><a href="/support/" hreflang="ko">${english ? 'App support (Korean)' : 'MomenTap 지원'}</a><a href="/privacy/">${english ? 'Privacy policy' : '개인정보처리방침'}</a></nav>
  </footer>
</body>
</html>
`;
}

function supportLinks(html) {
  return mapLinks(html, {
    'index.html': '/support/', 'organization/': '/', 'privacy.html': '/privacy/',
    'styles.css': '/assets/support.css', 'favicon.svg': '/favicon.svg',
  });
}

async function support() {
  let html = supportLinks(await read('index.html'));
  html = replaceRequired(html,
    '<a href="/">이안지 소개</a>',
    '<a href="/">이안지 소개</a>\n      <a href="/products/momentap/">MomenTap 소개</a>');
  html = replaceRequired(html, '이 iPhone에 최대 90일 보관합니다.', '기본 90일 동안 이 iPhone에 보관합니다. 보관 기간 설정을 제공하는 버전에서는 사용자가 선택한 보관 기간을 적용합니다.');
  html = replaceRequired(html,
    '<p>공개 GitHub 이슈로 문제를 알려 주세요.',
    `<p>제품 지원은 <a href="mailto:${email}">${email}</a>로 문의할 수 있습니다. 공개 GitHub 이슈로 문제를 알려 주셔도 됩니다.`);
  return canonical(html, '/support/');
}

async function privacy() {
  let html = supportLinks(await read('privacy.html'));
  html = replaceRequired(html,
    '<nav aria-label="주요 메뉴">',
    '<nav aria-label="주요 메뉴">\n      <a href="/">이안지 소개</a>\n      <a href="/products/momentap/">MomenTap 소개</a>');
  html = replaceRequired(html, '시행일: 2026년 9월 30일', '시행일: 2026년 10월 1일');
  html = replaceRequired(html, 'Effective: September 30, 2026', 'Effective: October 1, 2026');
  html = replaceRequired(html,
    '사용자가 앱 밖에서 선택적으로 제출하는 공개 지원 이슈는 6절에서 별도로 설명합니다.',
    '사용자가 앱 밖에서 선택적으로 제출하는 공개 지원 이슈와 이메일 문의는 6절에서 별도로 설명합니다.');
  html = replaceRequired(html,
    'Optional public support issues submitted outside the App are described separately in Section 6.',
    'Optional public support issues and email inquiries submitted outside the App are described separately in Section 6.');
  html = replaceRequired(html, '<h2>6. 선택적 공개 지원 요청</h2>', '<h2>6. 웹사이트와 선택적 지원 요청</h2>');
  html = replaceRequired(html,
    '<p>이 지원·개인정보 페이지는 GitHub Pages에서 호스팅됩니다. GitHub는 페이지 제공 과정에서 IP 주소나 요청 정보 같은 기술 데이터를 자체 방침에 따라 처리할 수 있습니다. 개발자는 페이지에 별도 분석 도구를 넣지 않았으며 GitHub Pages 방문자 분석 보고서를 받지 않습니다.</p>',
    '<p>이 회사 소개·지원·개인정보 페이지는 Cloudflare Pages에서 호스팅됩니다. Cloudflare는 웹페이지 제공과 보안을 위해 IP 주소와 요청 정보 같은 기술 데이터를 자체 방침에 따라 처리할 수 있습니다. 이 사이트에는 별도 분석·추적 스크립트나 입력 양식을 추가하지 않았습니다. Cloudflare의 처리에는 <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare Privacy Policy</a>가 적용됩니다.</p>');
  html = replaceRequired(html,
    '<p>GitHub에서 처리되는 정보에는',
    `<p>이메일로 문의하면 회신에 필요한 발신 이메일 주소와 사용자가 작성한 내용을 개발자가 확인할 수 있습니다. 문의 메일은 iCloud Mail을 통해 수신하며 <a href="https://www.apple.com/legal/privacy/">Apple 개인정보 처리방침</a>도 적용됩니다. 앱은 문의 메일이나 지원 정보를 자동으로 전송하지 않습니다. 이메일에도 Screen Time token 등 민감한 정보를 보내지 마세요.</p>\n        <p>GitHub에서 처리되는 정보에는`);
  html = replaceRequired(html,
    '<p>개인정보 문의는 <a href="https://github.com/leauchoux/intentionaluse-support/issues/new/choose">공개 지원 이슈</a>로 접수할 수 있습니다. 공개 이슈에 개인정보나 Screen Time 선택 정보를 작성하지 마세요.</p>',
    `<p>개인정보 문의는 <a href="mailto:${email}">${email}</a>로 보내주세요. <a href="https://github.com/leauchoux/intentionaluse-support/issues/new/choose">공개 지원 이슈</a>도 이용할 수 있으나, 공개 이슈에 개인정보나 Screen Time 선택 정보를 작성하지 마세요.</p>`);
  html = replaceRequired(html, '<h2>6. Optional Public Support Requests</h2>', '<h2>6. Website and Optional Support Requests</h2>');
  html = replaceRequired(html,
    '<p>These support and privacy pages are hosted on GitHub Pages. GitHub may process technical data such as IP addresses or request information under its own policy when serving the pages. The developer has not added analytics tools and does not receive GitHub Pages visitor analytics reports.</p>',
    '<p>These company, support, and privacy pages are hosted on Cloudflare Pages. Cloudflare may process technical data such as IP addresses and request information to serve and protect the website under its own policy. No separate analytics or tracking scripts or input forms have been added to this site. Cloudflare processing is governed by the <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare Privacy Policy</a>.</p>');
  html = replaceRequired(html,
    'GitHub General Privacy Statement</a>.</p></section>',
    'GitHub General Privacy Statement</a>.</p><p>If you contact the developer by email, the developer can access your sender email address and the message you submit to respond to your inquiry. Mail is received through iCloud Mail and the <a href="https://www.apple.com/legal/privacy/">Apple Privacy Policy</a> also applies. The App does not send email or support information automatically. Do not email sensitive information such as Screen Time tokens.</p></section>');
  html = replaceRequired(html,
    '<p>Privacy questions may be submitted through a <a href="https://github.com/leauchoux/intentionaluse-support/issues/new/choose">public support issue</a>. Do not include personal information or Screen Time selections in a public issue.</p>',
    `<p>For privacy questions, email <a href="mailto:${email}">${email}</a>. You may also use a <a href="https://github.com/leauchoux/intentionaluse-support/issues/new/choose">public support issue</a>. Do not include personal information or Screen Time selections in a public issue.</p>`);
  return canonical(html, '/privacy/');
}

const notFound = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <meta name="referrer" content="no-referrer">
  <title>페이지를 찾을 수 없습니다 — IANJI</title>
  <link rel="icon" href="/assets/${icon}" type="image/png">
  <link rel="stylesheet" href="/assets/company.css">
</head>
<body>
  <header class="site-header wrap"><a class="wordmark" href="/">IANJI<small>이안지</small></a></header>
  <main class="wrap"><section class="section" aria-labelledby="page-title">
    <p class="eyebrow">404</p>
    <h1 id="page-title">페이지를 찾을 수 없습니다.</h1>
    <p>주소가 바뀌었거나 존재하지 않는 페이지입니다.</p>
    <p lang="en">This page could not be found. Please use the links below.</p>
    <nav class="footer-links" aria-label="다른 페이지"><a href="/">회사 소개</a><a href="/en/" lang="en">English</a><a href="/support/">앱 지원</a></nav>
  </section></main>
</body>
</html>
`;

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await write('index.html', await company('ko'));
await write('en/index.html', await company('en'));
await write('products/momentap/index.html', await product('ko'));
await write('en/products/momentap/index.html', await product('en'));
await write('support/index.html', await support());
await write('privacy/index.html', await privacy());
await write('404.html', notFound);
await mkdir(path.join(output, 'assets'), { recursive: true });
await cp(path.join(root, 'organization/styles.css'), path.join(output, 'assets/company.css'));
await write('assets/site.css', `/* Company catalog and product detail additions; the original stylesheet stays unchanged. */
.product-list { display: grid; gap: 1.25rem; }
.product-card { display: grid; grid-template-columns: 80px minmax(0, 1fr); align-items: start; gap: 1.6rem; padding: 2rem; border: 1px solid var(--line); border-radius: 20px; background: var(--soft); color: var(--ink); text-decoration: none; }
.product-card:hover { border-color: var(--brand); }
.product-card-icon { width: 80px; height: 80px; }
.product-card h3 { margin-bottom: .65rem; font-size: 1.6rem; }
.product-card p { margin-bottom: .8rem; color: var(--muted); }
.product-card .status { margin-bottom: .7rem; }
.product-card-link { display: inline-flex; gap: .5rem; align-items: center; min-height: 44px; color: var(--brand); font-weight: 650; }
.product-intro { padding-block: 36px 48px; }
.product-intro .hero-copy { max-width: 42rem; margin-bottom: 0; }
.breadcrumbs { display: flex; flex-wrap: wrap; align-items: center; gap: .7rem; margin-bottom: 2rem; font-size: .875rem; color: var(--muted); }
.breadcrumbs a { display: inline-flex; align-items: center; min-height: 44px; color: var(--muted); }
@media (max-width: 700px) {
  .product-card { grid-template-columns: 64px minmax(0, 1fr); gap: 1rem; padding: 1.25rem; }
  .product-card-icon { width: 64px; height: 64px; }
  .product-intro { padding-block: 20px 32px; }
  .breadcrumbs { margin-bottom: 1.25rem; }
}
@media (max-width: 360px) { .product-card { grid-template-columns: 1fr; } }
`);
await write('assets/support.css', `${await read('styles.css')}\n/* Keep the support hero label above its decorative ring. */\n.hero > .eyebrow { position: relative; z-index: 1; }\n`);
await cp(path.join(root, 'organization/assets', icon), path.join(output, 'assets', icon));
await cp(path.join(root, 'favicon.svg'), path.join(output, 'favicon.svg'));
await write('_headers', `/*
  Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY

/assets/${icon}
  Cache-Control: public, max-age=31536000, immutable
`);
await write('_redirects', `/organization / 301
/organization/ / 301
/organization/index.html / 301
/organization/en /en/ 301
/organization/en/ /en/ 301
/organization/en/index.html /en/ 301
/organization/styles.css /assets/company.css 301
/organization/assets/* /assets/:splat 301
/privacy.html /privacy/ 301
`);
await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['/', '/en/', '/products/momentap/', '/en/products/momentap/', '/support/', '/privacy/'].map(route => `  <url><loc>${origin}${route}</loc></url>`).join('\n')}
</urlset>
`);
console.log(`Built static Cloudflare Pages bundle in ${output}`);
