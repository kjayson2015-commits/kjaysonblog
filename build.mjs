// Builds the public, search-engine-friendly version of the blog into the _site folder.
// GitHub runs this for you (see .github/workflows/build.yml). You never need to run it yourself,
// but you can: `node build.mjs` (Node 20 or newer).
//
// For every published post it writes a real page at /posts/<permalink>/ that already contains
// the post's text, title, description and structured data, so Google can read it without
// running any JavaScript. It also writes the home page, category pages, sitemap.xml,
// robots.txt, an RSS feed (feed.xml) and a 404 page that can show posts published since the
// last build.

import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const OUT = '_site';
const ASSETS = ['config.js', 'logo.jpg', 'icon-64.png', 'icon-180.png'];

// ---------- settings ----------
const ctx = {window: {}};
vm.runInNewContext(await fs.readFile('config.js', 'utf8'), ctx);
const CFG = ctx.window.BLOG_CONFIG || {};
const SB_URL = (CFG.supabaseUrl || '').replace(/\/+$/, '');
const SB_KEY = CFG.supabaseKey || '';
const SITE = (process.env.SITE_URL || CFG.siteUrl || '').replace(/\/+$/, '');
if (!SB_URL || /PASTE/.test(SB_URL + SB_KEY)) fail('Add your Supabase address and key to config.js first (README step 4).');
if (!/^https?:\/\//.test(SITE) || /yourdomain/i.test(SITE)) fail('Set siteUrl in config.js to your blog\'s web address (README step 5).');
const BASE = new URL(SITE + '/').pathname;          // "/" on your own domain
const abs = p => SITE + '/' + p.replace(/^\//, '');   // absolute URL for a site path

function fail(msg) { console.error('\n✖ ' + msg + '\n'); process.exit(1); }

// ---------- data ----------
const headers = SB_KEY.startsWith('sb_') ? {apikey: SB_KEY} : {apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY};
async function get(q) {
  const res = await fetch(`${SB_URL}/rest/v1/${q}`, {headers});
  if (!res.ok) fail(`Supabase answered ${res.status} for ${q.split('?')[0]}: ${await res.text()}`);
  return res.json();
}
const [rows, settingsRows] = await Promise.all([
  get('posts?status=eq.publish&select=*&order=published_at.desc'),
  get('settings?id=eq.1&select=*'),
]);
const st = {title: 'My Blog', tagline: '', about: '', author: '', ...(settingsRows[0] || {})};
st.title = st.title || 'My Blog';

// ---------- helpers (mirror the page's own) ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const slugify = t => String(t || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const textOf = html => decode(String(html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const cleanHTML = html => String(html || '').replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '').replace(/\son\w+="[^"]*"/gi, '');
const words = t => (t.match(/\S+/g) || []).length;
const LONG = new Intl.DateTimeFormat('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
const fmtDate = iso => { const d = new Date(iso || ''); return isNaN(d) ? '' : LONG.format(d); };

const posts = rows.map(r => {
  const text = textOf(r.html);
  const excerpt = r.excerpt || (text.split(' ').length > 38 ? text.split(' ').slice(0, 38).join(' ') + '…' : text);
  const d = (r.excerpt || text).trim();
  return {
    ...r,
    key: r.slug || r.id,
    titleText: (r.title || '').trim() || '(no title)',
    text, excerptText: excerpt,
    desc: d.length > 155 ? d.slice(0, 152).replace(/\s+\S*$/, '') + '…' : d,
    readTime: Math.max(1, Math.round(words(text) / 220)) + ' min read',
  };
});
const postPath = p => `posts/${encodeURIComponent(p.key)}/`;
const catPath = c => `category/${slugify(c)}/`;
const cats = [...posts.reduce((m, p) => (p.category ? m.set(p.category, (m.get(p.category) || 0) + 1) : m), new Map())]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

// ---------- page pieces (same markup and classes as the live page) ----------
const LOGO = 'logo.jpg';
const nav = active => `<nav class="site-nav" aria-label="Site">
        <a href="${BASE}" data-act="home"${active === 'home' ? ' aria-current="page"' : ''}>Home</a>
        ${cats.slice(0, 5).map(([c]) => `<a href="${BASE}${catPath(c)}" data-act="cat" data-cat="${esc(c)}"${active === c ? ' aria-current="page"' : ''}>${esc(c)}</a>`).join('')}
        <button type="button" class="theme-toggle" data-act="theme" aria-label="Switch theme"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><span>Theme</span></button>
      </nav>`;
const heroHeader = (isHome, active) => `
    <header class="site-head">
      <div class="hero-art"><img class="hero-logo bw" src="${LOGO}" alt="${esc(st.title)} logo" width="200" height="200"></div>
      <div class="hero-copy">
        <${isHome ? 'h1' : 'p'} class="site-title"><a href="${BASE}" data-act="home">${esc(st.title)}</a></${isHome ? 'h1' : 'p'}>
        ${st.tagline ? `<p class="tagline">${esc(st.tagline)}</p>` : ''}
        ${st.about ? `<p class="hero-about">${esc(st.about)}</p>` : ''}
        ${nav(active)}
      </div>
    </header>`;
const compactHeader = () => `
    <header class="site-head compact">
      <a href="${BASE}" data-act="home" aria-label="Home"><img class="logo-sm bw" src="${LOGO}" alt="" width="44" height="44"></a>
      <div class="hero-copy">
        <p class="site-title"><a href="${BASE}" data-act="home">${esc(st.title)}</a></p>
        ${nav('')}
      </div>
    </header>`;
const entry = p => `<article class="entry">
    <div class="meta"><time datetime="${esc(p.published_at)}">${esc(fmtDate(p.published_at))}</time>${p.category ? `<a href="${BASE}${catPath(p.category)}" data-act="cat" data-cat="${esc(p.category)}">${esc(p.category)}</a>` : ''}<span>${p.readTime}</span></div>
    <h2><a href="${BASE}${postPath(p)}" data-act="post" data-id="${esc(p.id)}">${esc(p.titleText)}</a></h2>
    <p class="excerpt">${esc(p.excerptText)}</p>
    <div><a class="more" href="${BASE}${postPath(p)}" data-act="post" data-id="${esc(p.id)}">Continue reading →</a>${st.author ? `<span class="muted" style="font-size:13px"> &nbsp;·&nbsp; by ${esc(st.author)}</span>` : ''}</div>
  </article>`;
const sidebar = () => `
      <aside class="sidebar">
        <section class="widget">
          <h3><label for="site-q">Search</label></h3>
          <form class="searchform" id="site-search" role="search"><input type="search" id="site-q" placeholder="Search posts"><button class="btn" type="submit">Search</button></form>
        </section>
        <section class="widget"><h3>Recent posts</h3>
          ${posts.length ? `<ul>${posts.slice(0, 5).map(p => `<li><a href="${BASE}${postPath(p)}" data-act="post" data-id="${esc(p.id)}">${esc(p.titleText)}</a></li>`).join('')}</ul>` : '<p class="muted" style="font-size:14px">None yet.</p>'}
        </section>
        ${cats.length ? `<section class="widget"><h3>Categories</h3><ul>${cats.map(([c, n]) => `<li><a href="${BASE}${catPath(c)}" data-act="cat" data-cat="${esc(c)}">${esc(c)}</a><span class="count">(${n})</span></li>`).join('')}</ul></section>` : ''}
      </aside>`;
const footer = () => `
    <footer class="site-foot">
      <span>© ${new Date().getUTCFullYear()} ${esc(st.title)}</span>
      <span><a href="${BASE}feed.xml">RSS</a> · <a href="#login" data-act="login">Log in</a></span>
    </footer>`;
const wrap = (header, main) => `
  <div class="site-wrap">${header}
    <div class="site-grid">
      <main>${main}</main>${sidebar()}
    </div>${footer()}
  </div>`;
const single = (p, i) => {
  const newer = posts[i - 1], older = posts[i + 1];
  const updated = p.updated_at && fmtDate(p.updated_at) !== fmtDate(p.published_at);
  return `<article class="single">
    <a class="back" href="${BASE}" data-act="home">← All posts</a>
    <h1>${esc(p.titleText)}</h1>
    <div class="byline">
      ${st.author ? `<span>By <strong>${esc(st.author)}</strong></span>` : ''}
      <time datetime="${esc(p.published_at)}">${esc(fmtDate(p.published_at))}</time>
      <span>${p.readTime}</span>
    </div>
    <div class="prose">${cleanHTML(p.html) || '<p><em>This post has no content yet.</em></p>'}</div>
    <footer class="post-foot">${p.category ? `Filed under <a class="chip" href="${BASE}${catPath(p.category)}" data-act="cat" data-cat="${esc(p.category)}">${esc(p.category)}</a>` : ''}${updated ? `<span>Updated ${esc(fmtDate(p.updated_at))}</span>` : ''}</footer>
    <nav class="postnav" aria-label="More posts">
      <div>${older ? `<a href="${BASE}${postPath(older)}" data-act="post" data-id="${esc(older.id)}"><span>← Previous</span><strong>${esc(older.titleText)}</strong></a>` : ''}</div>
      <div class="next">${newer ? `<a href="${BASE}${postPath(newer)}" data-act="post" data-id="${esc(newer.id)}"><span>Next →</span><strong>${esc(newer.titleText)}</strong></a>` : ''}</div>
    </nav>
  </article>`;
};

// ---------- head tags ----------
const jsonld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const person = st.author ? {'@type': 'Person', name: st.author} : {'@type': 'Organization', name: st.title};
function seo({title, desc, pathname, type = 'website', robots = 'index,follow,max-image-preview:large', extra = '', ld}) {
  const url = abs(pathname);
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:site_name" content="${esc(st.title)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(abs('logo.jpg'))}">
<meta name="twitter:card" content="summary">
<link rel="alternate" type="application/rss+xml" title="${esc(st.title)}" href="${esc(abs('feed.xml'))}">
${extra}${ld ? jsonld(ld) : ''}`;
}

// ---------- write pages ----------
const template = await fs.readFile('index.html', 'utf8');
for (const mark of ['<!--BASE-->', '<!--SEO-->', '<!--/SEO-->', '<div id="site"></div>']) if (!template.includes(mark)) fail('index.html is missing ' + mark);
function page(head, body) {
  return template
    .replace('<!--BASE-->', `<base href="${BASE}">`)
    .replace(/<!--SEO-->[\s\S]*?<!--\/SEO-->/, head)
    .replace('<div id="site"></div>', body == null ? '<div id="site"></div>' : `<div id="site" data-pre="1">${body}</div>`);
}
async function write(rel, content) {
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), {recursive: true});
  await fs.writeFile(file, content);
}

await fs.rm(OUT, {recursive: true, force: true});
await fs.mkdir(OUT, {recursive: true});
for (const a of ASSETS) await fs.copyFile(a, path.join(OUT, a));
await write('.nojekyll', '');
const host = new URL(SITE).hostname;
if (!host.endsWith('github.io')) await write('CNAME', host + '\n');

const siteDesc = st.tagline || st.about || `Posts from ${st.title}.`;
const homeTitle = st.tagline ? `${st.title} – ${st.tagline}` : st.title;
const blogLd = {
  '@context': 'https://schema.org', '@type': 'Blog', name: st.title, url: abs(''), description: siteDesc,
  publisher: person, image: abs('logo.jpg'),
  blogPost: posts.slice(0, 10).map(p => ({'@type': 'BlogPosting', headline: p.titleText, url: abs(postPath(p)), datePublished: p.published_at})),
};
await write('index.html', page(seo({title: homeTitle, desc: siteDesc, pathname: '', ld: blogLd}),
  wrap(heroHeader(true, 'home'), posts.length ? posts.slice(0, 10).map(entry).join('') : '<div class="entry"><p class="excerpt">Nothing has been published yet.</p></div>')));

for (const [i, p] of posts.entries()) {
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: p.titleText.slice(0, 110), description: p.desc, url: abs(postPath(p)),
    mainEntityOfPage: {'@type': 'WebPage', '@id': abs(postPath(p))},
    datePublished: p.published_at, dateModified: p.updated_at || p.published_at,
    author: person, publisher: {'@type': 'Organization', name: st.title, logo: {'@type': 'ImageObject', url: abs('logo.jpg')}},
    image: abs('logo.jpg'), wordCount: words(p.text),
    ...(p.category ? {articleSection: p.category} : {}),
    ...(p.focus_phrase ? {keywords: p.focus_phrase} : {}),
  };
  const extra = `<meta property="article:published_time" content="${esc(p.published_at)}">
<meta property="article:modified_time" content="${esc(p.updated_at || p.published_at)}">
${p.category ? `<meta property="article:section" content="${esc(p.category)}">\n` : ''}`;
  await write(postPath(p) + 'index.html', page(
    seo({title: `${p.titleText} – ${st.title}`, desc: p.desc, pathname: postPath(p), type: 'article', extra, ld}),
    wrap(compactHeader(), single(p, i))));
}

for (const [c] of cats) {
  const list = posts.filter(p => p.category === c);
  await write(catPath(c) + 'index.html', page(
    seo({title: `${c} – ${st.title}`, desc: `Posts about ${c} from ${st.title}.`, pathname: catPath(c)}),
    wrap(heroHeader(false, c), `<header class="archive-head"><p>Category</p><h1>${esc(c)}</h1></header>` + list.map(entry).join(''))));
}

// 404: the live app, so posts published since the last build still open for readers
await write('404.html', page(seo({title: `Not found – ${st.title}`, desc: siteDesc, pathname: '', robots: 'noindex'}), null));

// sitemap, robots, RSS
const newest = posts[0] ? (posts[0].updated_at || posts[0].published_at) : new Date().toISOString();
const urls = [
  {loc: abs(''), lastmod: newest},
  ...posts.map(p => ({loc: abs(postPath(p)), lastmod: p.updated_at || p.published_at})),
  ...cats.map(([c]) => ({loc: abs(catPath(c)), lastmod: posts.find(p => p.category === c)?.published_at || newest})),
];
await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc><lastmod>${new Date(u.lastmod).toISOString()}</lastmod></url>`).join('\n')}
</urlset>
`);
await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
await write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(st.title)}</title>
  <link>${esc(abs(''))}</link>
  <description>${esc(siteDesc)}</description>
  <language>en</language>
  <atom:link href="${esc(abs('feed.xml'))}" rel="self" type="application/rss+xml"/>
${posts.slice(0, 20).map(p => `  <item>
    <title>${esc(p.titleText)}</title>
    <link>${esc(abs(postPath(p)))}</link>
    <guid isPermaLink="true">${esc(abs(postPath(p)))}</guid>
    <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
    ${p.category ? `<category>${esc(p.category)}</category>` : ''}
    <description>${esc(p.desc)}</description>
  </item>`).join('\n')}
</channel>
</rss>
`);

console.log(`✔ Built ${posts.length} post page(s), ${cats.length} category page(s), sitemap, RSS feed and robots.txt for ${SITE}`);
