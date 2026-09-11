// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navOverlay = document.getElementById('nav-overlay');
    
    if (navToggle && navMenu) {
        const setMenuOpen = function(isOpen) {
            navToggle.classList.toggle('active', isOpen);
            navMenu.classList.toggle('active', isOpen);
            if (navOverlay) navOverlay.classList.toggle('active', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        navToggle.addEventListener('click', function() {
            setMenuOpen(!navMenu.classList.contains('active'));
        });

        if (navOverlay) {
            navOverlay.addEventListener('click', function() {
                setMenuOpen(false);
            });
        }
        
        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                setMenuOpen(false);
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isNavClick = navToggle.contains(event.target) || navMenu.contains(event.target);
            if (!isNavClick && navMenu.classList.contains('active')) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                setMenuOpen(false);
                navToggle.focus();
            }
        });

        window.addEventListener('resize', function() {
            if (window.innerWidth > 1024 && navMenu.classList.contains('active')) {
                setMenuOpen(false);
            }
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar height
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
});
