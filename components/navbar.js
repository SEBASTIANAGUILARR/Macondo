class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          background-color: rgba(251, 191, 36, 0.95);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #92400e;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .logo img {
          height: 40px;
          border-radius: 8px;
        }
        
        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }
        
        .logo-text .brand {
          font-size: 1.25rem;
          font-weight: 800;
          color: #92400e;
        }
        
        .logo-text .tagline {
          font-size: 0.7rem;
          font-weight: 500;
          color: #b45309;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }
        
        .nav-links a {
          color: #92400e;
          text-decoration: none;
          font-weight: 600;
          padding: 0.5rem 0;
          position: relative;
          transition: color 0.3s ease;
        }
        
        .nav-links a:hover {
          color: #5a2e0a;
        }
        
        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #92400e;
          transition: width 0.3s ease;
        }
        
        .nav-links a:hover::after {
          width: 100%;
        }
        
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: #92400e;
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .auth-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-menu {
          position: relative;
          display: none;
        }

        .user-menu button {
          cursor: pointer;
        }

        .user-menu-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: 2px solid #92400e;
          color: #92400e;
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          font-weight: 700;
        }

        .user-menu-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          background: white;
          border: 1px solid rgba(146, 64, 14, 0.25);
          border-radius: 12px;
          min-width: 220px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          padding: 8px;
          display: none;
          z-index: 9999;
        }

        .user-menu-dropdown.active {
          display: block;
        }

        .user-menu-item {
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          padding: 10px 12px;
          border-radius: 10px;
          color: #1f2937;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-menu-item:hover {
          background: rgba(251, 191, 36, 0.25);
        }
        
        .language-selector-container {
          display: flex;
          align-items: center;
        }
        
        .auth-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .btn-login, .btn-register {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-login {
          background-color: transparent;
          color: #92400e;
          border: 2px solid #92400e;
        }
        
        .btn-login:hover {
          background-color: #92400e;
          color: white;
        }
        
        .btn-register {
          background-color: #92400e;
          color: white;
        }
        
        .btn-register:hover {
          background-color: #5a2e0a;
        }
        
        .user-info {
          display: none;
          align-items: center;
          gap: 1rem;
        }
        
        .user-name {
          font-weight: 600;
          color: #92400e;
        }
        
        .btn-logout {
          background-color: #dc2626;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .btn-logout:hover {
          background-color: #b91c1c;
        }
        
        .cart-icon {
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background-color 0.3s ease;
        }
        
        .cart-icon:hover {
          background-color: rgba(146, 64, 14, 0.1);
        }
        
        .cart-icon svg {
          width: 24px;
          height: 24px;
        }
        
        .cart-count {
          position: absolute;
          top: 0;
          right: 0;
          background-color: #dc2626;
          color: white;
          border-radius: 50%;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: bold;
          padding: 0 4px;
        }
        
        @media (max-width: 768px) {
          nav {
            padding: 0.75rem 1rem;
          }
          
          .logo {
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          
          .logo img {
            height: 36px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .logo-text {
            display: flex;
            flex-direction: column;
            line-height: 1.1;
          }
          
          .logo-text .brand {
            font-size: 0.95rem;
            font-weight: 800;
            color: #92400e;
          }
          
          .logo-text .tagline {
            font-size: 0.6rem;
            font-weight: 500;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .nav-links {
            position: fixed;
            top: 56px;
            left: 0;
            right: 0;
            width: 100%;
            background-color: rgba(251, 191, 36, 0.98);
            flex-direction: column;
            align-items: stretch;
            padding: 0.75rem;
            gap: 0.375rem;
            transform: translateY(-150%);
            transition: transform 0.3s ease;
            z-index: 999;
            max-height: calc(100vh - 56px);
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
          }
          
          .nav-links.active {
            transform: translateY(0);
          }
          
          .nav-links a {
            display: block;
            padding: 0.5rem 0.625rem;
            text-align: center;
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            font-size: 0.85rem;
          }
          
          .nav-links a:hover {
            background-color: rgba(255, 255, 255, 0.5);
          }
          
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background-color: rgba(146, 64, 14, 0.8);
            transition: background-color 0.3s ease;
          }
          
          .mobile-menu-btn:hover,
          .mobile-menu-btn:active {
            background-color: rgba(146, 64, 14, 1);
          }
          
          .mobile-menu-btn i {
            color: white;
            width: 20px;
            height: 20px;
          }
          
          .language-selector-container {
            order: -1;
            display: flex;
            justify-content: center;
            padding: 0.375rem 0;
            border-bottom: 1px solid rgba(146, 64, 14, 0.2);
            margin-bottom: 0.375rem;
          }
          
          .cart-icon {
            justify-content: center;
            padding: 0.5rem;
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 6px;
          }
          
          .auth-section {
            flex-direction: column;
            width: 100%;
            gap: 0.375rem;
            margin-top: 0.375rem;
            padding-top: 0.375rem;
            border-top: 1px solid rgba(146, 64, 14, 0.2);
          }
          
          .auth-buttons {
            width: 100%;
            flex-direction: column;
            gap: 0.375rem;
          }
          
          .btn-login, .btn-register {
            width: 100%;
            padding: 0.5rem 0.75rem;
            text-align: center;
            font-size: 0.85rem;
          }
          
          .user-info {
            flex-direction: column;
            width: 100%;
            gap: 0.5rem;
          }
          
          .user-info .btn-login,
          .user-info .btn-logout {
            width: 100%;
            margin: 0 !important;
          }
        }
        
        /* Pantallas muy pequeñas */
        @media (max-width: 480px) {
          nav {
            padding: 0.375rem 0.5rem;
          }
          
          .logo {
            font-size: 0.85rem;
          }
          
          .logo img {
            height: 26px;
            margin-right: 0.25rem;
          }
          
          .logo-text .brand {
            font-size: 0.85rem;
          }
          
          .logo-text .tagline {
            font-size: 0.5rem;
          }
          
          .mobile-menu-btn {
            width: 36px;
            height: 36px;
          }
          
          .mobile-menu-btn i {
            width: 18px;
            height: 18px;
          }
          
          .nav-links {
            top: 44px;
            max-height: calc(100vh - 44px);
            padding: 0.5rem;
            gap: 0.25rem;
          }
          
          .nav-links a {
            padding: 0.375rem 0.5rem;
            font-size: 0.8rem;
          }
          
          .btn-login, .btn-register {
            padding: 0.375rem 0.5rem;
            font-size: 0.8rem;
          }
        }
      </style>
      
      <nav>
        <a href="/" class="logo">
          <img src="logo.pnh.png" alt="Macondo Bar Latino">
          <span class="logo-text">
            <span class="brand">Macondo</span>
            <span class="tagline">Bar Latino</span>
          </span>
        </a>
        
        <button class="mobile-menu-btn">
          <i data-feather="menu"></i>
        </button>
        
        <div class="nav-links">
          <a href="/" data-i18n="navbar.home">Inicio</a>
          <a href="/menu" data-i18n="navbar.menu">Menú</a>
          <a href="/reservas" data-i18n="navbar.reservations">Reservas</a>
          <a href="/events" data-i18n="navbar.events">Eventos</a>
          <a href="/contacto" data-i18n="navbar.contact">Contacto</a>
          
          <!-- Selector de idioma -->
          <div class="language-selector-container">
            <language-selector></language-selector>
          </div>
          
          <!-- Carrito de compras -->
          <div class="cart-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span class="cart-count" id="cart-count">0</span>
          </div>
          
          <!-- Sección de autenticación -->
          <div class="auth-section">
            <div class="auth-buttons" id="auth-buttons">
              <button class="btn-login" data-i18n="navbar.login">Iniciar Sesión</button>
              <button class="btn-register">Registrarse</button>
            </div>

            <div class="user-menu" id="user-menu">
              <button class="user-menu-trigger" id="user-menu-trigger" type="button">
                <span id="user-name">Usuario</span>
                <i data-feather="chevron-down"></i>
              </button>
              <div class="user-menu-dropdown" id="user-menu-dropdown">
                <button class="user-menu-item" id="user-menu-reservations" type="button"><i data-feather="calendar"></i> Mis Reservas</button>
                <button class="user-menu-item" id="user-menu-covers" type="button"><i data-feather="credit-card"></i> Mis Covers (QR)</button>
                <button class="user-menu-item" id="user-menu-orders" type="button"><i data-feather="shopping-bag"></i> Mis Pedidos</button>
                <div style="height:1px;background:rgba(0,0,0,0.08);margin:8px 0"></div>
                <button class="user-menu-item" id="user-menu-logout" type="button"><i data-feather="log-out"></i> Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;
    
    // Manejar el menú móvil
    const menuBtn = this.shadowRoot.querySelector('.mobile-menu-btn');
    const navLinks = this.shadowRoot.querySelector('.nav-links');
    
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuBtn.innerHTML = navLinks.classList.contains('active') ? 
        '<i data-feather="x"></i>' : '<i data-feather="menu"></i>';
      feather.replace();
    });
    
    // Manejar eventos de autenticación
    const loginBtn = this.shadowRoot.querySelector('.btn-login');
    const registerBtn = this.shadowRoot.querySelector('.btn-register');
    const userMenuTrigger = this.shadowRoot.getElementById('user-menu-trigger');
    const userMenuDropdown = this.shadowRoot.getElementById('user-menu-dropdown');
    const userMenuReservations = this.shadowRoot.getElementById('user-menu-reservations');
    const userMenuCovers = this.shadowRoot.getElementById('user-menu-covers');
    const userMenuOrders = this.shadowRoot.getElementById('user-menu-orders');
    const userMenuLogout = this.shadowRoot.getElementById('user-menu-logout');
    const cartIcon = this.shadowRoot.querySelector('.cart-icon');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (window.authModal) {
          window.authModal.open('login');
        } else {
          console.error('authModal no está disponible');
        }
      });
    }
    
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        if (window.authModal) {
          window.authModal.open('register');
        } else {
          console.error('authModal no está disponible');
        }
      });
    }
    
    if (userMenuTrigger && userMenuDropdown) {
      userMenuTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuDropdown.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
        const inside = path.includes(this) || (this.shadowRoot && path.includes(this.shadowRoot)) || (this.shadowRoot && path.some(n => this.shadowRoot.contains(n)));
        if (!inside && userMenuDropdown) {
          userMenuDropdown.classList.remove('active');
        }
      });
    }

    if (userMenuReservations) {
      userMenuReservations.addEventListener('click', () => {
        if (window.userPanel && typeof window.userPanel.openTab === 'function') {
          window.userPanel.openTab('reservations');
        }
        if (userMenuDropdown) userMenuDropdown.classList.remove('active');
      });
    }

    if (userMenuCovers) {
      userMenuCovers.addEventListener('click', () => {
        if (window.userPanel && typeof window.userPanel.openTab === 'function') {
          window.userPanel.openTab('covers');
        }
        if (userMenuDropdown) userMenuDropdown.classList.remove('active');
      });
    }

    if (userMenuOrders) {
      userMenuOrders.addEventListener('click', () => {
        if (window.userPanel && typeof window.userPanel.openTab === 'function') {
          window.userPanel.openTab('orders');
        }
        if (userMenuDropdown) userMenuDropdown.classList.remove('active');
      });
    }

    if (userMenuLogout) {
      userMenuLogout.addEventListener('click', () => {
        if (window.auth) {
          window.auth.logout();
        }
        if (userMenuDropdown) userMenuDropdown.classList.remove('active');
        this.syncAuthUI();
      });
    }
    
    if (cartIcon) {
      cartIcon.addEventListener('click', () => {
        if (window.cart) {
          window.cart.toggle();
        } else {
          console.error('cart no está disponible');
        }
      });
    }

    this.syncAuthUI();

    window.addEventListener('auth-changed', () => {
      this.syncAuthUI();
    });

    // Escuchar cambios de idioma
    window.addEventListener('languageChanged', () => {
      this.applyTranslations();
    });
  }
  
  applyTranslations() {
    if (!window.i18n) return;
    
    const elements = this.shadowRoot.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = window.i18n.t(key);
      if (translation && translation !== key) {
        element.textContent = translation;
      }
    });
  }

  syncAuthUI() {
    try {
      const authButtons = this.shadowRoot && this.shadowRoot.getElementById('auth-buttons');
      const userMenu = this.shadowRoot && this.shadowRoot.getElementById('user-menu');
      const userName = this.shadowRoot && this.shadowRoot.getElementById('user-name');
      const dropdown = this.shadowRoot && this.shadowRoot.getElementById('user-menu-dropdown');

      const user = window.auth && typeof window.auth.getCurrentUser === 'function'
        ? window.auth.getCurrentUser()
        : null;

      if (user) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (userName) userName.textContent = user.name || 'Usuario';
      } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (dropdown) dropdown.classList.remove('active');
      }

      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    } catch (e) {}
  }
}

customElements.define('custom-navbar', CustomNavbar);