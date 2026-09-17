// Interactive UI & Mobile Media Preview System for Projects
const projectMediaData = {
  "erkaz": {
    name: "Erkaz Mining & Operations ERP",
    category: "Heavy Fleet & Operations Cloud ERP",
    logo: "/assets/img/companies/erkaz.svg",
    url: "https://erkaz.online",
    displayUrl: "erkaz.online",
    metrics: "Heavy Fleet Telematics • Diesel & Fuel Tracking • Shift Cost Accounting",
    tech: ["Laravel", "Enterprise ERP", "RBAC Matrices", "Fleet Telematics", "Redis"],
    desktopUI: {
      headline: "Cloud Fleet & Heavy Equipment Operations Platform",
      subline: "Automated fuel consumption tracking, shift handovers, preventative maintenance, and financial intelligence.",
      badge: "Heavy Machinery ERP",
      stats: [
        { label: "Fleet Telematics", val: "Real-Time Tracking" },
        { label: "Audit Accuracy", val: "+50% Efficiency" },
        { label: "Role Control", val: "Strict RBAC" }
      ],
      features: [
        "Real-time monitoring of heavy equipment work hours, maintenance logs, and operational status",
        "Automated diesel/fuel consumption calculations and shift transition auditing reports",
        "Production tracking with financial intelligence and multi-department approval cycles"
      ]
    },
    mobileUI: {
      title: "Erkaz Fleet Mobile",
      subtitle: "Field Operations & Shift Handover",
      actions: ["Log Fuel", "Shift Handover", "Equipment Status"]
    }
  },
  "tog": {
    name: "Tog.sa & Tog Stores",
    category: "Multi-Tenant SaaS · ZATCA Phase 2",
    logo: "/assets/img/works/tog.png",
    url: "https://tog.sa/",
    displayUrl: "tog.sa",
    metrics: "ZATCA Phase 2 Certified • Multi-Branch Inventory • Real-time Redirection",
    tech: ["Laravel", "ZATCA e-Invoicing", "PostgreSQL", "Redis", "Vue.js"],
    desktopUI: {
      headline: "ZATCA Phase 2 E-Invoicing & Cloud Accounting Portal",
      subline: "Enterprise cloud billing with automated cryptographic compliance and multi-tenant ledger isolation.",
      badge: "Production ERP",
      stats: [
        { label: "Compliance", val: "ZATCA Phase 2" },
        { label: "Query Speed", val: "Sub-50ms" },
        { label: "Tenants", val: "Multi-Branch" }
      ],
      features: [
        "Cryptographic stamp & dynamic QR code generation for Saudi tax authority",
        "Automated multi-currency billing calculator & inventory stock sync",
        "Tog Stores high-concurrency URL shortener with sub-50ms redirect pipeline"
      ]
    },
    mobileUI: {
      title: "Tog.sa Mobile",
      subtitle: "Instant Mobile Invoicing & POS",
      actions: ["Scan QR", "Generate Bill", "Live Analytics"]
    }
  },
  "layout": {
    name: "Layout International",
    category: "Enterprise Publishing Infrastructure",
    logo: "/assets/img/works/layout-International.svg",
    url: "https://www.layoutintl.com",
    displayUrl: "layoutintl.com",
    metrics: "Newsroom Workflows • Laravel Microservices • AI Content Pipelines",
    tech: ["Laravel", "Vue.js", "Redis Caching", "Microservices", "MySQL"],
    desktopUI: {
      headline: "Intelligent Publishing Workspace for Global Newsrooms",
      subline: "Unified print and digital editorial management lowering per-article production costs.",
      badge: "Enterprise Platform",
      stats: [
        { label: "Throughput", val: "10K+ Articles/Day" },
        { label: "Architecture", val: "Microservices" },
        { label: "Caching", val: "Redis Tiered" }
      ],
      features: [
        "Editorial desk with live article draft statuses and print workflow synchronization",
        "AI-assisted article metadata categorization, SEO tagging, and translation",
        "Distributed Laravel microservices architecture backed by Redis cluster"
      ]
    },
    mobileUI: {
      title: "Layout Newsroom Mobile",
      subtitle: "Real-time Field Editorial Desk",
      actions: ["Review Draft", "Publish Now", "AI Polish"]
    }
  },
  "xlingo": {
    name: "xLingo HR & CRM Platform",
    category: "Loc Camp Multi-Tenant SaaS",
    logo: "/assets/img/works/loc-camp.jpg",
    url: "https://loc-camp.com",
    displayUrl: "loc-camp.com/xlingo",
    metrics: "Tenant-Isolated Schemas • Automated Payroll • Role Hierarchies",
    tech: ["Laravel", "Vue.js", "Redis", "MySQL", "Automated Workflows"],
    desktopUI: {
      headline: "Multi-Tenant Workforce & Enterprise CRM SaaS",
      subline: "Strict tenant isolation with automated employee attendance, contracts, and salary calculation.",
      badge: "SaaS Ecosystem",
      stats: [
        { label: "Tenancy", val: "Schema-Isolated" },
        { label: "Automation", val: "Payroll & Logs" },
        { label: "Response", val: "<80ms API" }
      ],
      features: [
        "Tenant-isolated relational schemas guaranteeing strict corporate data privacy",
        "Hierarchical RBAC for department managers, HR executives, and team members",
        "Automated salary calculation engine integrated with biometric attendance logs"
      ]
    },
    mobileUI: {
      title: "xLingo Mobile App",
      subtitle: "Employee Self-Service & Check-in",
      actions: ["Clock In", "Request Leave", "Salary Slip"]
    }
  },
  "consttech": {
    name: "Const Tech Enterprise Platform",
    category: "Enterprise Scaling & Saudi Integrations",
    logo: "/assets/img/works/const-tech.jpg",
    url: "https://www.const-tech.org",
    displayUrl: "const-tech.org",
    metrics: "40% Performance Boost • Composite SQL Indexes • Sub-100ms APIs",
    tech: ["Laravel", "SQL Optimization", "Redis", "RESTful APIs", "MySQL"],
    desktopUI: {
      headline: "High-Traffic Enterprise Platform Architecture",
      subline: "Optimized relational execution plans, resolved query bottlenecks, and scalable 3rd-party integrations.",
      badge: "Consulting & Scaling",
      stats: [
        { label: "Perf Boost", val: "+40% Faster" },
        { label: "Latencies", val: "Sub-100ms" },
        { label: "Market", val: "Saudi Arabia" }
      ],
      features: [
        "Resolved critical database locks by designing composite indexes and Eloquent relationship refactoring",
        "Standardized RESTful microservices for external Saudi B2B business integrations",
        "Real-time cache invalidation patterns cutting peak-traffic server bottlenecks"
      ]
    },
    mobileUI: {
      title: "Const Tech Portal",
      subtitle: "Executive Management Portal",
      actions: ["Platform Health", "API Metrics", "Active Services"]
    }
  },
  "sneakers": {
    name: "Sneakers Dubai",
    category: "Mobile-First Flagship E-Commerce",
    logo: "/assets/img/works/sneakers-dubai.png",
    url: "https://sneakersdubai.com",
    displayUrl: "sneakersdubai.com",
    metrics: "25% Sales Conversion Lift • 40% SEO Traffic Growth • Mobile Optimized",
    tech: ["E-Commerce", "JavaScript", "Technical SEO", "CSS3", "Photoshop"],
    desktopUI: {
      headline: "Luxury Streetwear Flagship E-Commerce Store",
      subline: "Engineered responsive shopping experience with streamlined frictionless checkout flows.",
      badge: "E-Commerce",
      stats: [
        { label: "Conversion Lift", val: "+25% Sales" },
        { label: "SEO Organic", val: "+40% Traffic" },
        { label: "Design", val: "Mobile-First" }
      ],
      features: [
        "Mobile-first responsive storefront tailored for high-ticket sneaker buyers in the UAE",
        "Streamlined 2-step checkout flow minimizing cart abandonment and drop-offs",
        "Advanced technical SEO schema markup driving search engine rankings"
      ]
    },
    mobileUI: {
      title: "Sneakers Dubai Mobile",
      subtitle: "Instant Cart & VIP Drops",
      actions: ["Shop Collection", "Express Checkout", "VIP Club"]
    }
  },
  "egyptair": {
    name: "EgyptAir Administrative Portal",
    category: "Corporate Hospitality Enterprise System",
    logo: "/assets/img/works/egyptair.png",
    url: "#",
    displayUrl: "Internal System",
    metrics: "45% Faster Workflows • 200+ Staff Evaluation • RBAC Security Matrix",
    tech: ["Laravel", "MySQL", "RBAC Matrices", "Document Lifecycle"],
    desktopUI: {
      headline: "Digitized Administrative Workflow for Air Hospitality",
      subline: "Enterprise staff evaluation system and digital document lifecycle tracking for 200+ crew members.",
      badge: "Internal Enterprise",
      stats: [
        { label: "Time Saved", val: "45% Reduction" },
        { label: "Staff", val: "200+ Members" },
        { label: "Security", val: "Role Matrices" }
      ],
      features: [
        "Automated digital evaluation pipelines replacing manual paper appraisal processes",
        "Granular role-based security access matrices for supervisors, managers, and staff",
        "Centralized audit logging and document lifecycle validation"
      ]
    },
    mobileUI: {
      title: "EgyptAir Staff Portal",
      subtitle: "Roster & Evaluation Access",
      actions: ["My Schedule", "Submit Log", "Profile"]
    }
  },
  "hypereg": {
    name: "Hyper EG & IA Pallet Logistics",
    category: "Retail E-Commerce & Industrial Logistics",
    url: "https://hyper-eg.com",
    displayUrl: "hyper-eg.com",
    metrics: "Real-time Cart Sync • Local Payment Routing • Supply Chain Engine",
    tech: ["Laravel", "Livewire", "Vue.js", "Payment Gateways", "Logistics"],
    desktopUI: {
      headline: "High-Volume Retail Platform & Logistics Dispatch Engine",
      subline: "Real-time cart synchronization paired with industrial supply chain dimension calculation portals.",
      badge: "Retail & Supply Chain",
      stats: [
        { label: "Routing", val: "Local Gateways" },
        { label: "Sync", val: "Real-Time Cart" },
        { label: "Industrial", val: "Logistics Engine" }
      ],
      features: [
        "Real-time cart and inventory synchronization preventing stock collisions during flash sales",
        "Local Egyptian payment gateway routing (e-wallets, cards, automated invoice generation)",
        "IA Pallet logistics dimension & freight weight calculator streamlining dispatch orders"
      ]
    },
    mobileUI: {
      title: "Hyper EG Mobile",
      subtitle: "Instant One-Tap Checkout",
      actions: ["Browse Deals", "Cart (3)", "Track Order"]
    }
  },
  "panoorama": {
    name: "Panoorama EG & The Baz Method",
    category: "Creative Media & Subscription SaaS",
    url: "https://panooramaeg.com",
    displayUrl: "panooramaeg.com",
    metrics: "CDN Video Streaming • Automated Monthly Stripe Subscriptions",
    tech: ["Laravel", "Stripe Subscriptions", "Video CDN", "Interactive APIs"],
    desktopUI: {
      headline: "High-End Multimedia Showcases & Automated Subscriptions",
      subline: "Video streaming CDN architecture integrated with automated monthly membership billing.",
      badge: "Media & EdTech",
      stats: [
        { label: "Streaming", val: "Optimized CDN" },
        { label: "Billing", val: "Stripe Recurring" },
        { label: "Media", val: "High-Bitrate" }
      ],
      features: [
        "Optimized video streaming delivery leveraging edge caching for instant playback",
        "Automated monthly Stripe recurring billing, invoice notifications, and tier upgrades",
        "Interactive web showcases with responsive animations and cross-device smoothness"
      ]
    },
    mobileUI: {
      title: "The Baz Method Mobile",
      subtitle: "Fitness Coaching & Workouts",
      actions: ["Start Workout", "Nutrition Log", "My Plan"]
    }
  },
  "elbayan": {
    name: "El Bayan Law Practice System",
    category: "Legal Practice Enterprise System",
    url: "https://elbayanlawfirm.info",
    displayUrl: "elbayanlawfirm.info",
    metrics: "Document Vault • Court Hearing Calendars • Case Billing Logs",
    tech: ["Laravel", "MySQL", "Document Vault", "Case Tracking"],
    desktopUI: {
      headline: "Comprehensive Legal Management & Client Vault System",
      subline: "Granular case tracking workflows, automated court deadline notifications, and secure legal vaults.",
      badge: "Legal Practice",
      stats: [
        { label: "Security", val: "Encrypted Vault" },
        { label: "Schedules", val: "Court Alerts" },
        { label: "Billing", val: "Granular Logs" }
      ],
      features: [
        "Centralized encrypted client document vault with permission-based viewing",
        "Automated court hearing schedules and procedural deadline push notifications",
        "Granular billable hours and case expense tracking for firm attorneys"
      ]
    },
    mobileUI: {
      title: "El Bayan Mobile",
      subtitle: "Lawyer Docket & Hearings",
      actions: ["Today's Hearings", "Case Files", "Client Vault"]
    }
  },
  "pes": {
    name: "PES Education & OSP Communities",
    category: "Loc Camp Ecosystem · Community & EdTech",
    logo: "/assets/img/works/loc-camp.jpg",
    url: "https://loc-camp.com",
    displayUrl: "loc-camp.com/pes",
    metrics: "Real-time Push Notifications • WebSockets • Member Directories",
    tech: ["Laravel", "WebSockets", "Pusher", "Livewire", "Nginx Cloud"],
    desktopUI: {
      headline: "Private Education Schools & Community Portals",
      subline: "Real-time notification pipelines for school administrations, parent portals, and localized communities.",
      badge: "EdTech & Communities",
      stats: [
        { label: "Broadcasting", val: "WebSockets" },
        { label: "Notifications", val: "Instant Push" },
        { label: "Architecture", val: "Livewire / Echo" }
      ],
      features: [
        "Bi-directional live event broadcasting with Laravel Echo and WebSockets",
        "School attendance tracking, student grading portals, and parent notification system",
        "Member directory management hosted on hardened Ubuntu / Nginx cloud instances"
      ]
    },
    mobileUI: {
      title: "PES Mobile Portal",
      subtitle: "Parent & Student Dashboard",
      actions: ["Attendance", "Live Grades", "Announcements"]
    }
  }
};

let currentModalProject = null;
let currentModalView = 'desktop'; // 'desktop' or 'mobile'

function openUIMediaModal(projectKey) {
  const data = projectMediaData[projectKey];
  if (!data) return;
  currentModalProject = projectKey;
  currentModalView = window.innerWidth < 768 ? 'mobile' : 'desktop';

  let modal = document.getElementById('ui-media-modal');
  if (!modal) {
    modal = createModalDOM();
    document.body.appendChild(modal);
  }

  updateModalContent(data);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();
}

function closeUIMediaModal() {
  const modal = document.getElementById('ui-media-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function switchModalView(view) {
  currentModalView = view;
  const desktopBtn = document.getElementById('modal-tab-desktop');
  const mobileBtn = document.getElementById('modal-tab-mobile');
  const desktopFrame = document.getElementById('modal-frame-desktop');
  const mobileFrame = document.getElementById('modal-frame-mobile');

  if (view === 'desktop') {
    desktopBtn.classList.add('active');
    mobileBtn.classList.remove('active');
    desktopFrame.style.display = 'block';
    mobileFrame.style.display = 'none';
  } else {
    desktopBtn.classList.remove('active');
    mobileBtn.classList.add('active');
    desktopFrame.style.display = 'none';
    mobileFrame.style.display = 'flex';
  }
}

function createModalDOM() {
  const wrap = document.createElement('div');
  wrap.id = 'ui-media-modal';
  wrap.className = 'ui-media-modal-backdrop';
  wrap.innerHTML = `
    <div class="ui-media-modal-container">
      <div class="ui-modal-header">
        <div class="ui-modal-brand-row">
          <div class="ui-modal-logo-wrap" id="modal-logo-wrap"></div>
          <div class="ui-modal-title-box">
            <span class="ui-modal-badge" id="modal-badge">SaaS Architecture</span>
            <h2 class="ui-modal-name" id="modal-title">Project Name</h2>
            <p class="ui-modal-metrics" id="modal-metrics">Key Architecture Highlights</p>
          </div>
        </div>
        <div class="ui-modal-controls">
          <div class="ui-modal-view-tabs">
            <button id="modal-tab-desktop" class="ui-tab-btn active" onclick="switchModalView('desktop')">
              <i data-lucide="monitor" size="14"></i> <span>Desktop UI</span>
            </button>
            <button id="modal-tab-mobile" class="ui-tab-btn" onclick="switchModalView('mobile')">
              <i data-lucide="smartphone" size="14"></i> <span>Mobile Media</span>
            </button>
          </div>
          <a id="modal-live-link" href="#" target="_blank" class="ui-live-btn" title="Open live production site">
            <span>Live Site</span> <i data-lucide="external-link" size="14"></i>
          </a>
          <button class="ui-close-btn" onclick="closeUIMediaModal()" aria-label="Close modal">
            <i data-lucide="x" size="20"></i>
          </button>
        </div>
      </div>

      <div class="ui-modal-body">
        <!-- Desktop Browser Device Frame -->
        <div class="device-frame-desktop" id="modal-frame-desktop">
          <div class="desktop-frame-bar">
            <div class="browser-dots">
              <span class="bdot bdot-red"></span>
              <span class="bdot bdot-yellow"></span>
              <span class="bdot bdot-green"></span>
            </div>
            <div class="browser-address-bar">
              <i data-lucide="lock" size="12"></i>
              <span id="modal-url-display">https://tog.sa</span>
            </div>
            <div class="browser-actions">
              <span class="live-indicator"><span class="live-dot"></span> Production</span>
            </div>
          </div>
          <div class="desktop-frame-screen" id="modal-desktop-screen">
            <!-- Dynamic UI Screen content -->
          </div>
        </div>

        <!-- Mobile Phone Device Frame -->
        <div class="device-frame-mobile" id="modal-frame-mobile" style="display: none;">
          <div class="phone-speaker">
            <span class="phone-dynamic-island"></span>
          </div>
          <div class="phone-screen" id="modal-mobile-screen">
            <!-- Dynamic Mobile Screen content -->
          </div>
          <div class="phone-home-indicator"></div>
        </div>
      </div>

      <div class="ui-modal-footer">
        <div class="ui-modal-tags" id="modal-tags">
          <!-- Tags -->
        </div>
        <div class="ui-modal-note">
          <i data-lucide="shield-check" size="14" class="text-accent"></i>
          <span>Engineered &amp; deployed by <strong>Eslam Abdelbasset</strong></span>
        </div>
      </div>
    </div>
  `;

  // Close on backdrop click
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) closeUIMediaModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeUIMediaModal();
  });

  return wrap;
}

function updateModalContent(data) {
  const logoWrap = document.getElementById('modal-logo-wrap');
  if (data.logo) {
    logoWrap.innerHTML = `<img src="${data.logo}" alt="${data.name}">`;
  } else {
    logoWrap.innerHTML = `<i data-lucide="cpu" size="22" class="text-accent"></i>`;
  }

  document.getElementById('modal-title').innerText = data.name;
  document.getElementById('modal-badge').innerText = data.category;
  document.getElementById('modal-metrics').innerText = data.metrics;
  document.getElementById('modal-url-display').innerText = data.displayUrl.startsWith('http') ? data.displayUrl : 'https://' + data.displayUrl;

  const liveLink = document.getElementById('modal-live-link');
  if (data.url && data.url !== '#') {
    liveLink.href = data.url;
    liveLink.style.display = 'inline-flex';
  } else {
    liveLink.style.display = 'none';
  }

  // Tags
  const tagsWrap = document.getElementById('modal-tags');
  tagsWrap.innerHTML = data.tech.map(t => `<span class="wtag">${t}</span>`).join('');

  // Desktop Screen Content
  const d = data.desktopUI;
  document.getElementById('modal-desktop-screen').innerHTML = `
    <div class="sim-ui-hero">
      <div class="sim-ui-header-row">
        <span class="sim-ui-pill">${d.badge}</span>
        <span class="sim-ui-latency"><i data-lucide="zap" size="12"></i> Latency: 42ms · TLS 1.3 · High Concurrency</span>
      </div>
      <h3 class="sim-ui-title">${d.headline}</h3>
      <p class="sim-ui-desc">${d.subline}</p>
      <div class="sim-ui-stats-grid">
        ${d.stats.map(s => `
          <div class="sim-stat-box">
            <span class="sim-stat-val">${s.val}</span>
            <span class="sim-stat-lbl">${s.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="sim-ui-panel">
      <h4 class="sim-panel-title"><i data-lucide="check-circle-2" size="16" class="text-accent"></i> Key Architectural Implementations:</h4>
      <ul class="sim-feature-list">
        ${d.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
    <div class="sim-ui-bottom-metrics">
      <div class="sim-metric-chip"><i data-lucide="database" size="13"></i> DB Latency: <strong>sub-15ms</strong></div>
      <div class="sim-metric-chip"><i data-lucide="shield-check" size="13"></i> Security: <strong>JWT / RBAC Protected</strong></div>
      <div class="sim-metric-chip"><i data-lucide="server" size="13"></i> Architecture: <strong>Microservices / Modular</strong></div>
    </div>
  `;

  // Mobile Screen Content
  const m = data.mobileUI;
  document.getElementById('modal-mobile-screen').innerHTML = `
    <div class="mob-sim-topbar">
      <span class="mob-time">09:41</span>
      <div class="mob-icons"><i data-lucide="wifi" size="12"></i> <i data-lucide="battery" size="12"></i></div>
    </div>
    <div class="mob-sim-body">
      <div class="mob-brand-header">
        ${data.logo ? `<img src="${data.logo}" alt="${data.name}" class="mob-brand-img">` : `<i data-lucide="smartphone" size="20" class="text-accent"></i>`}
        <div class="mob-brand-badge">${data.category}</div>
      </div>
      <h4 class="mob-title">${m.title}</h4>
      <p class="mob-sub">${m.subtitle}</p>
      <div class="mob-stats-card">
        <div style="display: flex; justify-content: space-around; align-items: center;">
          <div>
            <span class="mob-stat-kpi">99.98%</span>
            <span class="mob-stat-lbl">Mobile Uptime</span>
          </div>
          <div style="width: 1px; height: 28px; background: rgba(255,255,255,0.1);"></div>
          <div>
            <span class="mob-stat-kpi" style="color: #38bdf8;">&lt;50ms</span>
            <span class="mob-stat-lbl">API Latency</span>
          </div>
        </div>
      </div>
      <div class="mob-actions-list">
        ${m.actions.map(act => `
          <div class="mob-action-row">
            <span style="display: flex; align-items: center; gap: 0.45rem;"><i data-lucide="check" size="13" class="text-accent"></i> ${act}</span>
            <i data-lucide="chevron-right" size="14"></i>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="mob-sim-nav">
      <div class="mob-nav-item active"><i data-lucide="home" size="16"></i></div>
      <div class="mob-nav-item"><i data-lucide="layers" size="16"></i></div>
      <div class="mob-nav-item"><i data-lucide="activity" size="16"></i></div>
      <div class="mob-nav-item"><i data-lucide="user" size="16"></i></div>
    </div>
  `;

  switchModalView(currentModalView);
  if (window.lucide) lucide.createIcons();
}
