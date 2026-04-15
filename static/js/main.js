/**
 * Smart Inventory Management - Main JS
 */

document.addEventListener('DOMContentLoaded', function() {
    // 1. Theme Toggling
    const themeToggleBtn = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use the system preference
    const currentTheme = localStorage.getItem('theme') || 
                        (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Initial setup
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    }
    
    // Toggle on click
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            let theme = document.documentElement.getAttribute('data-theme');
            let newTheme = theme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
            
            // Dispatch event for charts to update colors
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        });
    }
    
    function updateThemeIcon(theme) {
        if (!themeToggleBtn) return;
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
        } else {
            themeToggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
        }
    }
    
    // 2. Initialize Toasts
    const toastElList = [].slice.call(document.querySelectorAll('.toast'))
    const toastList = toastElList.map(function(toastEl) {
        // Create Bootstrap toast with auto-hide
        return new bootstrap.Toast(toastEl, { delay: 5000 });
    });
    
    // Show all toasts on load
    toastList.forEach(toast => toast.show());
    
    // 3. Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
    
    // 4. Search Filter delay (debounce)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                searchInput.closest('form').submit();
            }, 500);
        });
    }
});
