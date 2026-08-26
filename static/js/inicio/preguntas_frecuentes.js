/* ============================================================================
   PREGUNTAS_FRECUENTES.JS - Lógica de acordeón FAQ
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question-btn');
        const answerBody = item.querySelector('.faq-answer-body');

        questionBtn?.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            
            // Cerrar otros
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('open');
                const otherAnswer = otherItem.querySelector('.faq-answer-body');
                if (otherAnswer) otherAnswer.classList.remove('open');
            });

            if (!isOpen) {
                item.classList.add('open');
                answerBody?.classList.add('open');
            }
        });
    });
});
