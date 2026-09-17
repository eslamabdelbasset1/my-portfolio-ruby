// Projects slider functionality
class ProjectSlider {
  constructor() {
    this.autoPlayIntervals = [];
  }

  // Function to create a project card HTML
  createProjectCard(project) {
    const bg = project.bg || '';
    return `
      <a href="${project.url}" target="_blank" class="project-card">
        <img
          src="${project.image}"
          alt="${project.name}"
          class="project-favicon"
          style="${bg ? `background:${bg}` : ''}"
          onerror="this.onerror=null;this.src='https://icons.duckduckgo.com/ip3/${project.domain}.ico'"
        />
        <div class="project-info">
          <span class="project-name">${project.name}</span>
          <span class="project-url">${project.displayUrl}</span>
        </div>
        <svg class="external-link-icon" viewBox="0 0 24 24">
          <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
        </svg>
      </a>
    `;
  }

  // Function to split projects into two rows
  splitProjectsIntoRows() {
    const midPoint = Math.ceil(projects.length / 2);
    return {
      row1: projects.slice(0, midPoint),
      row2: projects.slice(midPoint)
    };
  }

  // Function to render projects in sliders
  renderProjectSliders() {
    const track1 = document.getElementById("projects-track-1");
    const track2 = document.getElementById("projects-track-2");
    
    if (track1 && track2) {
      const { row1, row2 } = this.splitProjectsIntoRows();
      
      // Clear existing content
      track1.innerHTML = "";
      track2.innerHTML = "";

      // Generate first row
      row1.forEach(project => {
        track1.innerHTML += this.createProjectCard(project);
      });

      // Generate second row
      row2.forEach(project => {
        track2.innerHTML += this.createProjectCard(project);
      });
    }
  }

  // Drag functionality for sliders
  initializeDragSliders() {
    const sliders = document.querySelectorAll('.projects-slider');
    
    sliders.forEach(slider => {
      const track = slider.querySelector('.projects-track');
      let isDown = false;
      let startX;
      let scrollLeft;
      let hasMoved = false;

      // Mouse events
      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        hasMoved = false;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        slider.style.cursor = 'grabbing';
        
        // Prevent text selection during drag
        e.preventDefault();
      });

      slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
        slider.style.cursor = 'grab';
      });

      slider.addEventListener('mouseup', (e) => {
        isDown = false;
        slider.classList.remove('active');
        slider.style.cursor = 'grab';
        
        // If we didn't move much, allow the link click
        if (!hasMoved) {
          // Find if we clicked on a project card link
          const projectCard = e.target.closest('.project-card');
          if (projectCard && projectCard.href) {
            // Small delay to ensure drag state is cleared
            setTimeout(() => {
              window.open(projectCard.href, '_blank');
            }, 10);
          }
        }
      });

      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        
        // If we've moved more than 5 pixels, consider it a drag
        if (Math.abs(walk) > 5) {
          hasMoved = true;
        }
        
        slider.scrollLeft = scrollLeft - walk;
      });

      // Touch events for mobile
      slider.addEventListener('touchstart', (e) => {
        isDown = true;
        hasMoved = false;
        startX = e.touches[0].pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });

      slider.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const x = e.touches[0].pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        
        // If we've moved more than 5 pixels, consider it a drag
        if (Math.abs(walk) > 5) {
          hasMoved = true;
        }
        
        slider.scrollLeft = scrollLeft - walk;
      });

      slider.addEventListener('touchend', (e) => {
        isDown = false;
        
        // If we didn't move much, allow the link click
        if (!hasMoved) {
          const projectCard = e.target.closest('.project-card');
          if (projectCard && projectCard.href) {
            setTimeout(() => {
              window.open(projectCard.href, '_blank');
            }, 10);
          }
        }
      });

      // Prevent default link behavior during potential drag
      slider.addEventListener('click', (e) => {
        if (hasMoved) {
          e.preventDefault();
          e.stopPropagation();
        }
      });

      // Set initial cursor
      slider.style.cursor = 'grab';
    });
  }

  // Auto-play functionality for sliders
  initializeAutoPlay() {
    const sliders = document.querySelectorAll('.projects-slider');
    
    sliders.forEach((slider, index) => {
      let isUserInteracting = false;
      // Row 0 → left, Row 1 → right (opposite directions)
      let autoPlayDirection = index === 0 ? 1 : -1;

      // Row 1 starts scrolled to the end so it travels right→left
      if (index === 1) {
        requestAnimationFrame(() => {
          const track = slider.querySelector('.projects-track');
          slider.scrollLeft = track ? track.scrollWidth : 0;
        });
      }

      // Auto-play function
      const autoPlay = () => {
        if (isUserInteracting) return;

        const track = slider.querySelector('.projects-track');
        const maxScroll = track.scrollWidth - slider.clientWidth;
        const scrollStep = 1; // Pixels to scroll per frame

        // Bounce at boundaries
        if (slider.scrollLeft >= maxScroll - 10) {
          autoPlayDirection = -1;
        } else if (slider.scrollLeft <= 10) {
          autoPlayDirection = 1;
        }

        // Scroll the slider
        slider.scrollLeft += scrollStep * autoPlayDirection;
      };

      // Slightly different speeds for each row
      const speed = index === 0 ? 28 : 35;
      const intervalId = setInterval(autoPlay, speed);
      this.autoPlayIntervals.push(intervalId);
      
      // Pause auto-play on user interaction
      slider.addEventListener('mouseenter', () => {
        isUserInteracting = true;
      });
      
      slider.addEventListener('mouseleave', () => {
        setTimeout(() => {
          isUserInteracting = false;
        }, 250); // Resume after 0.25 seconds
      });
      
      // Pause on touch/drag
      slider.addEventListener('mousedown', () => {
        isUserInteracting = true;
      });
      
      slider.addEventListener('touchstart', () => {
        isUserInteracting = true;
      });
      
      // Resume after user stops interacting
      slider.addEventListener('mouseup', () => {
        setTimeout(() => {
          isUserInteracting = false;
        }, 500); // Resume after 0.5 seconds
      });
      
      slider.addEventListener('touchend', () => {
        setTimeout(() => {
          isUserInteracting = false;
        }, 500); // Resume after 0.5 seconds
      });
    });
    
    // Clean up intervals when page unloads
    window.addEventListener('beforeunload', () => {
      this.autoPlayIntervals.forEach(interval => clearInterval(interval));
    });
  }

  renderCompanies() {
    const grid = document.getElementById('companies-grid');
    if (!grid) return;
    grid.replaceChildren();
    projects.forEach(project => {
      const card = document.createElement('a');
      card.className = 'company-card';
      card.href = project.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.title = `${project.name} — ${project.displayUrl}`;
      const logo = document.createElement('span');
      logo.className = 'company-logo';
      if (project.bg) logo.style.background = project.bg;
      logo.setAttribute('aria-hidden', 'true');
      const showFallback = () => {
        logo.classList.add('company-logo--fallback');
        logo.style.background = '';
        const initials = document.createElement('span');
        initials.className = 'company-initials';
        initials.textContent = project.name.split(/[^a-z0-9]+/i).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
        logo.replaceChildren(initials);
      };
      if (project.image) {
        const img = document.createElement('img');
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', showFallback, { once: true });
        img.src = project.image;
        logo.append(img);
      } else {
        showFallback();
      }
      const name = document.createElement('span');
      name.className = 'company-name';
      name.textContent = project.name;
      if (project.detail) {
        const detail = document.createElement('span');
        detail.className = 'company-detail';
        detail.textContent = project.detail;
        name.append(detail);
      }
      const arrow = document.createElement('span');
      arrow.className = 'company-arrow';
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      card.append(logo, name, arrow);
      grid.append(card);
    });
    const count = document.querySelector('.companies-count');
    if (count) count.textContent = `${projects.length} companies & platforms`;
  }

  // Initialize all slider/orbit functionality
  init() {
    if (document.getElementById('companies-grid')) {
      this.renderCompanies();
    } else {
      this.renderProjectSliders();
      this.initializeDragSliders();
      this.initializeAutoPlay();
    }
  }
}

// Create global instance
const projectSlider = new ProjectSlider();
