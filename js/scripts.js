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

function loadHeader(elementId, title, subtitle) {
    const headerHTML = `
        <div class="card text-white my-4" style="background: linear-gradient(45deg, #1a1a1a, #2d2d2d); border-radius: 15px;">
            <div class="card-body py-4">
                <div class="row align-items-center">
                    <div class="col-12 text-center">
                        <h1 class="font-weight-light mb-2">${title}</h1>
                        <p class="text-light mb-0" style="font-size: 1.1rem;">${subtitle}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById(elementId).innerHTML = headerHTML;
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
    //console.debug('[Nav] Raw path:', currentPath);

    // Normalize homepage path
    const isHomePage = currentPath === '/' || currentPath === '' || currentPath.endsWith('/index.html');
    currentPath = isHomePage ? '/' : currentPath.replace(/^\//, '').toLowerCase();
    //console.debug('[Nav] Normalized path:', currentPath, 'Is homepage:', isHomePage);

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
        //console.debug(`[Nav] Checking link: "${href}" against path: "${currentPath}"`);

        // Homepage matching logic
        const isHomeLink = href === '/' || href === './' || href === '' || href === 'index.html';
        if ((isHomePage && isHomeLink) || (!isHomePage && href === currentPath)) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
            activeLinkFound = true;
            //console.debug('[Nav] Active link found:', href);
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
        //console.warn('[Nav] No active link matched. Falling back to highlight "Home".');
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
    // Skip initialization if we're on the blog post generator page
    if (window.location.pathname.includes('blogPostDesigner.html')) {
        return;
    }
    
    // Skip elements inside preview container
    document.querySelectorAll('[data-bs-toggle="collapse"]:not(#preview-container [data-bs-toggle="collapse"])').forEach(button => {
        const target = document.querySelector(button.getAttribute('data-bs-target'));
        if (target) {
            target.addEventListener('show.bs.collapse', () => button.textContent = 'Show Less');
            target.addEventListener('hide.bs.collapse', () => button.textContent = 'Show More');
        }
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
document.addEventListener('DOMContentLoaded', () => {
    updateNavBarLinkState();
    loadComponents();
    initializeCollapseButtons();
    setTheme(localStorage.getItem('theme') || 'light');
    
    // Add observer for navbar loading completion
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    checkDevAuth();
                    observer.disconnect();
                }
            });
        });
        observer.observe(navbarPlaceholder, { childList: true });
    } else {
        checkDevAuth();
    }
});

/****************************
 * AUTH
 ****************************/
let cryptoJsLoaded = false;

// Update the script loading
const authScript = document.createElement('script');
authScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
authScript.onload = () => {
    cryptoJsLoaded = true;
    // Check for hash generation request
    if (window.location.hash === '#generate') {
        generatePasswordHash();
    }
};
document.head.appendChild(authScript);

const VALID_DEV_HASH = 'b02ab0decbf12da19c3f2ae48a6ee04ff748f9410f8c30c2d6e3414fcb017456';

function showDevAuth() {
    if (!cryptoJsLoaded) {
        console.warn('CryptoJS not loaded yet');
        return;
    }
    const modal = new bootstrap.Modal(document.getElementById('devAuthModal'));
    modal.show();
}

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${window.location.hostname};SameSite=Strict`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function authenticateDev(event) {
    if (!cryptoJsLoaded) {
        console.warn('CryptoJS not loaded yet');
        return;
    }
    event.preventDefault();
    const password = document.getElementById('devPassword').value;
    const hash = CryptoJS.SHA256(password).toString();
    
    if (hash === VALID_DEV_HASH) {
        setCookie('devAuth', hash, 7); // Store auth for 7 days
        document.querySelectorAll('.dev-only').forEach(el => el.classList.remove('d-none'));
        const modal = bootstrap.Modal.getInstance(document.getElementById('devAuthModal'));
        if (modal) modal.hide();
    } else {
        const input = document.getElementById('devPassword');
        input.classList.add('is-invalid');
        setTimeout(() => input.classList.remove('is-invalid'), 3000);
    }
}

function checkDevAuth() {
    const storedAuth = getCookie('devAuth');
    if (storedAuth === VALID_DEV_HASH) {
        document.querySelectorAll('.dev-only').forEach(el => el.classList.remove('d-none'));
        return true;
    }
    return false;
}

function logoutDev() {
    // Remove the auth cookie with matching parameters
    setCookie('devAuth', '', -1); // Set expiry to past with same parameters
    // Hide dev-only elements
    document.querySelectorAll('.dev-only').forEach(el => el.classList.add('d-none'));
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
    checkDevAuth();
});

function generatePasswordHash() {
    if (!cryptoJsLoaded) {
        console.warn('CryptoJS not loaded yet. Please try again.');
        return;
    }
    const password = prompt('Enter password to hash:');
    if (password) {
        const hash = CryptoJS.SHA256(password).toString();
        console.log('Password Hash:', hash);
    }
}