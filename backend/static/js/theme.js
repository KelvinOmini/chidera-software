/* Theme Management System */
(function () {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    document.addEventListener('DOMContentLoaded', () => {
        const themeToggle = document.querySelector('#theme-checkbox');
        if (themeToggle) {
            themeToggle.checked = currentTheme === 'dark';
            themeToggle.addEventListener('change', (e) => {
                const theme = e.target.checked ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
            });
        }
    });
})();
