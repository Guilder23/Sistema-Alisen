document.addEventListener('DOMContentLoaded', () => {
    const items = Array.from(document.querySelectorAll('.faq-item'));
    items.forEach((item) => {
        const button = item.querySelector('.faq-question');
        const panel = item.querySelector('.faq-answer');
        button.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            items.forEach((other) => other.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
            panel.style.maxHeight = item.classList.contains('open') ? `${panel.scrollHeight}px` : '0';
        });
    });
});
