class LanguageSelector extends HTMLElement {
    constructor() {
        super();
        this.isOpen = false;
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const flags = {
            'es': '🇪🇸',
            'en': '🇬🇧',
            'pl': '🇵🇱'
        };
        
        const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'es';
        const currentFlag = flags[currentLang] || '🇪🇸';
        
        this.innerHTML = `
            <style>
                .lang-selector {
                    position: relative;
                }
                .lang-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(255,255,255,0.3);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 1.25rem;
                }
                .lang-toggle:hover {
                    background: rgba(255,255,255,0.5);
                    transform: scale(1.05);
                }
                .lang-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 0.5rem;
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    overflow: hidden;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.2s ease;
                    z-index: 100;
                    min-width: 140px;
                }
                .lang-dropdown.open {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }
                .lang-option {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: #333;
                    transition: background 0.2s ease;
                }
                .lang-option:hover {
                    background: #fef3c7;
                }
                .lang-option.active {
                    background: #fef3c7;
                    font-weight: 600;
                }
                .lang-option span.flag {
                    font-size: 1.25rem;
                }
            </style>
            <div class="lang-selector">
                <button class="lang-toggle" id="lang-toggle" aria-label="Cambiar idioma">
                    <span id="current-flag">${currentFlag}</span>
                </button>
                <div class="lang-dropdown" id="lang-dropdown">
                    <button class="lang-option" data-lang="es">
                        <span class="flag">🇪🇸</span>
                        <span>Español</span>
                    </button>
                    <button class="lang-option" data-lang="en">
                        <span class="flag">🇬🇧</span>
                        <span>English</span>
                    </button>
                    <button class="lang-option" data-lang="pl">
                        <span class="flag">🇵🇱</span>
                        <span>Polski</span>
                    </button>
                </div>
            </div>
        `;

        this.updateCurrentLanguage();
    }

    attachEventListeners() {
        const toggle = this.querySelector('#lang-toggle');
        const dropdown = this.querySelector('#lang-dropdown');
        const options = this.querySelectorAll('.lang-option');

        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isOpen = !this.isOpen;
            dropdown.classList.toggle('open', this.isOpen);
        });

        // Language selection
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.dataset.lang;
                this.changeLanguage(lang);
                this.closeDropdown();
            });
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });

        // Listen for language changes
        window.addEventListener('languageChanged', () => {
            this.updateCurrentLanguage();
        });
    }

    closeDropdown() {
        this.isOpen = false;
        const dropdown = this.querySelector('#lang-dropdown');
        if (dropdown) {
            dropdown.classList.remove('open');
        }
    }

    changeLanguage(lang) {
        if (window.i18n) {
            window.i18n.changeLanguage(lang);
        }
    }

    updateCurrentLanguage() {
        const flags = {
            'es': '🇪🇸',
            'en': '🇬🇧',
            'pl': '🇵🇱'
        };
        
        if (window.i18n) {
            const currentLang = window.i18n.getCurrentLanguage();
            const currentFlagEl = this.querySelector('#current-flag');
            const options = this.querySelectorAll('.lang-option');
            
            if (currentFlagEl) {
                currentFlagEl.textContent = flags[currentLang] || '🇪🇸';
            }

            // Update active state
            options.forEach(option => {
                if (option.dataset.lang === currentLang) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }
    }
}

// Registrar el componente
customElements.define('language-selector', LanguageSelector);
