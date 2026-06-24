let header, headerIndex, navToggle, navOverlay, heroContainer;
let scrollThreshold = 20;
let isPanarPage = false;
let isProjectsPage = false;
let imageObserver = null;

function initAll() {
    header = document.querySelector('header');
    headerIndex = document.querySelector('.header-index');
    navToggle = document.getElementById('navToggle');
    navOverlay = document.getElementById('navOverlay');
    heroContainer = document.querySelector('.hero_container');


    isPanarPage = document.body.classList.contains('page-panar');
    isProjectsPage = document.body.classList.contains('body_projects');


    updateScrollThreshold();


    if (header) {
        window.removeEventListener('scroll', handleScroll);
        window.addEventListener('scroll', handleScroll, { passive: true });
    }


    if (isPanarPage && heroContainer) {
        window.removeEventListener('resize', updateScrollThreshold);
        window.addEventListener('resize', updateScrollThreshold);
    }


    if (navToggle && navOverlay) {
        navToggle.removeEventListener('click', toggleMenu);
        navToggle.addEventListener('click', toggleMenu);

        document.removeEventListener('click', handleOutsideClick);
        document.addEventListener('click', handleOutsideClick);

        navOverlay.querySelectorAll('a').forEach(link => {
            link.removeEventListener('click', closeMenu);
            link.addEventListener('click', closeMenu);
        });
    }


    if (isProjectsPage) {
        initCarousel();
    }


    initImageReveal();
}


function updateScrollThreshold() {
    if (isPanarPage && heroContainer && header) {

        scrollThreshold = heroContainer.offsetHeight - header.offsetHeight;
    } else {

        scrollThreshold = 20;
    }
}

function handleScroll() {
    if (!header) return;


    if (navOverlay && navOverlay.classList.contains('is-open')) return;

    const hasPassedThreshold = window.scrollY > scrollThreshold;


    header.classList.toggle('header--scrolled', hasPassedThreshold);


    if (isPanarPage && headerIndex) {
        headerIndex.classList.toggle('bg-color-green', !hasPassedThreshold);
    }
}

function handleOutsideClick(e) {
    if (navOverlay && navOverlay.classList.contains('is-open') &&
        !navOverlay.contains(e.target) &&
        !navToggle.contains(e.target)) {
        closeMenu();
    }
}

function toggleMenu() {
    if (!navOverlay || !navToggle || !header) return;
    const isOpen = navOverlay.classList.contains('is-open');

    if (isOpen) {
        closeMenu();
    } else {
        navOverlay.classList.add('is-open');
        navToggle.classList.add('is-active');
        navToggle.setAttribute('aria-expanded', 'true');
        header.classList.remove('header--scrolled');

        if (isPanarPage && headerIndex) {
            headerIndex.classList.add('bg-color-green');
        }
    }
}

function closeMenu() {
    if (!navOverlay || !navToggle || !header) return;
    navOverlay.classList.remove('is-open');
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');

    const hasPassedThreshold = window.scrollY > scrollThreshold;

    if (hasPassedThreshold) {
        header.classList.add('header--scrolled');
        if (isPanarPage && headerIndex) {
            headerIndex.classList.remove('bg-color-green');
        }
    } else {
        header.classList.remove('header--scrolled');
        if (isPanarPage && headerIndex) {
            headerIndex.classList.add('bg-color-green');
        }
    }
}

function initCarousel() {
    const track = document.getElementById('projects-track');
    const container = document.getElementById('carousel-container');
    if (!track || !container) return;

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (!isDesktop) return;


    if (track.dataset.carouselReady === "true") return;
    track.dataset.carouselReady = "true";


    track.innerHTML += track.innerHTML;
    const cards = track.querySelectorAll('.project-card');

    let itemWidth = 0;
    let totalWidth = 0;
    let pos = 0;
    const speed = 0.5;
    let isDragging = false;
    let isPaused = false;
    let startX = 0;
    let startPos = 0;
    let animFrameId = null;
    let clickable = true;

    function calcWidths() {
        track.style.transform = 'none';
        const firstCard = track.querySelector('.project-card');
        if (!firstCard) return;
        const gap = window.innerWidth * 0.12;
        itemWidth = firstCard.offsetWidth + gap;
        totalWidth = itemWidth * (cards.length / 2);
    }

    function animate() {
        if (!isDragging && !isPaused) {
            pos += speed;
            if (pos >= totalWidth) pos -= totalWidth;
        }
        track.style.transform = `translateX(-${pos}px)`;
        animFrameId = requestAnimationFrame(animate);
    }


    cards.forEach(card => {
        card.addEventListener('mouseenter', () => { isPaused = true; });
        card.addEventListener('mouseleave', () => { isPaused = false; });
    });


    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        pos += e.deltaY * 0.6;
        if (pos >= totalWidth) pos -= totalWidth;
        if (pos < 0) pos += totalWidth;
    }, { passive: false });


    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        clickable = true;
        startX = e.clientX;
        startPos = pos;
        container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const diff = startX - e.clientX;
        if (Math.abs(diff) > 5) clickable = false;
        pos = startPos + diff;
        if (pos >= totalWidth) pos -= totalWidth;
        if (pos < 0) pos += totalWidth;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });

    track.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!clickable) e.preventDefault();
        });
    });


    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        startPos = pos;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const diff = startX - e.touches[0].clientX;
        pos = startPos + diff;
        if (pos >= totalWidth) pos -= totalWidth;
        if (pos < 0) pos += totalWidth;
    }, { passive: true });

    container.addEventListener('touchend', () => { isDragging = false; });


    if (document.readyState === 'complete') {
        calcWidths();
        animate();
    } else {
        window.addEventListener('load', () => {
            calcWidths();
            animate();
        });
    }


    window.addEventListener('resize', () => {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        calcWidths();
        if (pos >= totalWidth) pos = pos % totalWidth;
        animate();
    });
}

function initImageReveal() {
    const images = document.querySelectorAll('.reveal-img');
    if (images.length === 0) return;

    if (imageObserver) {
        imageObserver.disconnect();
    }

    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.15
    };

    imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                }, index * 100);
                imageObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    images.forEach(img => {
        if (!img.classList.contains('is-visible')) {
            imageObserver.observe(img);
        }
    });
}

window.addEventListener("pageshow", initAll);


/* =====================================================
   LANGUAGE TOGGLE
   ===================================================== */

(function initLang() {
    // Detectar idioma guardado o usar inglés por defecto
    const savedLang = localStorage.getItem('mg-lang') || 'en';

    function applyLang(lang) {
        localStorage.setItem('mg-lang', lang);
        const label = document.getElementById('langLabel');
        if (label) label.textContent = lang === 'en' ? 'ES' : 'EN';

        // Redirigir si es necesario
        const currentPath = window.location.pathname;
        const isInEs = currentPath.startsWith('/es/') || currentPath.includes('/es/');

        if (lang === 'es' && !isInEs) {
            // Construir la URL equivalente en español
            const esPath = '/es' + currentPath;
            window.location.href = esPath;
        } else if (lang === 'en' && isInEs) {
            // Volver a la versión inglesa
            const enPath = currentPath.replace(/^\/es/, '');
            window.location.href = enPath || '/';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const btn = document.getElementById('langToggle');
        if (!btn) return;

        // Mostrar idioma opuesto al actual (botón muestra a qué idioma cambiar)
        const currentLang = localStorage.getItem('mg-lang') || 'en';
        const label = document.getElementById('langLabel');
        if (label) label.textContent = currentLang === 'en' ? 'ES' : 'EN';

        btn.addEventListener('click', function () {
            const current = localStorage.getItem('mg-lang') || 'en';
            const next = current === 'en' ? 'es' : 'en';
            applyLang(next);
        });
    });
})();


/* =====================================================
   MOBILE: activación secuencial de tarjetas de proyectos
   ===================================================== */

function initMobileProjectCards() {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;

    const cards = document.querySelectorAll('.project-card--mobile-anim');
    if (cards.length === 0) return;

    // Activar cada tarjeta secuencialmente para el efecto de disco + giro
    // La tarjeta "activa" tiene la caratula abierta y el disco girando
    const interval = 2800; // ms entre activaciones

    let currentIndex = 0;

    function activateCard(index) {
        cards.forEach(c => c.classList.remove('is-active'));
        if (cards[index]) {
            cards[index].classList.add('is-active');
        }
    }

    // Empezar después de que las animaciones de entrada terminen
    setTimeout(() => {
        activateCard(0);
        setInterval(() => {
            currentIndex = (currentIndex + 1) % cards.length;
            activateCard(currentIndex);
        }, interval);
    }, 1800);
}

document.addEventListener('DOMContentLoaded', initMobileProjectCards);