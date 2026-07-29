document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.about-feature');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 80}ms`;
        card.classList.add('fade-in-up');
    });
});
