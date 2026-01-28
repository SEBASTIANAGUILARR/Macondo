class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: #92400e;
          color: white;
          padding: 2.5rem 1.5rem;
          box-shadow: 0 100vmax 0 100vmax #92400e;
          clip-path: inset(0 -100vmax);
        }

        .footer-container {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-logo img {
          height: 56px;
          width: auto;
        }

        .map-card {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          overflow: hidden;
        }

        .map-frame {
          width: 100%;
          height: 320px;
          border: 0;
        }

        .map-actions {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.08);
        }

        .map-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background-color: #f59e0b;
          color: #5a2e0a;
          font-weight: 800;
          text-decoration: none;
          padding: 0.75rem 1.25rem;
          border-radius: 0.75rem;
          transition: transform 0.15s ease, background-color 0.2s ease;
        }

        .map-button:hover {
          background-color: #fbbf24;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          :host {
            padding: 2rem 1rem;
          }

          .footer-logo img {
            height: 52px;
          }

          .map-frame {
            height: 280px;
          }
        }
      </style>
      
      <div class="footer-container">
        <div class="footer-logo">
          <img src="logoamarillo.png" alt="Macondo Bar Latino">
        </div>

        <div class="map-card">
          <iframe
            class="map-frame"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=52.2250841,21.01948&z=16&output=embed">
          </iframe>
          <div class="map-actions">
            <a class="map-button" href="https://maps.app.goo.gl/SubxFp7CB7s8yKdz7" target="_blank" rel="noopener noreferrer">
              Ir a Macondo
            </a>
          </div>
        </div>
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