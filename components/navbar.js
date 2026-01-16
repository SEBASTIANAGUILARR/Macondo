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
          <a href="#menu">Menú</a>
          <a href="#reservas">Reservas</a>
          <a href="#eventos">Eventos</a>
          <a href="#contacto">Contacto</a>
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
  }
}

customElements.define('custom-navbar', CustomNavbar);