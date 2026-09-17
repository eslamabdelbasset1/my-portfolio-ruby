import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const PORT = process.env.PORT || 4000;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.pdf': return 'application/pdf';
    case '.ico': return 'image/x-icon';
    case '.xml': return 'application/xml';
    case '.txt': return 'text/plain; charset=utf-8';
    case '.woff2': return 'font/woff2';
    case '.woff': return 'font/woff';
    case '.ttf': return 'font/ttf';
    default: return 'application/octet-stream';
  }
}

function parseFrontMatter(raw) {
  if (!raw.startsWith('---')) {
    return { frontmatter: {}, body: raw };
  }
  const endIdx = raw.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { frontmatter: {}, body: raw };
  }
  const fmBlock = raw.slice(3, endIdx).trim();
  const body = raw.slice(endIdx + 4).trimStart();
  const frontmatter = {};
  fmBlock.split(/\r?\n/).forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      frontmatter[key] = val;
    }
  });
  return { frontmatter, body };
}

function parseList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const cleaned = val.replace(/^\[|\]$/g, '').trim();
  if (!cleaned) return [];
  return cleaned.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
}

function getPosts() {
  const postsDir = path.join(ROOT, '_posts');
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).sort().reverse();
  return files.map(file => {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
    const { frontmatter, body } = parseFrontMatter(raw);
    const dateMatch = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.*)\.md$/);
    const dateStr = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '2025-01-01';
    const slug = dateMatch ? dateMatch[4] : file.replace('.md', '');
    const url = dateMatch ? `/blog/${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}/${slug}/` : `/blog/${slug}/`;
    
    const categories = parseList(frontmatter.categories);
    const tags = parseList(frontmatter.tags);
    const words = body.split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(words / 180));

    // Clean excerpt extraction: skip markdown headers, badges, and clean markdown syntax
    let cleanExcerpt = frontmatter.excerpt || frontmatter.description || '';
    if (!cleanExcerpt) {
      const paras = body.split(/\n\n+/).map(p => p.trim()).filter(p => p && !p.startsWith('#') && !p.startsWith('---') && !p.startsWith('```') && !p.startsWith('!'));
      cleanExcerpt = paras[0] ? paras[0].replace(/[#*`_\[\]]/g, '').replace(/\([^)]*\)/g, '').trim() : '';
    }
    if (cleanExcerpt.length > 220) {
      cleanExcerpt = cleanExcerpt.slice(0, 220).trim() + '...';
    }

    return {
      file,
      slug,
      title: frontmatter.title || slug.replace(/-/g, ' '),
      date: dateStr,
      author: frontmatter.author || 'Eslam Abdelbasset',
      categories: categories.length ? categories : ['Architecture'],
      tags: tags.length ? tags : ['Laravel', 'SaaS'],
      url,
      body,
      readTime: `${readTime} min read`,
      excerpt: cleanExcerpt
    };
  });
}

function markdownToHtml(md) {
  let html = md;

  // Code blocks ```lang ... ```
  html = html.replace(/```([a-zA-Z0-9_\-]+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const languageClass = lang ? `language-${lang}` : 'language-text';
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre><code class="${languageClass}">${escaped}</code></pre>`;
  });

  // Inline code `...`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr>');

  // Bold & Italics
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Markdown links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Tables
  html = html.replace(/((?:\|[^\n]+\|\n)+)/g, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 2) return match;
    const headerCols = lines[0].split('|').slice(1, -1).map(c => c.trim());
    const rowLines = lines.slice(2);
    let tableHtml = '<div class="table-container"><table class="post-table"><thead><tr>';
    headerCols.forEach(col => { tableHtml += `<th>${col}</th>`; });
    tableHtml += '</tr></thead><tbody>';
    rowLines.forEach(row => {
      const cols = row.split('|').slice(1, -1).map(c => c.trim());
      if (cols.length) {
        tableHtml += '<tr>';
        cols.forEach(col => { tableHtml += `<td>${col}</td>`; });
        tableHtml += '</tr>';
      }
    });
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  });

  // Unordered lists
  html = html.replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>(\n|$))+/g, '<ul>$&</ul>');

  // Paragraphs
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<div') ||
        trimmed.startsWith('<hr')) {
      return trimmed;
    }
    return `<p>${trimmed}</p>`;
  }).join('\n\n');

  return html;
}

function renderJekyllPage(filePath, reqUrl) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontMatter(raw);

  const title = frontmatter.title || 'Eslam Abdelbasset - Senior Backend Developer & Full Stack Engineer';
  const description = frontmatter.description || 'Senior Backend Developer & Full Stack Engineer with 5+ years experience architecting distributed enterprise systems.';

  const layoutPath = path.join(ROOT, '_layouts', 'default.html');
  const navPath = path.join(ROOT, '_includes', 'navigation.html');
  const structuredDataPath = path.join(ROOT, '_includes', 'structured-data.html');

  let layout = fs.existsSync(layoutPath) ? fs.readFileSync(layoutPath, 'utf8') : '{{ content }}';
  let nav = fs.existsSync(navPath) ? fs.readFileSync(navPath, 'utf8') : '';
  let structuredData = fs.existsSync(structuredDataPath) ? fs.readFileSync(structuredDataPath, 'utf8') : '';

  // Active navigation highlighting
  nav = nav.replace(/\{%\s*if page\.url == '\/'\s*%\}active\{%\s*endif\s*%\}/g, reqUrl === '/' ? 'active' : '');
  nav = nav.replace(/\{%\s*if page\.url contains '\/projects'\s*%\}active\{%\s*endif\s*%\}/g, reqUrl.startsWith('/projects') ? 'active' : '');
  nav = nav.replace(/\{%\s*if page\.url contains '\/skills'\s*%\}active\{%\s*endif\s*%\}/g, reqUrl.startsWith('/skills') ? 'active' : '');
  nav = nav.replace(/\{%\s*if page\.url contains '\/cv'\s*%\}active\{%\s*endif\s*%\}/g, reqUrl.startsWith('/cv') ? 'active' : '');
  nav = nav.replace(/\{%\s*if page\.url contains '\/blog'\s*%\}active\{%\s*endif\s*%\}/g, reqUrl.startsWith('/blog') ? 'active' : '');
  nav = nav.replace(/\{%\s*if page\.url == '\/contact\.html' or page\.url contains '\/contact'\s*%\}active\{%\s*endif\s*%\}/g, reqUrl.startsWith('/contact') ? 'active' : '');

  // Inject includes
  layout = layout.replace('{% include navigation.html %}', nav);
  layout = layout.replace('{% include structured-data.html %}', structuredData);

  let processedBody = body;
  const posts = getPosts();

  // If page is blog index
  if (filePath.endsWith('blog/index.html') || processedBody.includes('blog-posts')) {
    const postsHtml = posts.map(post => `
    <article class="blog-post-preview" data-categories="${post.categories.join(',')}">
      <header class="post-preview-header">
        <div class="post-preview-meta">
          <time datetime="${post.date}">
            <i data-lucide="calendar" size="13"></i>
            ${new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </time>
          <div class="post-preview-categories">
            ${post.categories.map(c => `<span class="post-preview-category">${c}</span>`).join('')}
          </div>
          <span class="post-reading-time">
            <i data-lucide="clock" size="13"></i>
            ${post.readTime}
          </span>
        </div>
        <h2 class="post-preview-title">
          <a href="${post.url}">${post.title}</a>
        </h2>
      </header>
      <div class="post-preview-content">
        ${post.excerpt}
      </div>
      <footer class="post-preview-footer">
        <a href="${post.url}" class="read-more">Read Full Article →</a>
        <div class="post-preview-tags">
          ${post.tags.slice(0, 4).map(t => `<a href="/tags/${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" class="post-preview-tag-link">#${t}</a>`).join('')}
        </div>
      </footer>
    </article>
    `).join('\n');

    if (processedBody.includes('<!-- BLOG_POSTS_LIST -->')) {
      processedBody = processedBody.replace(/<!-- BLOG_POSTS_LIST -->[\s\S]*?<!-- \/BLOG_POSTS_LIST -->/, postsHtml);
    } else {
      processedBody = processedBody.replace(/\{%\s*for post in site\.posts\s*%\}[\s\S]*?\{%\s*endfor\s*%\}[\s\S]*?(?=<script|<\/div>\s*<\/div>)/, postsHtml);
    }
  }

  // If page has blog slider track (index.html)
  if (processedBody.includes('blog-slider-track') || processedBody.includes('BLOG_SLIDER_LIST')) {
    const sliderPostsHtml = posts.map(post => `
    <div class="work-card fade-in-up" style="flex: 0 0 360px; scroll-snap-align: start;">
        <div class="work-card-header">
            <div class="work-logo-wrap" style="display: flex; align-items: center; justify-content: center;">
                <i data-lucide="book-open" size="24" class="text-accent"></i>
            </div>
            <a href="${post.url}" class="work-link-btn">
                <i data-lucide="arrow-right" size="16"></i>
            </a>
        </div>
        <div class="work-card-body">
            <span class="work-type">${post.categories[0] || 'Engineering'} · ${new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <h3 class="work-title" style="font-size: 1.15rem; line-height: 1.4;">${post.title}</h3>
            <p class="work-desc">
                ${post.excerpt.length > 140 ? post.excerpt.slice(0, 140) + '...' : post.excerpt}
            </p>
            <div class="work-tags">
                ${post.tags.slice(0, 4).map(t => `<span class="wtag">${t}</span>`).join('')}
            </div>
        </div>
        <div class="work-card-footer">
            <a href="${post.url}" class="work-visit">
                Read Article <i data-lucide="arrow-right" size="14"></i>
            </a>
        </div>
    </div>
    `).join('\n');

    if (processedBody.includes('<!-- BLOG_SLIDER_LIST -->')) {
      processedBody = processedBody.replace(/<!-- BLOG_SLIDER_LIST -->[\s\S]*?<!-- \/BLOG_SLIDER_LIST -->/, sliderPostsHtml);
    } else {
      processedBody = processedBody.replace(/\{%\s*for post in site\.posts\s*%\}[\s\S]*?\{%\s*endfor\s*%\}[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/section>)/, sliderPostsHtml);
    }
  }

  layout = layout.replace('{{ content }}', processedBody);

  // Replace remaining template variables
  const keywords = frontmatter.keywords || 'software engineer for hire, senior backend developer, full stack engineer, enterprise software development, laravel, php, react';
  const robots = frontmatter.robots || 'index, follow';
  const ogTitle = frontmatter.og_title || title;
  const ogDescription = frontmatter.og_description || description;

  const canonicalUrl = 'https://eslamabdelbasset.vercel.app' + (reqUrl === '/' ? '/' : reqUrl.replace(/\/+$/, ''));
  const ogType = frontmatter.og_type || 'website';

  layout = layout.replace(/\{%\s*if page\.title\s*%\}.*?\{%\s*endif\s*%\}/gs, title);
  layout = layout.replace(/\{\{\s*page\.title\s*\}\}/g, title);
  layout = layout.replace(/\{\{\s*site\.title\s*\}\}/g, 'Eslam Abdelbasset - Senior Backend Developer & Full Stack Engineer');
  layout = layout.replace(/\{\{\s*page\.description\s*\}\}/g, description);
  layout = layout.replace(/\{\{\s*site\.description\s*\}\}/g, description);
  layout = layout.replace(/\{\{\s*page\.keywords\s*\}\}/g, keywords);
  layout = layout.replace(/\{\{\s*page\.robots\s*\}\}/g, robots);
  layout = layout.replace(/\{\{\s*page\.og_title\s*\}\}/g, ogTitle);
  layout = layout.replace(/\{\{\s*site\.og_title\s*\}\}/g, ogTitle);
  layout = layout.replace(/\{\{\s*page\.og_description\s*\}\}/g, ogDescription);
  layout = layout.replace(/\{\{\s*site\.og_description\s*\}\}/g, ogDescription);
  layout = layout.replace(/\{%\s*if page\.og_type\s*%\}.*?\{%\s*endif\s*%\}/gs, ogType);
  layout = layout.replace(/\{\{\s*page\.og_type\s*\}\}/g, ogType);
  layout = layout.replace(/\{%\s*if page\.canonical\s*%\}.*?\{%\s*endif\s*%\}/gs, canonicalUrl);
  layout = layout.replace(/\{\{\s*page\.canonical\s*\}\}/g, canonicalUrl);
  layout = layout.replace(/\{\{\s*site\.author\s*\}\}/g, 'Eslam Abdelbasset');
  layout = layout.replace(/\{\{\s*page\.url\s*\|\s*absolute_url\s*\}\}/g, canonicalUrl);
  layout = layout.replace(/\{\{\s*page\.url\s*\}\}/g, reqUrl);
  layout = layout.replace(/\{\{\s*site\.url\s*\}\}/g, `https://eslamabdelbasset.vercel.app`);
  layout = layout.replace(/\{\{.*?\|\s*absolute_url\s*\}\}/g, `/assets/me-image.png`);
  layout = layout.replace(/\{\{.*?\|\s*relative_url\s*\}\}/g, `/`);

  // Clean up any remaining Liquid tags
  layout = layout.replace(/\{%.*?%\}/gs, '');
  layout = layout.replace(/\{\{.*?\}\}/gs, '');

  return layout;
}

function renderSingleBlogPost(post, reqUrl) {
  const layoutPath = path.join(ROOT, '_layouts', 'default.html');
  const postLayoutPath = path.join(ROOT, '_layouts', 'post.html');
  const navPath = path.join(ROOT, '_includes', 'navigation.html');
  const structuredDataPath = path.join(ROOT, '_includes', 'structured-data.html');

  let defaultLayout = fs.readFileSync(layoutPath, 'utf8');
  let postLayout = fs.readFileSync(postLayoutPath, 'utf8');
  let nav = fs.existsSync(navPath) ? fs.readFileSync(navPath, 'utf8') : '';
  let structuredData = fs.existsSync(structuredDataPath) ? fs.readFileSync(structuredDataPath, 'utf8') : '';

  // Active navigation highlighting
  nav = nav.replace(/\{%\s*if page\.url == '\/'\s*%\}active\{%\s*endif\s*%\}/g, '');
  nav = nav.replace(/\{%\s*if page\.url contains '\/projects'\s*%\}active\{%\s*endif\s*%\}/g, '');
  nav = nav.replace(/\{%\s*if page\.url contains '\/skills'\s*%\}active\{%\s*endif\s*%\}/g, '');
  nav = nav.replace(/\{%\s*if page\.url contains '\/cv'\s*%\}active\{%\s*endif\s*%\}/g, '');
  nav = nav.replace(/\{%\s*if page\.url contains '\/blog'\s*%\}active\{%\s*endif\s*%\}/g, 'active');
  nav = nav.replace(/\{%\s*if page\.url == '\/contact\.html' or page\.url contains '\/contact'\s*%\}active\{%\s*endif\s*%\}/g, '');

  defaultLayout = defaultLayout.replace('{% include navigation.html %}', nav);
  defaultLayout = defaultLayout.replace('{% include structured-data.html %}', structuredData);

  // Parse frontmatter from post layout
  const { body: postLayoutBody } = parseFrontMatter(postLayout);

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const htmlBody = markdownToHtml(post.body);

  let renderedPost = postLayoutBody;
  renderedPost = renderedPost.replace('{{ content }}', htmlBody);
  renderedPost = renderedPost.replace(/\{\{\s*page\.title\s*\}\}/g, post.title);
  renderedPost = renderedPost.replace(/\{\{\s*page\.author[^}]*\}\}/g, post.author);
  renderedPost = renderedPost.replace(/\{\{\s*page\.date[^}]*\}\}/g, formattedDate);

  // Categories in post
  const catsHtml = post.categories.map(c => `<span class="post-category-badge">${c}</span>`).join('\n');
  renderedPost = renderedPost.replace(/\{%\s*if page\.categories\s*%\}[\s\S]*?\{%\s*endif\s*%\}/, catsHtml);

  // Tags in post
  const tagsHtml = post.tags.map(t => `<a href="/tags/${t.toLowerCase()}" class="post-tag-item">#${t}</a>`).join('\n');
  renderedPost = renderedPost.replace(/\{%\s*for tag in page\.tags\s*%\}[\s\S]*?\{%\s*endfor\s*%\}/, tagsHtml);

  // Clean remaining post liquid tags
  renderedPost = renderedPost.replace(/\{%.*?%\}/gs, '');
  renderedPost = renderedPost.replace(/\{\{.*?\}\}/gs, '');

  // Wrap in default layout
  let finalHtml = defaultLayout.replace('{{ content }}', renderedPost);
  finalHtml = finalHtml.replace(/\{\{\s*page\.title\s*\}\}/g, `${post.title} | Eslam Abdelbasset`);
  finalHtml = finalHtml.replace(/\{\{\s*site\.title\s*\}\}/g, 'Eslam Abdelbasset - Senior Backend Developer & Full Stack Engineer');
  finalHtml = finalHtml.replace(/\{\{\s*page\.description\s*\}\}/g, post.excerpt);
  finalHtml = finalHtml.replace(/\{\{\s*site\.description\s*\}\}/g, post.excerpt);
  finalHtml = finalHtml.replace(/\{\{\s*page\.keywords\s*\}\}/g, post.tags.join(', ') + ', backend engineering, distributed systems, high throughput');
  finalHtml = finalHtml.replace(/\{\{\s*page\.robots\s*\}\}/g, 'index, follow');
  finalHtml = finalHtml.replace(/\{\{\s*page\.og_title\s*\}\}/g, post.title);
  finalHtml = finalHtml.replace(/\{\{\s*site\.og_title\s*\}\}/g, post.title);
  finalHtml = finalHtml.replace(/\{\{\s*page\.og_description\s*\}\}/g, post.excerpt);
  finalHtml = finalHtml.replace(/\{\{\s*site\.og_description\s*\}\}/g, post.excerpt);
  const postCanonical = `https://eslamabdelbasset.vercel.app${post.url}`;
  finalHtml = finalHtml.replace(/\{%\s*if page\.og_type\s*%\}.*?\{%\s*endif\s*%\}/gs, 'article');
  finalHtml = finalHtml.replace(/\{\{\s*page\.og_type\s*\}\}/g, 'article');
  finalHtml = finalHtml.replace(/\{%\s*if page\.canonical\s*%\}.*?\{%\s*endif\s*%\}/gs, postCanonical);
  finalHtml = finalHtml.replace(/\{\{\s*page\.canonical\s*\}\}/g, postCanonical);
  finalHtml = finalHtml.replace(/\{\{\s*page\.author\s*\}\}/g, post.author || 'Eslam Abdelbasset');
  finalHtml = finalHtml.replace(/\{\{\s*page\.url\s*\|\s*absolute_url\s*\}\}/g, postCanonical);
  finalHtml = finalHtml.replace(/\{\{\s*page\.url\s*\}\}/g, reqUrl);
  finalHtml = finalHtml.replace(/\{\{\s*site\.url\s*\}\}/g, `https://eslamabdelbasset.vercel.app`);
  finalHtml = finalHtml.replace(/\{\{.*?\|\s*absolute_url\s*\}\}/g, `/assets/me-image.png`);
  finalHtml = finalHtml.replace(/\{\{.*?\|\s*relative_url\s*\}\}/g, `/`);

  finalHtml = finalHtml.replace(/\{%.*?%\}/gs, '');
  finalHtml = finalHtml.replace(/\{\{.*?\}\}/gs, '');

  return finalHtml;
}

const server = http.createServer((req, res) => {
  const reqUrl = req.url.split('?')[0];

  // Route: Home
  if (reqUrl === '/' || reqUrl === '/index.html') {
    const html = renderJekyllPage(path.join(ROOT, 'index.html'), reqUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Route: Projects
  if (reqUrl === '/projects' || reqUrl === '/projects.html' || reqUrl === '/projects/') {
    const html = renderJekyllPage(path.join(ROOT, 'projects.html'), reqUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Route: Skills
  if (reqUrl === '/skills' || reqUrl === '/skills.html' || reqUrl === '/skills/') {
    const html = renderJekyllPage(path.join(ROOT, 'skills.html'), reqUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Route: CV / Resume
  if (reqUrl === '/cv' || reqUrl === '/cv.html' || reqUrl === '/resume') {
    const html = renderJekyllPage(path.join(ROOT, 'cv.html'), reqUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Route: Contact
  if (reqUrl === '/contact' || reqUrl === '/contact.html' || reqUrl === '/contact/') {
    const html = renderJekyllPage(path.join(ROOT, 'contact.html'), reqUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Route: Blog Listing
  if (reqUrl === '/blog' || reqUrl === '/blog/' || reqUrl === '/blog/index.html') {
    const html = renderJekyllPage(path.join(ROOT, 'blog', 'index.html'), reqUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Route: Single Blog Post
  if (reqUrl.startsWith('/blog/')) {
    const posts = getPosts();
    const cleanUrl = reqUrl.replace(/\/+$/, '') + '/';
    const post = posts.find(p => p.url === cleanUrl || reqUrl.includes(p.slug));
    if (post) {
      const html = renderSingleBlogPost(post, reqUrl);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
  }

  // Static files handler
  let filePath = path.join(ROOT, reqUrl);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const mime = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // 404 handler
  const notFoundPath = path.join(ROOT, '404.html');
  if (fs.existsSync(notFoundPath)) {
    const html = renderJekyllPage(notFoundPath, reqUrl);
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${reqUrl}`);
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    const nextPort = Number(server.address()?.port || PORT) + 1;
    console.log(`Port busy, retrying on http://localhost:${nextPort}...`);
    server.listen(nextPort);
  } else {
    console.error('Server error:', e);
  }
});

server.listen(PORT, () => {
  const activePort = server.address().port;
  console.log(`\n======================================================`);
  console.log(`  Portfolio & CV Server is LIVE at:`);
  console.log(`  > Home:     http://localhost:${activePort}`);
  console.log(`  > Projects: http://localhost:${activePort}/projects`);
  console.log(`  > Skills:   http://localhost:${activePort}/skills`);
  console.log(`  > CV/Page:  http://localhost:${activePort}/cv`);
  console.log(`  > Blog:     http://localhost:${activePort}/blog`);
  console.log(`  > Contact:  http://localhost:${activePort}/contact`);
  console.log(`======================================================\n`);
});

export { renderJekyllPage, renderSingleBlogPost, getPosts };
