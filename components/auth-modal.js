class AuthModal {
    constructor() {
        this.currentView = 'login';
        this.initialized = false;
        // No inicializar aquí, esperar a que el DOM esté listo
    }

    init() {
        if (this.initialized) return;
        // Solo crear el modal si el DOM está listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createModal());
        } else {
            this.createModal();
        }
        this.attachEventListeners();
        this.initialized = true;
    }

    createModal() {
        if (document.getElementById('auth-modal')) return;
        const modalHTML = `
            <div id="auth-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[9999] hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 id="modal-title" class="text-2xl font-bold text-amber-800">Iniciar Sesión</h2>
                            <button id="close-modal" class="text-gray-500 hover:text-gray-700">
                                <i data-feather="x" class="w-6 h-6"></i>
                            </button>
                        </div>

                        <!-- Login Form -->
                        <form id="login-form" class="space-y-4">
                            <div>
                                <label class="block text-amber-700 font-medium mb-1">Email</label>
                                <input type="email" id="login-email" required 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                            </div>
                            <div>
                                <label class="block text-amber-700 font-medium mb-1">Contraseña</label>
                                <input type="password" id="login-password" required 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                            </div>
                            <button type="submit" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                Iniciar Sesión
                            </button>
                        </form>

                        <!-- Register Form -->
                        <form id="register-form" class="space-y-4 hidden">
                            <div>
                                <label class="block text-amber-700 font-medium mb-1">Nombre Completo</label>
                                <input type="text" id="register-name" required 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                            </div>
                            <div>
                                <label class="block text-amber-700 font-medium mb-1">Email</label>
                                <input type="email" id="register-email" required 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                            </div>
                            <div>
                                <label class="block text-amber-700 font-medium mb-1">Teléfono</label>
                                <input type="tel" id="register-phone" required 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                            </div>
                            <div>
                                <label class="block text-amber-700 font-medium mb-1">Contraseña</label>
                                <input type="password" id="register-password" required 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                            </div>
                            <div>
                                <label class="block text-amber-700 font-medium mb-1">Confirmar Contraseña</label>
                                <input type="password" id="register-confirm-password" required 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                            </div>
                            <button type="submit" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                Registrarse
                            </button>
                        </form>

                        <!-- Toggle between forms -->
                        <div class="mt-6 text-center">
                            <p id="toggle-text" class="text-gray-600">
                                ¿No tienes cuenta? 
                                <button id="toggle-form" class="text-amber-600 hover:text-amber-700 font-medium">
                                    Regístrate
                                </button>
                            </p>
                        </div>

                        <!-- Error message -->
                        <div id="auth-error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg hidden"></div>

                        <!-- Resend confirmation -->
                        <div id="auth-resend" class="mt-4 p-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg hidden">
                            <div class="font-semibold mb-2">Tu email aún no está confirmado</div>
                            <div class="text-sm mb-3">Revisa tu bandeja de entrada (y spam). Si no te llegó, puedes reenviar el correo de confirmación.</div>
                            <button id="resend-confirmation" type="button" class="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                Reenviar email de confirmación
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        feather.replace();
    }

    attachEventListeners() {
        // Close modal
        document.getElementById('close-modal').addEventListener('click', () => this.close());
        
        // Toggle forms
        document.getElementById('toggle-form').addEventListener('click', () => this.toggleView());
        
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Register form
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // Close on background click
        document.getElementById('auth-modal').addEventListener('click', (e) => {
            if (e.target.id === 'auth-modal') {
                this.close();
            }
        });

        // Resend confirmation email
        document.getElementById('resend-confirmation').addEventListener('click', async () => {
            const email = (document.getElementById('login-email')?.value || '').trim();
            if (!email) {
                this.showError('Introduce tu email para reenviar la confirmación');
                return;
            }
            try {
                await window.auth.resendConfirmationEmail(email);
                this.showSuccess('Te hemos reenviado el email de confirmación');
            } catch (e) {
                this.showError(e.message);
            }
        });
    }

    toggleView() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const modalTitle = document.getElementById('modal-title');
        const toggleText = document.getElementById('toggle-text');
        const toggleBtn = document.getElementById('toggle-form');
        
        if (this.currentView === 'login') {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            modalTitle.textContent = 'Registrarse';
            toggleText.innerHTML = '¿Ya tienes cuenta? <button id="toggle-form" class="text-amber-600 hover:text-amber-700 font-medium">Inicia Sesión</button>';
            this.currentView = 'register';
        } else {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            modalTitle.textContent = 'Iniciar Sesión';
            toggleText.innerHTML = '¿No tienes cuenta? <button id="toggle-form" class="text-amber-600 hover:text-amber-700 font-medium">Regístrate</button>';
            this.currentView = 'login';
        }
        
        // Re-attach event listener to toggle button
        document.getElementById('toggle-form').addEventListener('click', () => this.toggleView());
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            await window.auth.login(email, password);
            this.close();
            this.showSuccess('¡Bienvenido de vuelta!');
        } catch (error) {
            const msg = String(error?.message || 'Error');
            if (msg.toLowerCase().includes('email not confirmed')) {
                this.showError('Email no confirmado. Revisa tu correo y confirma tu cuenta.');
                const resend = document.getElementById('auth-resend');
                if (resend) resend.classList.remove('hidden');
                return;
            }
            this.showError(msg);
        }
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
            this.showError('Las contraseñas no coinciden');
            return;
        }
        
        try {
            await window.auth.register({ name, email, phone, password });
            this.close();
            this.showSuccess('¡Registro exitoso! Bienvenido a Macondo.');
        } catch (error) {
            this.showError(error.message);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('auth-error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    showSuccess(message) {
        // Crear notificación de éxito
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    open(view = null) {
        if (!document.getElementById('auth-modal')) {
            this.init();
        }

        if (view === 'login' && this.currentView === 'register') {
            this.toggleView();
        }
        if (view === 'register' && this.currentView === 'login') {
            this.toggleView();
        }

        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    close() {
        document.getElementById('auth-modal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Reset forms
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        document.getElementById('auth-error').classList.add('hidden');
        document.getElementById('auth-resend').classList.add('hidden');
        
        // Reset to login view
        if (this.currentView === 'register') {
            this.toggleView();
        }
    }
}

// Instancia global
window.authModal = new AuthModal();
