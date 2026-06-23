/**
 * Smart Inventory Management - Premium Interactive JS
 * Handles theme switching, animations, and UI refinements
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. THEME MANAGEMENT ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Recovery transition class
    const addThemeTransition = () => {
        htmlElement.classList.add('theme-transitioning');
        setTimeout(() => htmlElement.classList.remove('theme-transitioning'), 400);
    };

    const setTheme = (theme) => {
        addThemeTransition();
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcon(theme);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    };

    const updateThemeIcon = (theme) => {
        if (!themeToggle) return;
        themeToggle.innerHTML = theme === 'dark'
            ? '<i class="bi bi-moon-stars-fill"></i>'
            : '<i class="bi bi-sun-fill"></i>';
    };

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // --- 2. BOOTSTRAP INITIALIZATION ---
    // Initialize Toasts
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(el => new bootstrap.Toast(el, { autohide: true, delay: 5000 }).show());

    // Initialize Tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(el => new bootstrap.Tooltip(el));

    // --- 3. UI ENHANCEMENTS ---
    // Smooth appearance for table rows
    const tableRows = document.querySelectorAll('.table-glass tr');
    tableRows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        row.style.transition = `all 0.3s ease ${index * 0.05}s`;

        setTimeout(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, 100);
    });

    // Active Link Highlighting refinement
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});
