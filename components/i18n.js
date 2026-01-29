class I18n {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
        this.supportedLanguages = ['es', 'en', 'pl'];
        this.fallbackLanguage = 'en';
        
        this.init();
    }

    async init() {
        // Detectar idioma del navegador
        this.detectLanguage();
        
        // Cargar traducciones
        await this.loadTranslations(this.currentLang);
        
        // Aplicar traducciones a la página
        this.applyTranslations();
        
        // Configurar listener para cambios de idioma
        this.setupLanguageListener();
    }

    detectLanguage() {
        // Obtener idioma guardado en localStorage
        const savedLanguage = localStorage.getItem('macondo-language');
        if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
            this.currentLang = savedLanguage;
            return;
        }

        // Detectar idioma del sistema (preferencia del navegador)
        const languages = Array.isArray(navigator.languages) && navigator.languages.length > 0
            ? navigator.languages
            : [navigator.language || navigator.userLanguage || 'en'];

        const first = String(languages[0] || 'en').toLowerCase();
        const langCode = first.split('-')[0];

        if (langCode === 'es') {
            this.currentLang = 'es';
        } else if (langCode === 'pl') {
            this.currentLang = 'pl';
        } else {
            this.currentLang = 'en';
        }
        
        // Guardar idioma detectado
        localStorage.setItem('macondo-language', this.currentLang);
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}`);
            }
            this.translations[lang] = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            // Cargar idioma de respaldo si falla
            if (lang !== this.fallbackLanguage) {
                await this.loadTranslations(this.fallbackLanguage);
                this.currentLang = this.fallbackLanguage;
            }
        }
    }

    async changeLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.error(`Language ${lang} is not supported`);
            return;
        }

        if (!this.translations[lang]) {
            await this.loadTranslations(lang);
        }

        this.currentLang = lang;
        localStorage.setItem('macondo-language', lang);
        this.applyTranslations();
        
        // Disparar evento de cambio de idioma
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                // Intentar con idioma de respaldo
                translation = this.translations[this.fallbackLanguage];
                for (const fallbackKey of keys) {
                    if (translation && translation[fallbackKey]) {
                        translation = translation[fallbackKey];
                    } else {
                        return key; // Retornar clave si no se encuentra traducción
                    }
                }
                break;
            }
        }

        // Reemplazar parámetros
        if (typeof translation === 'string' && Object.keys(params).length > 0) {
            Object.keys(params).forEach(param => {
                translation = translation.replace(`{{${param}}}`, params[param]);
            });
        }

        return translation || key;
    }

    applyTranslations() {
        // Aplicar traducciones a elementos con atributo data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.type === 'submit' || element.type === 'button') {
                    element.value = translation;
                } else {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // Aplicar traducciones a elementos con atributo data-i18n-html
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            element.innerHTML = this.t(key);
        });

        // Actualizar atributos como title, alt, etc.
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const key = element.getAttribute('data-i18n-alt');
            element.alt = this.t(key);
        });

        // Actualizar idioma del documento
        document.documentElement.lang = this.currentLang;
        
        // Actualizar dirección del texto (RTL/LTR)
        const rtlLanguages = ['ar', 'he', 'fa'];
        document.documentElement.dir = rtlLanguages.includes(this.currentLang) ? 'rtl' : 'ltr';
    }

    setupLanguageListener() {
        // Escuchar cambios de idioma desde otros componentes
        window.addEventListener('languageChanged', (event) => {
            console.log(`Language changed to: ${event.detail.language}`);
        });
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    getLanguageName(lang) {
        const names = {
            'es': 'Español',
            'en': 'English',
            'pl': 'Polski'
        };
        return names[lang] || lang;
    }
}

// Crear instancia global
window.i18n = new I18n();

// Función helper para uso en templates
window.t = (key, params) => window.i18n.t(key, params);
