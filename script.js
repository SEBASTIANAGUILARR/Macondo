// Funcionalidad común para todas las páginas
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Actualizar año en el footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

// Manejo de reservas
function initTableReservation() {
    const tables = document.querySelectorAll('.table-item');
    
    tables.forEach(table => {
        table.addEventListener('click', function() {
            if (this.classList.contains('available')) {
                // Deseleccionar todas las mesas primero
                tables.forEach(t => {
                    t.classList.remove('selected');
                    t.classList.add('available');
                });
                
                // Seleccionar esta mesa
                this.classList.remove('available');
                this.classList.add('selected');
            }
        });
    });
}

// Inicializar cuando esté disponible
if (document.querySelector('.table-map')) {
    initTableReservation();
}