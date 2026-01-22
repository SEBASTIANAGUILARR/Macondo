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
        }
        
        .logo img {
          height: 40px;
          margin-right: 0.5rem;
        }
        
        .nav-links {
          display: flex;
          gap: 2rem;
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
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background-color 0.3s ease;
        }
        
        .cart-icon:hover {
          background-color: rgba(146, 64, 14, 0.1);
        }
        
        .cart-icon i {
          color: white;
        }
        
        .cart-main {
          font-size: 1.5rem;
        }
        
        .cart-count {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #dc2626;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
        }
        
        @media (max-width: 768px) {
          .nav-links {
            position: fixed;
            top: 70px;
            left: 0;
            width: 100%;
            background-color: rgba(251, 191, 36, 0.98);
            flex-direction: column;
            align-items: center;
            padding: 1rem 0;
            gap: 1rem;
            transform: translateY(-150%);
            transition: transform 0.3s ease;
            z-index: 999;
          }
          
          .nav-links.active {
            transform: translateY(0);
          }
          
          .mobile-menu-btn {
            display: block;
          }
        }
      </style>
      
      <nav>
        <a href="index.html" class="logo">
          <img src="http://static.photos/food/200x200/1" alt="Macondo Bar Latino">
          Macondo Bar Latino
        </a>
        
        <button class="mobile-menu-btn">
          <i data-feather="menu"></i>
        </button>
        
        <div class="nav-links">
          <a href="menu.html">Menú</a>
          <a href="#reservas">Reservas</a>
          <a href="#eventos">Eventos</a>
          <a href="#contacto">Contacto</a>
          
          <!-- Carrito de compras -->
          <div class="cart-icon">
            <i data-feather="shopping-cart" class="cart-main"></i>
            <div style="position: relative;">
              <i data-feather="shopping-bag"></i>
              <span class="cart-count" id="cart-count">0</span>
            </div>
          </div>
          
          <!-- Sección de autenticación -->
          <div class="auth-section">
            <div class="auth-buttons" id="auth-buttons">
              <button class="btn-login">Iniciar Sesión</button>
              <button class="btn-register">Registrarse</button>
            </div>
            
            <div class="user-info" id="user-info">
              <span class="user-name" id="user-name">Usuario</span>
              <button class="btn-logout">Cerrar Sesión</button>
              <button class="btn-login" style="margin-left: 0.5rem;">Mi Panel</button>
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
    const logoutBtn = this.shadowRoot.querySelector('.btn-logout');
    const userPanelBtn = this.shadowRoot.querySelector('.user-info .btn-login');
    const cartIcon = this.shadowRoot.querySelector('.cart-icon');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (window.authModal) {
          window.authModal.open();
        } else {
          console.error('authModal no está disponible');
        }
      });
    }
    
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        if (window.authModal) {
          window.authModal.open();
        } else {
          console.error('authModal no está disponible');
        }
      });
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (window.auth) {
          window.auth.logout();
        } else {
          console.error('auth no está disponible');
        }
      });
    }
    
    if (userPanelBtn) {
      userPanelBtn.addEventListener('click', () => {
        if (window.userPanel) {
          window.userPanel.open();
        } else {
          console.error('userPanel no está disponible');
        }
      });
    }
    
    if (cartIcon) {
      cartIcon.addEventListener('click', () => {
        if (window.cart) {
          window.cart.toggleCart();
        } else {
          console.error('cart no está disponible');
        }
      });
    }
  }
}

customElements.define('custom-navbar', CustomNavbar);