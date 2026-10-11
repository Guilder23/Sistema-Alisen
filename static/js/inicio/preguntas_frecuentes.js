/* ============================================================================
   PREGUNTAS_FRECUENTES.JS - Lógica de acordeón FAQ
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const faqItems = Array.from(document.querySelectorAll('.faq-item'));
    const searchInput = document.getElementById('faqSearch');
    const emptyMessage = document.getElementById('faqSearchEmpty');

    const setExpanded = (item, expanded) => {
        const questionBtn = item.querySelector('.faq-question-btn');
        const answerBody = item.querySelector('.faq-answer-body');

        item.classList.toggle('open', expanded);
        questionBtn?.setAttribute('aria-expanded', String(expanded));
        answerBody?.classList.toggle('open', expanded);
        answerBody?.setAttribute('aria-hidden', String(!expanded));
        if (answerBody) {
            answerBody.style.maxHeight = expanded ? `${answerBody.scrollHeight}px` : '0px';
        }
    };

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question-btn');
        setExpanded(item, item.classList.contains('open'));

        questionBtn?.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            faqItems.forEach(otherItem => setExpanded(otherItem, false));
            if (!isOpen) setExpanded(item, true);
        });
    });

    searchInput?.addEventListener('input', () => {
        const query = searchInput.value.trim().toLocaleLowerCase('es');
        let visibleCount = 0;

        faqItems.forEach(item => {
            const matches = !query || item.textContent.toLocaleLowerCase('es').includes(query);
            item.hidden = !matches;
            if (matches) {
                visibleCount += 1;
            } else {
                setExpanded(item, false);
            }
        });

        if (emptyMessage) emptyMessage.hidden = visibleCount > 0;
    });

    window.addEventListener('resize', () => {
        faqItems.forEach(item => {
            if (item.classList.contains('open')) {
                const answerBody = item.querySelector('.faq-answer-body');
                if (answerBody) answerBody.style.maxHeight = `${answerBody.scrollHeight}px`;
            }
        });
    });
});
