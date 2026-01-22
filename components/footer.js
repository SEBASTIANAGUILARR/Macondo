class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: #92400e;
          color: white;
          padding: 3rem 2rem;
        }
        
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }
        
        .footer-logo {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }
        
        .footer-logo img {
          height: 40px;
          margin-right: 0.5rem;
        }
        
        .footer-about p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        .footer-links h3, .footer-contact h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          position: relative;
          padding-bottom: 0.5rem;
        }
        
        .footer-links h3::after, .footer-contact h3::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 50px;
          height: 2px;
          background-color: #f59e0b;
        }
        
        .footer-links ul {
          list-style: none;
          padding: 0;
        }
        
        .footer-links li {
          margin-bottom: 0.75rem;
        }
        
        .footer-links a {
          color: white;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .footer-links a:hover {
          color: #fcd34d;
        }
        
        .footer-contact p {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }
        
        .footer-contact i {
          margin-right: 0.5rem;
          color: #f59e0b;
        }
        
        .social-links {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .social-links a {
          color: white;
          background-color: rgba(255, 255, 255, 0.1);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .social-links a:hover {
          background-color: #f59e0b;
          transform: translateY(-3px);
        }
        
        .footer-bottom {
          text-align: center;
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        @media (max-width: 768px) {
          :host {
            padding: 2rem 1rem;
          }
          
          .footer-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            text-align: center;
          }
          
          .footer-logo {
            justify-content: center;
            font-size: 1.25rem;
          }
          
          .footer-about p {
            font-size: 0.9rem;
          }
          
          .footer-links h3::after, .footer-contact h3::after {
            left: 50%;
            transform: translateX(-50%);
          }
          
          .footer-links ul {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem 1rem;
          }
          
          .footer-links li {
            margin-bottom: 0;
          }
          
          .footer-links a {
            padding: 0.5rem;
            display: inline-block;
          }
          
          .footer-contact p {
            justify-content: center;
            font-size: 0.9rem;
          }
          
          .social-links {
            justify-content: center;
          }
          
          .social-links a {
            width: 44px;
            height: 44px;
          }
          
          .footer-bottom {
            margin-top: 2rem;
            padding-top: 1rem;
          }
          
          .footer-bottom p {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 480px) {
          :host {
            padding: 1.5rem 0.75rem;
          }
          
          .footer-logo {
            font-size: 1.1rem;
          }
          
          .footer-logo img {
            height: 32px;
          }
          
          .footer-links h3, .footer-contact h3 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
          }
        }
      </style>
      
      <div class="footer-container">
        <div class="footer-about">
          <div class="footer-logo">
            <img src="http://static.photos/food/200x200/1" alt="Macondo Bar Latino">
            Macondo Bar Latino
          </div>
          <div class="social-links">
            <a href="#"><i data-feather="facebook"></i></a>
            <a href="#"><i data-feather="instagram"></i></a>
          </div>
        </div>
        
        <div class="footer-contact">
          <h3 data-i18n="navbar.contact">Contacto</h3>
          <p><i data-feather="map-pin"></i> Calle 85 #12-45, Bogotá</p>
          <p><i data-feather="phone"></i> +57 1 345 6789</p>
          <p><i data-feather="mail"></i> info@macondobar.com</p>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; <span id="current-year">2023</span> Macondo Bar Latino. <span data-i18n="footer.rights">Todos los derechos reservados.</span></p>
      </div>
    `;
    
    // Aplicar traducciones dentro del Shadow DOM
    this.applyTranslations();
    
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
}

customElements.define('custom-footer', CustomFooter);