class CustomHero extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: 70px; /* Para compensar el navbar fijo */
        }
        
        .hero {
          position: relative;
          height: 80vh;
          min-height: 500px;
          background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), 
                      url('http://static.photos/restaurant/1200x630/1');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
          padding: 0 2rem;
        }
        
        .hero-content {
          max-width: 800px;
          animation: fadeIn 1s ease;
        }
        
        .hero h1 {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .hero p {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        .hero-btn {
          display: inline-block;
          background-color: #d97706;
          color: white;
          font-weight: 600;
          padding: 0.75rem 2rem;
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin: 0.5rem;
        }
        
        .hero-btn-secondary {
          background-color: transparent;
          border: 2px solid #d97706;
          color: white;
        }
        
        .hero-btn-secondary:hover {
          background-color: #d97706;
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }
        
        .hero-buttons {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .hero-btn:hover {
          background-color: #b45309;
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }
        
        @media (max-width: 768px) {
          :host {
            margin-top: 56px;
          }
          
          .hero {
            height: 70vh;
            min-height: 400px;
            padding: 0 1rem;
          }
          
          .hero h1 {
            font-size: 2rem;
            margin-bottom: 0.75rem;
          }
          
          .hero p {
            font-size: 0.95rem;
            margin-bottom: 1.5rem;
            line-height: 1.5;
          }
          
          .hero-buttons {
            flex-direction: column;
            gap: 0.75rem;
            width: 100%;
            max-width: 280px;
            margin: 0 auto;
          }
          
          .hero-btn {
            width: 100%;
            padding: 0.875rem 1.5rem;
            font-size: 1rem;
            text-align: center;
          }
        }
        
        @media (max-width: 480px) {
          :host {
            margin-top: 48px;
          }
          
          .hero {
            height: 65vh;
            min-height: 350px;
          }
          
          .hero h1 {
            font-size: 1.75rem;
          }
          
          .hero p {
            font-size: 0.9rem;
          }
          
          .hero-btn {
            padding: 0.75rem 1.25rem;
            font-size: 0.95rem;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      
      <section class="hero">
        <div class="hero-content">
          <h1 data-i18n="hero.title">Macondo Bar Latino</h1>
          <p data-i18n="hero.description">Disfruta de la mejor comida colombiana, cócteles tropicales y un ambiente vibrante que te transportará directamente a Latinoamérica.</p>
          <div class="hero-buttons">
            <a href="#menu" class="hero-btn" data-i18n="hero.orderButton">Pedir Ahora</a>
            <a href="#reservas" class="hero-btn hero-btn-secondary" data-i18n="hero.reserveButton">Reservar Mesa</a>
          </div>
        </div>
      </section>
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

customElements.define('custom-hero', CustomHero);