// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
}

// Header scroll effect
const header = document.querySelector('.header');
const hero = document.querySelector('.hero');

// Smooth scroll for anchor links (with fixed header offset)
document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    const headerHeight = header?.offsetHeight ?? 0;
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
});

// Contact Form Handler
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: formData.get('message')
        };

        // Here you would typically send the data to a server
        // For now, we'll just show a success message
        showFormMessage('Vielen Dank! Ihre Nachricht wurde gesendet. Wir werden uns in Kürze bei Ihnen melden.', 'success');

        // Reset form
        contactForm.reset();
    });
}

// Show form message
function showFormMessage(message, type) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        font-weight: 500;
        background-color: ${type === 'success' ? 'rgba(212, 175, 55, 0.2)' : '#fee2e2'};
        color: ${type === 'success' ? '#d4af37' : '#991b1b'};
        border: 2px solid ${type === 'success' ? '#d4af37' : '#ef4444'};
    `;

    // Insert message before form
    contactForm.insertBefore(messageEl, contactForm.firstChild);

    // Remove message after 5 seconds
    setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transition = 'opacity 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
    }, 5000);
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

function initFooterServicesLinks() {
    const footerList = document.getElementById('footerServicesList');
    const sourceLinks = document.querySelectorAll('.services-list a.services-list-link');

    if (!footerList || sourceLinks.length === 0) return;

    footerList.innerHTML = '';
    sourceLinks.forEach(source => {
        const titleEl = source.querySelector('.services-list-title');
        const label = (titleEl?.textContent || '').trim();
        if (!label) return;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = source.getAttribute('href') || '#services';
        a.textContent = label;
        li.appendChild(a);
        footerList.appendChild(li);
    });
}

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    initFooterServicesLinks();

    const animateElements = document.querySelectorAll(
        '.services-list-item, .about-bridge, .process-step, .service-block, .about-card, .contact-card, .contact-form-wrapper, .callout'
    );
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Active nav link highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function highlightActiveSection(scrollY) {
    if (!sections.length || !navLinks.length) return;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

function setHeaderScrolled(scrollY) {
    if (!header) return;
    if (scrollY > 100) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
}

function applyHeroParallax(scrollY) {
    if (!hero) return;
    if (scrollY < window.innerHeight) {
        hero.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
}

function onScroll() {
    const scrollY = window.pageYOffset;
    setHeaderScrolled(scrollY);
    highlightActiveSection(scrollY);
    applyHeroParallax(scrollY);
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('load', onScroll);

// Lazy loading for images (if you add real images later)
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

console.log('[Firmenname] - Hausmeisterservice & Gebäudeservice - Website erfolgreich geladen!');

