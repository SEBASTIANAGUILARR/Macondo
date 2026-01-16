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
        }
        
        .hero-btn:hover {
          background-color: #b45309;
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }
        
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }
          
          .hero p {
            font-size: 1rem;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      
      <section class="hero">
        <div class="hero-content">
          <h1>Macondo Restaurante Bar</h1>
          <p>Disfruta de la mejor gastronomía colombiana en un ambiente cálido y acogedor, acompañado de música en vivo y los mejores cócteles.</p>
          <a href="#reservas" class="hero-btn">Reserva Ahora</a>
        </div>
      </section>
    `;
  }
}

customElements.define('custom-hero', CustomHero);