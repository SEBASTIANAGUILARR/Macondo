class UserPanel {
    constructor() {
        this.currentView = 'profile';
        this.initialized = false;
        // No inicializar aquí, esperar a que el DOM esté listo
    }

    init() {
        if (this.initialized) return;
        // Solo crear el panel si el DOM está listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createPanel());
        } else {
            this.createPanel();
        }
        this.attachEventListeners();
        this.initialized = true;
    }

    createPanel() {
        if (document.getElementById('user-panel')) return;
        const panelHTML = `
            <div id="user-panel" class="fixed inset-0 bg-black bg-opacity-50 z-[9998] hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b bg-amber-50">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-amber-800">Mi Panel</h2>
                            <button id="close-panel" class="text-gray-500 hover:text-gray-700">
                                <i data-feather="x" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row h-[calc(90vh-80px)]">
                        <!-- Mobile tab selector -->
                        <div class="sm:hidden p-4 border-b bg-amber-50">
                            <label for="user-panel-tab-select" class="block text-sm font-bold text-amber-800 mb-2">Sección</label>
                            <select id="user-panel-tab-select" class="w-full p-3 border border-amber-300 rounded-lg bg-white">
                                <option value="profile">Mi Perfil</option>
                                <option value="orders">Mis Pedidos</option>
                                <option value="reservations">Mis Reservas</option>
                                <option value="covers">Mis Covers</option>
                                <option value="addresses">Direcciones</option>
                                <option value="settings">Configuración</option>
                            </select>
                        </div>

                        <!-- Sidebar -->
                        <div class="hidden sm:block w-64 bg-amber-50 p-4 border-r">
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
                                <button class="w-full text-left px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors panel-tab" data-tab="covers">
                                    <i data-feather="credit-card" class="w-4 h-4 inline mr-2"></i>
                                    Mis Covers
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
                        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
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

                            <!-- Covers Tab -->
                            <div id="covers-tab" class="tab-content hidden">
                                <h3 class="text-xl font-bold text-amber-800 mb-4">Mis Covers</h3>
                                <div id="covers-list" class="space-y-4">
                                    <!-- Los covers se cargarán aquí -->
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
        const closeBtn = document.getElementById('close-panel');
        if (!closeBtn) return;

        // Close panel
        closeBtn.addEventListener('click', () => this.close());
        
        // Tab navigation
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        const mobileSelect = document.getElementById('user-panel-tab-select');
        if (mobileSelect) {
            mobileSelect.addEventListener('change', (e) => {
                this.switchTab(e.target.value);
            });
        }
        
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

        if (!document.getElementById('user-panel')) {
            this.init();
        }
        
        document.getElementById('user-panel').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        this.loadUserData();
    }

    openTab(tabName) {
        if (!window.auth.isAuthenticated()) {
            window.authModal.open('login');
            return;
        }

        if (!document.getElementById('user-panel')) {
            this.init();
        }

        this.open();
        if (tabName) {
            this.switchTab(tabName);
        }
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

        const mobileSelect = document.getElementById('user-panel-tab-select');
        if (mobileSelect) {
            mobileSelect.value = tabName;
        }
        
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
            case 'covers':
                this.loadCovers();
                break;
            case 'addresses':
                this.loadAddresses();
                break;
        }
    }

    async loadCovers() {
        const coversList = document.getElementById('covers-list');
        const user = window.auth.getCurrentUser();
        if (!coversList || !user?.email) return;

        coversList.innerHTML = '<p class="text-gray-500">Cargando covers...</p>';

        const baseUrl = window.location.origin;

        try {
            if (!window.supabaseClient) {
                coversList.innerHTML = '<p class="text-gray-500">No se pudo cargar (Supabase no disponible).</p>';
                return;
            }

            const { data, error } = await window.supabaseClient
                .from('cover_tickets')
                .select('id,person_name,person_email,dj_name,price_pln,event_date,qr_token,status,created_at')
                .eq('person_email', user.email)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const rows = Array.isArray(data) ? data : [];

            if (rows.length === 0) {
                coversList.innerHTML = '<p class="text-gray-500">No tienes covers comprados aún</p>';
                return;
            }

            coversList.innerHTML = rows.map(t => {
                const link = `${baseUrl}/ticket.html?token=${encodeURIComponent(t.qr_token)}`;
                const date = t.event_date ? String(t.event_date) : '—';
                const dj = t.dj_name || '—';
                const price = (t.price_pln != null) ? `${t.price_pln} PLN` : '—';
                const st = String(t.status || '').toLowerCase();
                const badge = st === 'paid' || st === 'manual' ? 'text-green-700 bg-green-100' : 'text-gray-700 bg-gray-100';
                return `
                    <div class="border rounded-lg p-4">
                        <div class="flex flex-wrap justify-between items-start gap-4">
                            <div>
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="font-semibold text-amber-800">${t.person_name || 'Cover'}</div>
                                    <span class="px-2 py-1 rounded-full text-xs font-bold ${badge}">${st || '—'}</span>
                                </div>
                                <div class="text-sm text-gray-700 space-y-1">
                                    <div><b>Fecha:</b> ${date}</div>
                                    <div><b>DJ:</b> ${dj}</div>
                                    <div><b>Precio:</b> ${price}</div>
                                </div>
                                <div class="mt-3">
                                    <a href="${link}" class="text-amber-700 font-bold underline" target="_blank" rel="noopener noreferrer">Abrir mi QR</a>
                                </div>
                            </div>
                            <div class="text-sm text-gray-600">
                                <div><b>Email:</b> ${t.person_email || ''}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            coversList.innerHTML = '<p class="text-red-600">No se pudieron cargar tus covers. Intenta de nuevo.</p>';
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
        const reservationsList = document.getElementById('reservations-list');
        const user = window.auth.getCurrentUser();
        if (!reservationsList || !user?.email) return;

        const renderStatus = (estado) => {
            const s = String(estado || '').toLowerCase();
            if (s === 'confirmada') return { text: 'Confirmada', cls: 'text-green-700 bg-green-100' };
            if (s === 'pendiente') return { text: 'Pendiente', cls: 'text-yellow-700 bg-yellow-100' };
            if (s === 'cancelada') return { text: 'Cancelada', cls: 'text-red-700 bg-red-100' };
            return { text: s || '—', cls: 'text-gray-700 bg-gray-100' };
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '—';
            const d = new Date(dateStr);
            if (Number.isNaN(d.getTime())) return String(dateStr);
            return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        };

        reservationsList.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div class="text-sm text-gray-600">Mostrando reservas asociadas a: <b>${user.email}</b></div>
                <button id="refresh-user-reservations" class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-lg transition-colors">Recargar</button>
            </div>
            <div id="user-reservations-items" class="space-y-4"></div>
        `;

        const itemsEl = document.getElementById('user-reservations-items');
        const refreshBtn = document.getElementById('refresh-user-reservations');

        const load = async () => {
            if (!itemsEl) return;
            itemsEl.innerHTML = '<p class="text-gray-500">Cargando reservas...</p>';

            try {
                const accessToken = window.auth && typeof window.auth.getAccessToken === 'function'
                    ? await window.auth.getAccessToken()
                    : null;

                if (accessToken) {
                    const resp = await fetch('/.netlify/functions/user-reservations', {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + accessToken
                        }
                    });

                    const payload = await resp.json().catch(() => ({}));
                    if (!resp.ok) {
                        const msg = String(payload.error || resp.statusText || 'Error').toLowerCase();
                        if (resp.status === 401 || msg.includes('invalid session')) {
                            const err = new Error(payload.error || 'Sesión no válida. Vuelve a iniciar sesión.');
                            err.code = 'INVALID_SESSION';
                            throw err;
                        }
                        throw new Error(payload.error || resp.statusText);
                    }

                    const rows = Array.isArray(payload.reservations) ? payload.reservations : [];
                    if (rows.length === 0) {
                        itemsEl.innerHTML = '<p class="text-gray-500">No tienes reservas aún</p>';
                        return;
                    }

                    itemsEl.innerHTML = rows.map(r => {
                        const st = renderStatus(r.estado);
                        const photo = String(r.mesa_foto_url || '').trim();
                        return `
                            <div class="border rounded-lg p-4">
                                <div class="flex flex-wrap justify-between items-start gap-4">
                                    <div>
                                        <div class="flex items-center gap-2 mb-2">
                                            <div class="font-semibold text-amber-800">Reserva</div>
                                            <span class="px-2 py-1 rounded-full text-xs font-bold ${st.cls}">${st.text}</span>
                                        </div>
                                        <div class="text-sm text-gray-700 space-y-1">
                                            <div><b>Fecha:</b> ${formatDate(r.fecha)}</div>
                                            <div><b>Hora:</b> ${r.hora_entrada || '—'}</div>
                                            <div><b>Personas:</b> ${r.personas || '—'}</div>
                                            <div><b>Mesa:</b> ${r.mesa || 'Aún no asignada'}</div>
                                            ${r.comentarios ? `<div><b>Comentarios:</b> ${String(r.comentarios)}</div>` : ''}
                                        </div>
                                    </div>
                                    <div class="w-full sm:w-64">
                                        ${photo ? `
                                            <a href="${photo}" target="_blank" rel="noopener noreferrer" class="text-amber-700 font-bold underline">📷 Ver foto</a>
                                            <div class="mt-2">
                                                <img src="${photo}" alt="Foto de mesa" class="w-full rounded-lg border" />
                                            </div>
                                        ` : '<div class="text-sm text-gray-500">Foto de mesa: no disponible</div>'}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                    return;
                }

                const legacy = JSON.parse(localStorage.getItem('macondo_reservations') || '[]');
                const userReservations = (legacy || []).filter(r => r.email === user.email);
                if (userReservations.length === 0) {
                    itemsEl.innerHTML = '<p class="text-gray-500">No tienes reservas aún</p>';
                    return;
                }

                itemsEl.innerHTML = userReservations.map(reservation => `
                    <div class="border rounded-lg p-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-semibold text-amber-800">Reserva para ${reservation.people} personas</h4>
                                <p class="text-sm text-gray-600">Fecha: ${reservation.date}</p>
                                <p class="text-sm text-gray-600">Hora: ${reservation.time}</p>
                                <p class="text-sm text-gray-600">Mesa: ${reservation.table || 'No asignada'}</p>
                            </div>
                        </div>
                    </div>
                `).join('');
            } catch (e) {
                try {
                    if (e && e.code === 'INVALID_SESSION') {
                        itemsEl.innerHTML = '<p class="text-red-600">Sesión no válida. Vuelve a iniciar sesión y prueba de nuevo.</p>';
                        return;
                    }

                    const legacy = JSON.parse(localStorage.getItem('macondo_reservations') || '[]');
                    const userReservations = (legacy || []).filter(r => String(r.email || '').trim().toLowerCase() === String(user.email || '').trim().toLowerCase());
                    if (!userReservations || userReservations.length === 0) {
                        itemsEl.innerHTML = '<p class="text-gray-500">No tienes reservas aún</p>';
                        return;
                    }

                    itemsEl.innerHTML = userReservations.map(reservation => `
                        <div class="border rounded-lg p-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-semibold text-amber-800">Reserva para ${reservation.people} personas</h4>
                                    <p class="text-sm text-gray-600">Fecha: ${reservation.date}</p>
                                    <p class="text-sm text-gray-600">Hora: ${reservation.time}</p>
                                    <p class="text-sm text-gray-600">Mesa: ${reservation.table || 'No asignada'}</p>
                                </div>
                            </div>
                        </div>
                    `).join('');
                } catch (ignored) {
                    itemsEl.innerHTML = '<p class="text-red-600">No se pudieron cargar tus reservas. Intenta de nuevo.</p>';
                }
            }
        };

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => load());
        }
        load();
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

    async updateProfile() {
        const user = window.auth.getCurrentUser();
        if (!user) return;

        const name = String(document.getElementById('profile-name')?.value || '').trim();
        const phone = String(document.getElementById('profile-phone')?.value || '').trim();

        if (!name) {
            this.showNotification('El nombre es obligatorio', 'error');
            return;
        }

        try {
            if (!window.supabaseClient?.auth?.updateUser) {
                throw new Error('Supabase no está listo. Recarga la página.');
            }

            const { error } = await window.supabaseClient.auth.updateUser({
                data: { name, phone }
            });

            if (error) {
                throw new Error(error.message || 'No se pudo guardar el perfil');
            }

            if (window.auth && typeof window.auth.refreshFromSupabase === 'function') {
                await window.auth.refreshFromSupabase();
            }

            this.loadUserData();
            this.showNotification('Perfil actualizado correctamente');
        } catch (e) {
            this.showNotification(e.message || String(e), 'error');
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
