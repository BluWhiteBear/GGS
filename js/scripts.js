async function loadHTML(elementId, url) {
    // Try to load from cache first
    const cached = localStorage.getItem(url);
    if (cached) {
        document.getElementById(elementId).innerHTML = cached;
        updateActiveNavLink();
    }
    
    // Then fetch fresh content
    try {
        const response = await fetch(url);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        localStorage.setItem(url, html);
        updateActiveNavLink();
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

function updateActiveNavLink() {
    // Get current page path and handle root/index cases
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const isHomePage = currentPath === '' || currentPath === '/' || currentPath === 'index.html';
    const path = isHomePage ? 'index.html' : currentPath;
    
    // Remove all active classes and aria-current
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    });
    
    // Find and update the current page's link
    const currentLink = document.querySelector(`.nav-link[href="${path}"]`);
    if (currentLink) {
        currentLink.classList.add('active');
        currentLink.setAttribute('aria-current', 'page');
    }
}

document.addEventListener("DOMContentLoaded", function() {
    loadHTML("navbar-placeholder", "navbar.html");
    loadHTML("socials-placeholder", "socials.html");
    loadHTML("footer-placeholder", "footer.html");
});
