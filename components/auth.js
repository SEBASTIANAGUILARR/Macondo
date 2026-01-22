class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Cargar usuario desde localStorage
        const savedUser = localStorage.getItem('macondo_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }
    }

    register(userData) {
        const users = JSON.parse(localStorage.getItem('macondo_users') || '[]');
        
        // Verificar si el email ya existe
        if (users.find(user => user.email === userData.email)) {
            throw new Error('El email ya está registrado');
        }

        // Crear nuevo usuario
        const newUser = {
            id: Date.now().toString(),
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: btoa(userData.password), // Simple encoding (no usar en producción)
            createdAt: new Date().toISOString(),
            orders: []
        };

        users.push(newUser);
        localStorage.setItem('macondo_users', JSON.stringify(users));
        
        // Auto login después del registro
        this.currentUser = newUser;
        localStorage.setItem('macondo_user', JSON.stringify(newUser));
        this.updateUI();
        
        return newUser;
    }

    login(email, password) {
        const users = JSON.parse(localStorage.getItem('macondo_users') || '[]');
        const user = users.find(u => u.email === email);
        
        if (!user || user.password !== btoa(password)) {
            throw new Error('Email o contraseña incorrectos');
        }

        this.currentUser = user;
        localStorage.setItem('macondo_user', JSON.stringify(user));
        this.updateUI();
        
        return user;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('macondo_user');
        this.updateUI();
        window.location.hash = '';
    }

    updateUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        
        if (this.currentUser) {
            if (authButtons) authButtons.style.display = 'none';
            if (userInfo) {
                userInfo.style.display = 'block';
                userInfo.querySelector('#user-name').textContent = this.currentUser.name;
            }
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Instancia global
window.auth = new AuthSystem();
