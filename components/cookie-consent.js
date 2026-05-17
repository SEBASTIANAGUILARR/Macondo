(function () {
  const STORAGE_KEY = 'macondo_cookie_consent_v1';

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }

  function getConsent() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeJsonParse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  }

  function setConsent(consent) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent('macondo:consent-changed', { detail: consent }));
  }

  function ensureStyles() {
    if (document.getElementById('macondo-cookie-consent-styles')) return;
    const style = document.createElement('style');
    style.id = 'macondo-cookie-consent-styles';
    style.textContent = `
      .mc-consent-backdrop{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.45);display:none}
      .mc-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#111827;color:#fff;padding:16px 16px 14px;border-top:1px solid rgba(255,255,255,.12);display:none}
      .mc-consent__wrap{max-width:1100px;margin:0 auto;display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
      .mc-consent__title{font-weight:700;font-size:14px;margin:0 0 6px}
      .mc-consent__text{font-size:13px;line-height:1.4;color:rgba(255,255,255,.86);margin:0}
      .mc-consent__actions{display:flex;gap:10px;flex-wrap:wrap}
      .mc-btn{appearance:none;border:0;border-radius:10px;padding:10px 14px;font-weight:700;font-size:13px;cursor:pointer}
      .mc-btn--primary{background:#d97706;color:#fff}
      .mc-btn--secondary{background:rgba(255,255,255,.12);color:#fff}
      .mc-btn--ghost{background:transparent;color:rgba(255,255,255,.86);text-decoration:underline;padding:10px 6px}
      .mc-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10000;background:#0b1220;color:#fff;width:min(560px,calc(100vw - 32px));border-radius:14px;border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 60px rgba(0,0,0,.5);display:none}
      .mc-modal__hd{padding:16px 16px 0}
      .mc-modal__bd{padding:10px 16px 16px}
      .mc-modal__ft{padding:0 16px 16px;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}
      .mc-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10)}
      .mc-toggle__meta{display:flex;flex-direction:column;gap:4px}
      .mc-toggle__name{font-weight:800;font-size:13px}
      .mc-toggle__desc{font-size:12px;color:rgba(255,255,255,.80)}
      .mc-switch{display:inline-flex;align-items:center;gap:8px}
      .mc-switch input{width:44px;height:24px;appearance:none;background:rgba(255,255,255,.18);border-radius:999px;position:relative;outline:none;cursor:pointer;transition:background .2s}
      .mc-switch input:checked{background:#d97706}
      .mc-switch input:before{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:999px;background:#fff;transition:transform .2s}
      .mc-switch input:checked:before{transform:translateX(20px)}
      .mc-note{font-size:12px;color:rgba(255,255,255,.75);margin-top:10px}
      @media (min-width: 900px){.mc-consent{padding:18px 18px 16px}.mc-consent__title{font-size:15px}.mc-consent__text{font-size:13px}}
    `;
    document.head.appendChild(style);
  }

  function createUI() {
    ensureStyles();

    const backdrop = document.createElement('div');
    backdrop.className = 'mc-consent-backdrop';
    backdrop.id = 'mc-consent-backdrop';

    const bar = document.createElement('div');
    bar.className = 'mc-consent';
    bar.id = 'mc-consent-bar';
    bar.innerHTML = `
      <div class="mc-consent__wrap">
        <div style="flex:1;min-width:260px">
          <p class="mc-consent__title">Cookies</p>
          <p class="mc-consent__text">Usamos cookies necesarias para el funcionamiento del sitio y opcionales para analítica. Puedes aceptar, rechazar o configurar tus preferencias.</p>
        </div>
        <div class="mc-consent__actions">
          <button type="button" class="mc-btn mc-btn--secondary" id="mc-consent-reject">Rechazar</button>
          <button type="button" class="mc-btn mc-btn--secondary" id="mc-consent-settings">Configurar</button>
          <button type="button" class="mc-btn mc-btn--primary" id="mc-consent-accept">Aceptar</button>
        </div>
      </div>
    `;

    const modal = document.createElement('div');
    modal.className = 'mc-modal';
    modal.id = 'mc-consent-modal';
    modal.innerHTML = `
      <div class="mc-modal__hd">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div>
            <p style="margin:0;font-weight:900;font-size:16px">Preferencias de cookies</p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,.78)">Puedes cambiar esto en cualquier momento desde este navegador.</p>
          </div>
          <button type="button" class="mc-btn mc-btn--ghost" id="mc-consent-close" aria-label="Cerrar">Cerrar</button>
        </div>
      </div>
      <div class="mc-modal__bd">
        <div class="mc-toggle" style="margin-top:10px">
          <div class="mc-toggle__meta">
            <div class="mc-toggle__name">Necesarias</div>
            <div class="mc-toggle__desc">Siempre activas. Permiten que el sitio funcione.</div>
          </div>
          <div class="mc-switch">
            <input type="checkbox" checked disabled aria-label="Cookies necesarias activas" />
          </div>
        </div>

        <div class="mc-toggle" style="margin-top:10px">
          <div class="mc-toggle__meta">
            <div class="mc-toggle__name">Analítica</div>
            <div class="mc-toggle__desc">Nos ayuda a entender el uso del sitio y mejorar la experiencia.</div>
          </div>
          <div class="mc-switch">
            <input id="mc-consent-analytics" type="checkbox" aria-label="Activar cookies de analítica" />
          </div>
        </div>

        <div class="mc-note">Al rechazar, solo se usarán cookies necesarias.</div>
      </div>
      <div class="mc-modal__ft">
        <button type="button" class="mc-btn mc-btn--secondary" id="mc-consent-save-reject">Rechazar</button>
        <button type="button" class="mc-btn mc-btn--primary" id="mc-consent-save">Guardar</button>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(bar);
    document.body.appendChild(modal);

    const els = {
      backdrop,
      bar,
      modal,
      accept: bar.querySelector('#mc-consent-accept'),
      reject: bar.querySelector('#mc-consent-reject'),
      settings: bar.querySelector('#mc-consent-settings'),
      close: modal.querySelector('#mc-consent-close'),
      analyticsToggle: modal.querySelector('#mc-consent-analytics'),
      save: modal.querySelector('#mc-consent-save'),
      saveReject: modal.querySelector('#mc-consent-save-reject')
    };

    function openModal() {
      els.backdrop.style.display = 'block';
      els.modal.style.display = 'block';
    }

    function closeModal() {
      els.backdrop.style.display = 'none';
      els.modal.style.display = 'none';
    }

    function hideBar() {
      els.bar.style.display = 'none';
    }

    function showBar() {
      els.bar.style.display = 'block';
    }

    function applyFromConsent(consent) {
      const analytics = !!consent?.analytics;
      els.analyticsToggle.checked = analytics;
    }

    function setAndClose(consent) {
      setConsent(consent);
      closeModal();
      hideBar();
    }

    els.accept.addEventListener('click', () => {
      setAndClose({ necessary: true, analytics: true, updatedAt: new Date().toISOString() });
    });

    els.reject.addEventListener('click', () => {
      setAndClose({ necessary: true, analytics: false, updatedAt: new Date().toISOString() });
    });

    els.settings.addEventListener('click', () => {
      const current = getConsent() || { necessary: true, analytics: false };
      applyFromConsent(current);
      openModal();
    });

    els.close.addEventListener('click', closeModal);
    els.backdrop.addEventListener('click', closeModal);

    els.saveReject.addEventListener('click', () => {
      setAndClose({ necessary: true, analytics: false, updatedAt: new Date().toISOString() });
    });

    els.save.addEventListener('click', () => {
      setAndClose({ necessary: true, analytics: !!els.analyticsToggle.checked, updatedAt: new Date().toISOString() });
    });

    const currentConsent = getConsent();
    if (currentConsent) {
      hideBar();
      applyFromConsent(currentConsent);
    } else {
      showBar();
      applyFromConsent({ necessary: true, analytics: false });
    }

    return {
      openPreferences: () => {
        const c = getConsent() || { necessary: true, analytics: false };
        applyFromConsent(c);
        openModal();
      }
    };
  }

  function init() {
    if (window.location.pathname.includes('admin')) return;

    const api = {
      get: () => getConsent(),
      hasAnalyticsConsent: () => {
        const c = getConsent();
        return !!(c && c.analytics);
      },
      set: (consent) => setConsent(consent),
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('macondo:consent-changed', { detail: null }));
      }
    };

    window.MacondoConsent = api;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const ui = createUI();
        window.MacondoConsentUI = ui;
      });
    } else {
      const ui = createUI();
      window.MacondoConsentUI = ui;
    }
  }

  init();
})();
