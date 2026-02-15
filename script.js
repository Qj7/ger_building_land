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

// Contact Form — speichert Anfragen in Supabase oder localStorage
const STORAGE_REQUESTS = 'admin_requests';
const contactForm = document.getElementById('contactForm');

function getUrlParams() {
    const s = (window.location.search || '').slice(1);
    const out = {};
    s.split('&').forEach(pair => {
        const [k, v] = pair.split('=').map(decodeURIComponent);
        if (k && v != null) out[k] = v;
    });
    return out;
}

function getSupabase() {
    return window.supabase || null;
}

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const params = getUrlParams();
        const data = {
            name: (formData.get('name') || '').trim(),
            email: (formData.get('email') || '').trim(),
            phone: (formData.get('phone') || '').trim(),
            message: (formData.get('message') || '').trim(),
            date: params.date || null,
            slots: params.slots ? params.slots.split(',') : null
        };

        const sb = getSupabase();
        if (sb) {
            try {
                await sb.from('requests').insert({
                    type: 'contact',
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    message: data.message,
                    date: data.date,
                    slots: data.slots
                });
            } catch (_) {}
        } else {
            try {
                const raw = localStorage.getItem(STORAGE_REQUESTS);
                const list = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(list)) list = [];
                list.push({
                    id: 'req-' + Date.now(),
                    type: 'contact',
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    message: data.message,
                    date: data.date,
                    slots: data.slots,
                    createdAt: new Date().toISOString(),
                    processed: false
                });
                localStorage.setItem(STORAGE_REQUESTS, JSON.stringify(list));
            } catch (_) {}
        }

        showFormMessage('Vielen Dank! Ihre Nachricht wurde gesendet. Wir werden uns in Kürze bei Ihnen melden.', 'success');
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

// Cookie-Einwilligung (DSGVO / TMG § 15 / BDSG konform)
const COOKIE_CONSENT_KEY = 'cookie_consent_v1';

function getCookieConsent() {
    try {
        const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data && typeof data.necessary === 'boolean') {
            return {
                necessary: true,
                statistics: !!data.statistics,
                marketing: !!data.marketing,
                timestamp: data.timestamp || null
            };
        }
    } catch (_) {}
    return null;
}

function setCookieConsent(consent) {
    const payload = {
        necessary: true,
        statistics: !!consent.statistics,
        marketing: !!consent.marketing,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
    if (typeof window.onCookieConsentUpdate === 'function') {
        window.onCookieConsentUpdate(payload);
    }
}

function showCookieBanner(show) {
    const banner = document.getElementById('cookieBanner');
    if (!banner) return;
    if (show) {
        banner.removeAttribute('hidden');
    } else {
        banner.setAttribute('hidden', '');
    }
}

function showCookieModal(show) {
    const modal = document.getElementById('cookieSettingsModal');
    if (!modal) return;
    if (show) {
        modal.removeAttribute('hidden');
        const stats = document.getElementById('cookieStatistics');
        const marketing = document.getElementById('cookieMarketing');
        const consent = getCookieConsent();
        if (stats) stats.checked = consent ? consent.statistics : false;
        if (marketing) marketing.checked = consent ? consent.marketing : false;
    } else {
        modal.setAttribute('hidden', '');
    }
}

function saveCookieSettingsFromModal() {
    const stats = document.getElementById('cookieStatistics');
    const marketing = document.getElementById('cookieMarketing');
    setCookieConsent({
        necessary: true,
        statistics: stats ? stats.checked : false,
        marketing: marketing ? marketing.checked : false
    });
    showCookieBanner(false);
    showCookieModal(false);
}

function initCookieConsent() {
    const consent = getCookieConsent();
    const banner = document.getElementById('cookieBanner');
    if (!consent && banner) {
        showCookieBanner(true);
    }

    const openSettings = () => {
        showCookieModal(true);
    };

    const closeModal = () => {
        showCookieModal(false);
    };

    document.getElementById('cookieAcceptAll')?.addEventListener('click', () => {
        setCookieConsent({ necessary: true, statistics: true, marketing: true });
        showCookieBanner(false);
    });

    document.getElementById('cookieAcceptNecessary')?.addEventListener('click', () => {
        setCookieConsent({ necessary: true, statistics: false, marketing: false });
        showCookieBanner(false);
    });

    document.getElementById('cookieOpenSettings')?.addEventListener('click', (e) => {
        e.preventDefault();
        openSettings();
    });

    document.getElementById('cookieBannerOpenSettings')?.addEventListener('click', (e) => {
        e.preventDefault();
        openSettings();
    });

    document.getElementById('openCookieSettings')?.addEventListener('click', (e) => {
        e.preventDefault();
        openSettings();
    });

    document.getElementById('cookieSaveSettings')?.addEventListener('click', () => {
        saveCookieSettingsFromModal();
    });

    document.getElementById('cookieAcceptAllModal')?.addEventListener('click', () => {
        setCookieConsent({ necessary: true, statistics: true, marketing: true });
        showCookieBanner(false);
        showCookieModal(false);
    });

    document.getElementById('cookieModalClose')?.addEventListener('click', closeModal);
    document.getElementById('cookieModalBackdrop')?.addEventListener('click', closeModal);
}

document.addEventListener('DOMContentLoaded', initCookieConsent);

console.log('IC Immobilien Service GmbH - Hausmeisterservice & Gebäudeservice - Website erfolgreich geladen!');

