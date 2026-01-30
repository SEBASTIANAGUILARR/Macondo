class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.session = null;
        this._authListenerRegistered = false;
        this._supabaseReadyListenerRegistered = false;
        this.init();
    }

    init() {
        this.refreshFromSupabase();

        if (!this._supabaseReadyListenerRegistered) {
            this._supabaseReadyListenerRegistered = true;
            window.addEventListener('supabase-ready', () => {
                this.refreshFromSupabase();
            });
        }
    }

    async refreshFromSupabase() {
        try {
            if (!window.supabaseClient || !window.supabaseClient.auth) {
                this.currentUser = null;
                this.session = null;
                this.updateUI();
                return;
            }

            const { data } = await window.supabaseClient.auth.getSession();
            this.session = data?.session || null;
            const u = this.session?.user || null;
            this.currentUser = u ? {
                id: u.id,
                email: u.email,
                name: u.user_metadata?.name || u.email,
                phone: u.user_metadata?.phone || '',
                createdAt: u.created_at,
            } : null;

            this.updateUI();

            if (!this._authListenerRegistered && window.supabaseClient?.auth?.onAuthStateChange) {
                this._authListenerRegistered = true;
                window.supabaseClient.auth.onAuthStateChange((_event, session) => {
                    this.session = session || null;
                    const uu = session?.user || null;
                    this.currentUser = uu ? {
                        id: uu.id,
                        email: uu.email,
                        name: uu.user_metadata?.name || uu.email,
                        phone: uu.user_metadata?.phone || '',
                        createdAt: uu.created_at,
                    } : null;
                    this.updateUI();
                });
            }
        } catch (e) {
            this.currentUser = null;
            this.session = null;
            this.updateUI();
        }
    }

    async register(userData) {
        if (!window.supabaseClient?.auth) {
            throw new Error('Supabase no está listo. Recarga la página.');
        }

        const emailRedirectTo = `${window.location.origin}/`;

        const { data, error } = await window.supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: { name: userData.name, phone: userData.phone },
                emailRedirectTo,
            }
        });

        if (error) {
            throw new Error(error.message || 'Error registrando usuario');
        }

        // Forzamos que el usuario NO quede logueado tras el registro.
        // Queremos que confirme el email y luego inicie sesión.
        this.session = data?.session || null;
        if (this.session) {
            try {
                await window.supabaseClient.auth.signOut();
            } catch (e) {}
        }

        this.session = null;
        this.currentUser = null;
        this.updateUI();

        return { needsEmailConfirmation: true };
    }

    async login(email, password) {
        if (!window.supabaseClient?.auth) {
            throw new Error('Supabase no está listo. Recarga la página.');
        }

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            throw new Error(error.message || 'Email o contraseña incorrectos');
        }

        this.session = data?.session || null;
        const u = data?.user || null;
        this.currentUser = u ? {
            id: u.id,
            email: u.email,
            name: u.user_metadata?.name || u.email,
            phone: u.user_metadata?.phone || '',
            createdAt: u.created_at,
        } : null;
        this.updateUI();

        return this.currentUser;
    }

    async logout() {
        try {
            if (window.supabaseClient?.auth) {
                await window.supabaseClient.auth.signOut();
            }
        } catch (e) {}

        this.currentUser = null;
        this.session = null;
        this.updateUI();
        try { window.location.hash = ''; } catch (e) {}
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

        try {
            window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: this.currentUser } }));
        } catch (e) {}
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async getAccessToken() {
        try {
            if (this.session?.access_token) {
                const expMs = this.session?.expires_at ? Number(this.session.expires_at) * 1000 : 0;
                if (expMs && expMs < Date.now() + 60 * 1000 && window.supabaseClient?.auth?.refreshSession) {
                    const refreshed = await window.supabaseClient.auth.refreshSession();
                    this.session = refreshed?.data?.session || this.session;
                }
                return this.session?.access_token || null;
            }
            if (!window.supabaseClient?.auth) return null;
            const { data } = await window.supabaseClient.auth.getSession();
            let session = data?.session || null;
            const expMs = session?.expires_at ? Number(session.expires_at) * 1000 : 0;
            if (session && expMs && expMs < Date.now() + 60 * 1000 && window.supabaseClient?.auth?.refreshSession) {
                const refreshed = await window.supabaseClient.auth.refreshSession();
                session = refreshed?.data?.session || session;
            }
            this.session = session;
            return session?.access_token || null;
        } catch (e) {
            return null;
        }
    }

    async resendConfirmationEmail(email) {
        if (!window.supabaseClient?.auth) {
            throw new Error('Supabase no está listo. Recarga la página.');
        }

        const emailRedirectTo = `${window.location.origin}/`;

        const { error } = await window.supabaseClient.auth.resend({
            type: 'signup',
            email: String(email || '').trim(),
            options: { emailRedirectTo },
        });

        if (error) {
            throw new Error(error.message || 'No se pudo reenviar el email de confirmación');
        }

        return true;
    }
}

// Instancia global
window.auth = new AuthSystem();
