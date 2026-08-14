document.addEventListener('DOMContentLoaded', function () {
    const input = document.querySelector('.card-filtros input');
    if (!input) return;

    input.addEventListener('keyup', function () {
        const value = this.value.toLowerCase();
        const rows = document.querySelectorAll('.tabla-reservas tbody tr');

        rows.forEach(function (row) {
            if (row.querySelector('td[colspan]')) return;

            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(value) ? '' : 'none';
        });
    });
});
