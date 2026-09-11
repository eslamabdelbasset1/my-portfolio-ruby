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

function getPosts() {
  const postsDir = path.join(ROOT, '_posts');
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).sort().reverse();
  return files.map(file => {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
    const { frontmatter, body } = parseFrontMatter(raw);
    const dateMatch = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.*)\.md$/);
    const dateStr = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '2024-01-01';
    const slug = dateMatch ? dateMatch[4] : file.replace('.md', '');
    const url = dateMatch ? `/blog/${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}/${slug}/` : `/blog/${slug}/`;
    return {
      title: frontmatter.title || slug.replace(/-/g, ' '),
      date: dateStr,
      categories: frontmatter.categories ? [frontmatter.categories] : ['Architecture'],
      tags: frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags : frontmatter.tags.split(',').map(t => t.trim())) : ['Laravel', 'SaaS'],
      url,
      excerpt: body.slice(0, 160).replace(/[#*`]/g, '') + '...'
    };
  });
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
  nav = nav.replace(/\{%\s*if page\.url contains '\/cv'\s*%\}active\{%\s*endif\s*%\}/g, reqUrl.startsWith('/cv') ? 'active' : '');
  nav = nav.replace(/\{%\s*if page\.url contains '\/blog'\s*%\}active\{%\s*endif\s*%\}/g, reqUrl.startsWith('/blog') ? 'active' : '');
  nav = nav.replace(/\{%\s*if page\.url == '\/contact\.html'\s*%\}active\{%\s*endif\s*%\}/g, reqUrl.startsWith('/contact') ? 'active' : '');

  // Inject includes
  layout = layout.replace('{% include navigation.html %}', nav);
  layout = layout.replace('{% include structured-data.html %}', structuredData);

  // Render posts list in index
  let processedBody = body;
  if (processedBody.includes('site.posts')) {
    const posts = getPosts();
    const postsHtml = posts.map(post => `
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
          <span class="work-type">${post.categories[0]} · ${post.date}</span>
          <h3 class="work-title" style="font-size: 1.15rem; line-height: 1.4;">${post.title}</h3>
          <p class="work-desc">${post.excerpt}</p>
          <div class="work-tags">
            ${post.tags.slice(0, 4).map(t => `<span class="wtag">${t}</span>`).join('')}
          </div>
        </div>
        <div class="work-card-footer">
          <a href="${post.url}" class="work-visit">Read Article <i data-lucide="arrow-right" size="14"></i></a>
        </div>
      </div>
    `).join('\n');

    // Accurately match the entire outer {% for post in site.posts %} ... outer {% endfor %} block tracking nesting
    const forStart = processedBody.indexOf('{% for post in site.posts %}');
    if (forStart !== -1) {
      let depth = 0;
      let forEnd = -1;
      const tagRegex = /\{%\s*(for\b|endfor\b)[\s\S]*?%\}/g;
      tagRegex.lastIndex = forStart;
      let match;
      while ((match = tagRegex.exec(processedBody)) !== null) {
        if (match[0].includes('for') && !match[0].includes('endfor')) {
          depth++;
        } else if (match[0].includes('endfor')) {
          depth--;
          if (depth === 0) {
            forEnd = match.index + match[0].length;
            break;
          }
        }
      }
      if (forEnd !== -1) {
        processedBody = processedBody.slice(0, forStart) + postsHtml + processedBody.slice(forEnd);
      } else {
        processedBody = processedBody.replace(/\{%\s*for post in site\.posts\s*%\}[\s\S]*?\{%\s*endfor\s*%\}/, postsHtml);
      }
    }
  }

  layout = layout.replace('{{ content }}', processedBody);

  // Replace remaining template variables
  layout = layout.replace(/\{%\s*if page\.title\s*%\}.*?\{%\s*endif\s*%\}/gs, title);
  layout = layout.replace(/\{\{\s*page\.title\s*\}\}/g, title);
  layout = layout.replace(/\{\{\s*site\.title\s*\}\}/g, 'Eslam Abdelbasset - Senior Backend Developer & Full Stack Engineer');
  layout = layout.replace(/\{\{\s*page\.description\s*\}\}/g, description);
  layout = layout.replace(/\{\{\s*site\.description\s*\}\}/g, description);
  layout = layout.replace(/\{\{\s*site\.author\s*\}\}/g, 'Eslam Abdelbasset');
  layout = layout.replace(/\{\{\s*site\.url\s*\}\}/g, `http://localhost:${PORT}`);
  layout = layout.replace(/\{\{.*?\|\s*absolute_url\s*\}\}/g, `/assets/me-image.png`);
  layout = layout.replace(/\{\{.*?\|\s*relative_url\s*\}\}/g, `/`);

  // Strip any lingering raw Liquid tags
  layout = layout.replace(/\{%\s*endfor\s*%\}/g, '');
  layout = layout.replace(/\{%\s*endif\s*%\}/g, '');
  layout = layout.replace(/\{%.*?%\}/gs, '');
  layout = layout.replace(/\{\{.*?\}\}/gs, '');

  return layout;
}

const server = http.createServer((req, res) => {
  const reqUrl = req.url.split('?')[0];

  // Route handlers
  if (reqUrl === '/' || reqUrl === '/index.html') {
    const html = renderJekyllPage(path.join(ROOT, 'index.html'), reqUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (reqUrl === '/cv' || reqUrl === '/cv.html' || reqUrl === '/resume') {
    const html = renderJekyllPage(path.join(ROOT, 'cv.html'), reqUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (reqUrl === '/contact' || reqUrl === '/contact.html') {
    const html = renderJekyllPage(path.join(ROOT, 'contact.html'), reqUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Static file handler
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

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Portfolio & CV Server is LIVE at:`);
  console.log(`  > Home:    http://localhost:${PORT}`);
  console.log(`  > CV/Page: http://localhost:${PORT}/cv`);
  console.log(`  > Contact: http://localhost:${PORT}/contact`);
  console.log(`======================================================\n`);
});
