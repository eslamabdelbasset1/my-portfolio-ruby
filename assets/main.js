// Main application initialization
document.addEventListener("DOMContentLoaded", function () {
  // Initialize project sliders
  projectSlider.init();

  // Mobile Navigation Sidebar
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navOverlay = document.getElementById('nav-overlay');
  
  if (navToggle && navMenu) {
    function toggleMenu() {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      if (navOverlay) navOverlay.classList.toggle('active');
      // Prevent body scrolling when menu is open
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    }

    navToggle.addEventListener('click', toggleMenu);
    
    if (navOverlay) {
      navOverlay.addEventListener('click', toggleMenu);
    }

    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
          toggleMenu();
        }
      });
    });
  }

});
