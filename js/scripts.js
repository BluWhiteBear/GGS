/****************************
 * CACHE MANAGEMENT
 ****************************/
const pageCache = new Map();
const head = document.head;
const storage = window.sessionStorage;

async function refreshCache(url) {
    try {
        const startTime = performance.now();
        const response = await fetch(url, {
            priority: 'high',
            cache: 'no-cache'
        });
        const html = await response.text();
        
        const compressed = btoa(html);
        sessionStorage.setItem(url, compressed);
        sessionStorage.setItem(`${url}_timestamp`, Date.now());
        
        performance.mark(`cache-refresh-${url}`);
        console.debug(`Cache refresh took ${performance.now() - startTime}ms`);
    } catch (error) {
        console.error('Error refreshing cache:', error);
    }
}

/****************************
 * COMPONENT LOADING
 ****************************/
function loadHTML(elementId, file) {
    fetch(file)
        .then(response => response.text())
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
            if (file === 'navbar.html') {
                initializeThemeToggles();
            }
        });
}

async function fetchAndCache(url, elementId) {
    try {
        const response = await fetch(url, { priority: 'high', cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const content = await response.text();
        storage.setItem(url, btoa(content));
        storage.setItem(`${url}_timestamp`, Date.now().toString());

        const targetElement = document.getElementById(elementId);
        if (targetElement) {
            targetElement.innerHTML = content;
            if (elementId === 'navbar-placeholder') {
                initializeThemeToggles();
            }
        }

        requestIdleCallback(() => updateActiveNavLink());
    } catch (error) {
        console.error('Error fetching content:', error);
        const targetElement = document.getElementById(elementId);
        if (targetElement) {
            targetElement.innerHTML = '<p>Error loading content. Please try again later.</p>';
        }
    }
}

/****************************
 * THEME MANAGEMENT
 ****************************/
const themes = {
    light: {
        background: '#ffffff',
        text: '#1a1a1a',
        iconColor: '#ffc107'
    },
    dark: {
        background: '#1a1a1a',
        text: '#ffffff',
        iconColor: '#f8f9fa'
    }
};

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = themes[theme].background;
    document.body.style.color = themes[theme].text;
    
    // Update toggle checkbox states
    const desktopToggle = document.querySelector('#theme-toggle-desktop');
    const mobileToggle = document.querySelector('#theme-toggle-mobile');
    [desktopToggle, mobileToggle].forEach(toggle => {
        if (toggle) {
            toggle.checked = theme === 'dark';
        }
    });

    const isDark = theme === 'dark';
    updateThemeIcons(isDark);
}

function updateThemeIcons(isDark) {
    const desktopToggle = document.querySelector('#theme-toggle-desktop');
    const mobileToggle = document.querySelector('#theme-toggle-mobile');
    
    [desktopToggle, mobileToggle].forEach(toggle => {
        if (!toggle) return;
        
        const icon = toggle.nextElementSibling;
        if (icon) {
            icon.classList.remove('fa-sun', 'fa-moon');
            icon.classList.add(isDark ? 'fa-moon' : 'fa-sun');
        }
        
        toggle.checked = isDark;
    });
}

/****************************
 * NAVIGATION
 ****************************/
function updateActiveNavLink() {
    /****************************
     * PATH NORMALIZATION
     ****************************/
    // Extract and normalize current page path
    let currentPath = window.location.pathname;
    console.debug('[Nav] Raw path:', currentPath);

    // Normalize homepage path
    const isHomePage = currentPath === '/' || currentPath === '' || currentPath.endsWith('/index.html');
    currentPath = isHomePage ? '/' : currentPath.replace(/^\//, '').toLowerCase();
    console.debug('[Nav] Normalized path:', currentPath, 'Is homepage:', isHomePage);

    /****************************
     * RESET NAVIGATION STATE
     ****************************/
    // Remove all active states from navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    });

    /****************************
     * LINK MATCHING LOGIC
     ****************************/
    let activeLinkFound = false;

    // Check each navigation link for matches
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        console.debug(`[Nav] Checking link: "${href}" against path: "${currentPath}"`);

        // Homepage matching logic
        const isHomeLink = href === '/' || href === './' || href === '' || href === 'index.html';
        if ((isHomePage && isHomeLink) || (!isHomePage && href === currentPath)) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
            activeLinkFound = true;
            console.debug('[Nav] Active link found:', href);
        }
    });

    /****************************
     * SUB-PAGE HANDLING
     ****************************/
    // If no direct match found, check for sub-pages
    if (!activeLinkFound) {
        // Map of sub-page prefixes to their parent pages
        const prefixMap = {
            'blog_': 'blog.html',
            'help_': 'help.html'
        };

        // Check if current path matches any sub-page prefix
        for (const [prefix, parentPath] of Object.entries(prefixMap)) {
            if (currentPath.startsWith(prefix)) {
                // Activate parent page link
                document.querySelectorAll(`.nav-link[href="${parentPath}"]`)
                    .forEach(link => {
                        link.classList.add('active');
                        link.setAttribute('aria-current', 'page');
                        activeLinkFound = true;
                    });
                break;
            }
        }
    }

    /****************************
     * FALLBACK LOGIC
     ****************************/
    if (!activeLinkFound) {
        console.warn('[Nav] No active link matched. Falling back to highlight "Home".');
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            if (href === '/' || href === '' || href === 'index.html') {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
                console.debug('[Nav] Highlighted fallback "Home" link:', href);
            }
        });
    }
}



/****************************
 * INITIALIZATION FUNCTIONS
 ****************************/
function initializeThemeToggles() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const desktopToggle = document.querySelector('#theme-toggle-desktop');
    const mobileToggle = document.querySelector('#theme-toggle-mobile');
    
    const toggleTheme = (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        setTheme(newTheme);
        
        // Sync other toggle
        const otherToggle = e.target.id === 'theme-toggle-desktop' ? mobileToggle : desktopToggle;
        if (otherToggle) {
            otherToggle.checked = e.target.checked;
        }
    };

    [desktopToggle, mobileToggle].forEach(toggle => {
        if (toggle) {
            toggle.checked = currentTheme === 'dark';
            toggle.removeEventListener('click', toggleTheme); // Remove old listener
            toggle.addEventListener('change', toggleTheme); // Use change event instead
        }
    });

    setTheme(currentTheme);
}

function initializeCollapseButtons() {
    document.querySelectorAll('[data-bs-toggle="collapse"]').forEach(button => {
        const target = document.querySelector(button.getAttribute('data-bs-target'));
        
        target.addEventListener('show.bs.collapse', () => button.textContent = 'Show Less');
        target.addEventListener('hide.bs.collapse', () => button.textContent = 'Show More');
    });
}

function loadComponents() {
    loadHTML("navbar-placeholder", "navbar.html");
    loadHTML("socials-placeholder", "socials.html");
    loadHTML("footer-placeholder", "footer.html");
}

function updateNavBarLinkState() {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    updateActiveNavLink();
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(navbarPlaceholder, { childList: true });
    } else {
        updateActiveNavLink();
    }
}

/****************************
 * STARTUP
 ****************************/
document.addEventListener("DOMContentLoaded", () => {
    updateNavBarLinkState();
    loadComponents();
    initializeCollapseButtons();
    setTheme(localStorage.getItem('theme') || 'light');
});