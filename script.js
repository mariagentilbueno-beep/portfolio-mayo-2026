// 1. DECLARAMOS LAS VARIABLES GLOBALES
let header, headerIndex, navToggle, navOverlay, heroContainer;
let scrollThreshold = 20; // Por defecto serán 20px (como en Simof y Projects)
let isPanarPage = false;  // Bandera para identificar si estamos en Panar
let isProjectsPage = false; // Bandera para identificar si estamos en Proyectos
let imageObserver = null;

// 2. LA FUNCIÓN MAESTRA: Se ejecuta en cada carga de página
function initAll() {
    header = document.querySelector('header');
    headerIndex = document.querySelector('.header-index');
    navToggle = document.getElementById('navToggle');
    navOverlay = document.getElementById('navOverlay');
    heroContainer = document.querySelector('.hero_container');

    // Comprobamos en qué página estamos a través de las clases del body
    isPanarPage = document.body.classList.contains('page-panar');
    isProjectsPage = document.body.classList.contains('body_projects');

    // Calculamos el límite del scroll correspondiente para esta página
    updateScrollThreshold();

    // CONFIGURACIÓN DEL SCROLL (Universal para todas las páginas)
    if (header) {
        window.removeEventListener('scroll', handleScroll);
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // CONFIGURACIÓN DEL RESIZE DE PANAR (Solo si es Panar y tiene Hero)
    if (isPanarPage && heroContainer) {
        window.removeEventListener('resize', updateScrollThreshold);
        window.addEventListener('resize', updateScrollThreshold);
    }

    // CONFIGURACIÓN DEL MENÚ HAMBURGUESA (Universal)
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

    // CONFIGURACIÓN DEL CARRUSEL (Solo si estamos en la página de Proyectos)
    if (isProjectsPage) {
        initCarousel();
    }

    // ANIMACIÓN DE LAS IMÁGENES REVEAL (Universal)
    initImageReveal();
}

// 3. FUNCIONES DE SOPORTE

function updateScrollThreshold() {
    if (isPanarPage && heroContainer && header) {
        // Regla para Panar: Medición dinámica de la foto de fondo
        scrollThreshold = heroContainer.offsetHeight - header.offsetHeight;
    } else {
        // Regla para Simof, Proyectos y el resto de páginas: 20px fijos
        scrollThreshold = 20;
    }
}

function handleScroll() {
    if (!header) return;

    // Si el menú móvil está abierto, pausamos los efectos del scroll de fondo
    if (navOverlay && navOverlay.classList.contains('is-open')) return;

    const hasPassedThreshold = window.scrollY > scrollThreshold;

    // Aplica el blur/scroll tanto a Simof, Proyectos y Panar cuando superan sus límites
    header.classList.toggle('header--scrolled', hasPassedThreshold);

    // El color verde SOLO afecta a la página de Panar
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

// ── LÓGICA DEL CARRUSEL ENCAPSULADA ──
function initCarousel() {
    const track = document.getElementById('projects-track');
    const container = document.getElementById('carousel-container');
    if (!track || !container) return;

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (!isDesktop) return;

    // Control para evitar que se duplique el HTML si volvemos atrás en el navegador
    if (track.dataset.carouselReady === "true") return;
    track.dataset.carouselReady = "true";

    // 1. Duplicamos los items para el bucle infinito
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
        const gap = window.innerWidth * 0.12; // gap (12vw)
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

    // Eventos de pausa (Hover)
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => { isPaused = true; });
        card.addEventListener('mouseleave', () => { isPaused = false; });
    });

    // Rueda del ratón
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        pos += e.deltaY * 0.6;
        if (pos >= totalWidth) pos -= totalWidth;
        if (pos < 0) pos += totalWidth;
    }, { passive: false });

    // Arrastrar con ratón
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

    // Eventos Touch (Móvil/Tablet por si acaso)
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

    // Aseguramos el cálculo correcto esperando a que todo cargue si es necesario
    if (document.readyState === 'complete') {
        calcWidths();
        animate();
    } else {
        window.addEventListener('load', () => {
            calcWidths();
            animate();
        });
    }

    // Evento resize dentro del contexto del carrusel
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

// 4. DISPARADOR GLOBAL
window.addEventListener("pageshow", initAll);