class UserPanel {
    constructor() {
        this.currentView = 'profile';
        // No inicializar aquí, esperar a que el DOM esté listo
    }

    init() {
        // Solo crear el panel si el DOM está listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createPanel());
        } else {
            this.createPanel();
        }
        this.attachEventListeners();
    }

    createPanel() {
        const panelHTML = `
            <div id="user-panel" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b bg-amber-50">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-amber-800">Mi Panel</h2>
                            <button id="close-panel" class="text-gray-500 hover:text-gray-700">
                                <i data-feather="x" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex h-[calc(90vh-80px)]">
                        <!-- Sidebar -->
                        <div class="w-64 bg-amber-50 p-4 border-r">
                            <div class="space-y-2">
                                <button class="w-full text-left px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors panel-tab active" data-tab="profile">
                                    <i data-feather="user" class="w-4 h-4 inline mr-2"></i>
                                    Mi Perfil
                                </button>
                                <button class="w-full text-left px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors panel-tab" data-tab="orders">
                                    <i data-feather="shopping-bag" class="w-4 h-4 inline mr-2"></i>
                                    Mis Pedidos
                                </button>
                                <button class="w-full text-left px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors panel-tab" data-tab="reservations">
                                    <i data-feather="calendar" class="w-4 h-4 inline mr-2"></i>
                                    Mis Reservas
                                </button>
                                <button class="w-full text-left px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors panel-tab" data-tab="addresses">
                                    <i data-feather="map-pin" class="w-4 h-4 inline mr-2"></i>
                                    Direcciones
                                </button>
                                <button class="w-full text-left px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors panel-tab" data-tab="settings">
                                    <i data-feather="settings" class="w-4 h-4 inline mr-2"></i>
                                    Configuración
                                </button>
                            </div>
                        </div>
                        
                        <!-- Content -->
                        <div class="flex-1 overflow-y-auto p-6">
                            <!-- Profile Tab -->
                            <div id="profile-tab" class="tab-content">
                                <h3 class="text-xl font-bold text-amber-800 mb-4">Información Personal</h3>
                                <form id="profile-form" class="space-y-4">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-amber-700 font-medium mb-1">Nombre</label>
                                            <input type="text" id="profile-name" class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                                        </div>
                                        <div>
                                            <label class="block text-amber-700 font-medium mb-1">Email</label>
                                            <input type="email" id="profile-email" class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" readonly>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-amber-700 font-medium mb-1">Teléfono</label>
                                        <input type="tel" id="profile-phone" class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                                    </div>
                                    <div>
                                        <label class="block text-amber-700 font-medium mb-1">Fecha de Registro</label>
                                        <input type="text" id="profile-date" class="w-full p-3 border border-amber-300 rounded-lg bg-gray-50" readonly>
                                    </div>
                                    <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                        Guardar Cambios
                                    </button>
                                </form>
                            </div>
                            
                            <!-- Orders Tab -->
                            <div id="orders-tab" class="tab-content hidden">
                                <h3 class="text-xl font-bold text-amber-800 mb-4">Historial de Pedidos</h3>
                                <div id="orders-list" class="space-y-4">
                                    <!-- Los pedidos se cargarán aquí -->
                                </div>
                            </div>
                            
                            <!-- Reservations Tab -->
                            <div id="reservations-tab" class="tab-content hidden">
                                <h3 class="text-xl font-bold text-amber-800 mb-4">Mis Reservas</h3>
                                <div id="reservations-list" class="space-y-4">
                                    <!-- Las reservas se cargarán aquí -->
                                </div>
                            </div>
                            
                            <!-- Addresses Tab -->
                            <div id="addresses-tab" class="tab-content hidden">
                                <h3 class="text-xl font-bold text-amber-800 mb-4">Direcciones de Entrega</h3>
                                <div id="addresses-list" class="space-y-4">
                                    <!-- Las direcciones se cargarán aquí -->
                                </div>
                                <button onclick="window.userPanel.addAddress()" class="mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    Agregar Nueva Dirección
                                </button>
                            </div>
                            
                            <!-- Settings Tab -->
                            <div id="settings-tab" class="tab-content hidden">
                                <h3 class="text-xl font-bold text-amber-800 mb-4">Configuración</h3>
                                <div class="space-y-4">
                                    <div class="p-4 border rounded-lg">
                                        <h4 class="font-semibold text-amber-800 mb-2">Notificaciones</h4>
                                        <label class="flex items-center">
                                            <input type="checkbox" id="email-notifications" class="mr-2">
                                            <span>Recibir notificaciones por email</span>
                                        </label>
                                    </div>
                                    <div class="p-4 border rounded-lg">
                                        <h4 class="font-semibold text-amber-800 mb-2">Cambiar Contraseña</h4>
                                        <form id="password-form" class="space-y-2">
                                            <input type="password" placeholder="Contraseña actual" class="w-full p-2 border rounded">
                                            <input type="password" placeholder="Nueva contraseña" class="w-full p-2 border rounded">
                                            <input type="password" placeholder="Confirmar nueva contraseña" class="w-full p-2 border rounded">
                                            <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition-colors">
                                                Cambiar Contraseña
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        feather.replace();
    }

    attachEventListeners() {
        // Close panel
        document.getElementById('close-panel').addEventListener('click', () => this.close());
        
        // Tab navigation
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Profile form
        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });
        
        // Password form
        document.getElementById('password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
        
        // Close on background click
        document.getElementById('user-panel').addEventListener('click', (e) => {
            if (e.target.id === 'user-panel') {
                this.close();
            }
        });
    }

    open() {
        if (!window.auth.isAuthenticated()) {
            window.authModal.open();
            return;
        }
        
        document.getElementById('user-panel').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        this.loadUserData();
    }

    close() {
        document.getElementById('user-panel').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.remove('active', 'bg-amber-200');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active', 'bg-amber-200');
            }
        });
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        
        this.currentView = tabName;
        this.loadTabContent(tabName);
    }

    loadUserData() {
        const user = window.auth.getCurrentUser();
        if (!user) return;
        
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-date').value = new Date(user.createdAt).toLocaleDateString('es-ES');
        
        this.loadTabContent(this.currentView);
    }

    loadTabContent(tabName) {
        switch (tabName) {
            case 'orders':
                this.loadOrders();
                break;
            case 'reservations':
                this.loadReservations();
                break;
            case 'addresses':
                this.loadAddresses();
                break;
        }
    }

    loadOrders() {
        const user = window.auth.getCurrentUser();
        const orders = user.orders || [];
        const ordersList = document.getElementById('orders-list');
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="text-gray-500">No tienes pedidos aún</p>';
            return;
        }
        
        ordersList.innerHTML = orders.map(order => `
            <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-amber-800">Pedido #${order.id}</h4>
                        <p class="text-sm text-gray-600">Fecha: ${new Date(order.date).toLocaleDateString('es-ES')}</p>
                        <p class="text-sm text-gray-600">Total: ${order.total} PLN</p>
                        <p class="text-sm font-medium ${order.status === 'completed' ? 'text-green-600' : order.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}">
                            Estado: ${this.getStatusText(order.status)}
                        </p>
                    </div>
                    <button class="text-amber-600 hover:text-amber-700 font-medium">
                        Ver Detalles
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadReservations() {
        const reservations = JSON.parse(localStorage.getItem('macondo_reservations') || '[]');
        const user = window.auth.getCurrentUser();
        const userReservations = reservations.filter(r => r.email === user.email);
        const reservationsList = document.getElementById('reservations-list');
        
        if (userReservations.length === 0) {
            reservationsList.innerHTML = '<p class="text-gray-500">No tienes reservas aún</p>';
            return;
        }
        
        reservationsList.innerHTML = userReservations.map(reservation => `
            <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-amber-800">Reserva para ${reservation.people} personas</h4>
                        <p class="text-sm text-gray-600">Fecha: ${reservation.date}</p>
                        <p class="text-sm text-gray-600">Hora: ${reservation.time}</p>
                        <p class="text-sm text-gray-600">Mesa: ${reservation.table || 'No asignada'}</p>
                    </div>
                    <button class="text-red-600 hover:text-red-700 font-medium">
                        Cancelar
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadAddresses() {
        const user = window.auth.getCurrentUser();
        const addresses = user.addresses || [];
        const addressesList = document.getElementById('addresses-list');
        
        if (addresses.length === 0) {
            addressesList.innerHTML = '<p class="text-gray-500">No tienes direcciones guardadas</p>';
            return;
        }
        
        addressesList.innerHTML = addresses.map((address, index) => `
            <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-amber-800">${address.name}</h4>
                        <p class="text-sm text-gray-600">${address.address}</p>
                        <p class="text-sm text-gray-600">${address.city}, ${address.postalCode}</p>
                    </div>
                    <div class="space-x-2">
                        <button class="text-amber-600 hover:text-amber-700 font-medium">
                            Editar
                        </button>
                        <button class="text-red-600 hover:text-red-700 font-medium" onclick="window.userPanel.deleteAddress(${index})">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateProfile() {
        const user = window.auth.getCurrentUser();
        const users = JSON.parse(localStorage.getItem('macondo_users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
            users[userIndex].name = document.getElementById('profile-name').value;
            users[userIndex].phone = document.getElementById('profile-phone').value;
            
            localStorage.setItem('macondo_users', JSON.stringify(users));
            localStorage.setItem('macondo_user', JSON.stringify(users[userIndex]));
            
            window.auth.currentUser = users[userIndex];
            window.auth.updateUI();
            
            this.showNotification('Perfil actualizado correctamente');
        }
    }

    changePassword() {
        // Lógica para cambiar contraseña
        this.showNotification('Función de cambio de contraseña próximamente');
    }

    addAddress() {
        // Lógica para agregar dirección
        this.showNotification('Función de agregar dirección próximamente');
    }

    deleteAddress(index) {
        if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
            const user = window.auth.getCurrentUser();
            const users = JSON.parse(localStorage.getItem('macondo_users') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id);
            
            if (userIndex !== -1) {
                users[userIndex].addresses = users[userIndex].addresses || [];
                users[userIndex].addresses.splice(index, 1);
                
                localStorage.setItem('macondo_users', JSON.stringify(users));
                localStorage.setItem('macondo_user', JSON.stringify(users[userIndex]));
                
                window.auth.currentUser = users[userIndex];
                this.loadAddresses();
                
                this.showNotification('Dirección eliminada correctamente');
            }
        }
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendiente',
            'preparing': 'Preparando',
            'ready': 'Listo para recoger',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Instancia global
window.userPanel = new UserPanel();
