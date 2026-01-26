// Analytics Tracker para Macondo Bar Latino
// Este script registra visitas, clicks y eventos en Supabase

(function() {
    const SUPABASE_URL = 'https://imqcifvmklkccwagpkee.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWNpZnZta2xrY2N3YWdwa2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjMzNDIsImV4cCI6MjA4NDY5OTM0Mn0.fP4S0VfaC823LKUvh6HcybS_ze9uWWrBKgC4SsQBiRU';
    
    // Generar o recuperar ID de visitante
    function getVisitorId() {
        let visitorId = localStorage.getItem('macondo_visitor_id');
        if (!visitorId) {
            visitorId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('macondo_visitor_id', visitorId);
        }
        return visitorId;
    }
    
    // Generar ID de sesión
    function getSessionId() {
        let sessionId = sessionStorage.getItem('macondo_session_id');
        if (!sessionId) {
            sessionId = 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('macondo_session_id', sessionId);
        }
        return sessionId;
    }
    
    // Detectar tipo de dispositivo
    function getDeviceType() {
        const ua = navigator.userAgent.toLowerCase();
        if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
        if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
        return 'desktop';
    }
    
    // Obtener fuente de tráfico
    function getTrafficSource() {
        const referrer = document.referrer.toLowerCase();
        if (!referrer) return 'direct';
        if (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo')) return 'organic';
        if (referrer.includes('facebook') || referrer.includes('instagram') || referrer.includes('twitter') || referrer.includes('tiktok') || referrer.includes('linkedin')) return 'social';
        if (referrer.includes(window.location.hostname)) return 'internal';
        return 'referral';
    }
    
    // Obtener nombre de página limpio
    function getPageName() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '');
    }
    
    // Enviar evento a Supabase
    async function trackEvent(eventType, eventData = {}) {
        try {
            const payload = {
                visitor_id: getVisitorId(),
                session_id: getSessionId(),
                event_type: eventType,
                page_url: getPageName(),
                full_url: window.location.href,
                referrer: document.referrer || null,
                device_type: getDeviceType(),
                traffic_source: getTrafficSource(),
                user_agent: navigator.userAgent,
                screen_width: window.innerWidth,
                screen_height: window.innerHeight,
                language: navigator.language,
                ...eventData
            };
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                console.warn('Analytics tracking failed:', response.status);
            }
        } catch (err) {
            console.warn('Analytics error:', err);
        }
    }
    
    // Registrar vista de página
    function trackPageView() {
        trackEvent('pageview');
    }
    
    // Registrar clicks en elementos importantes
    function trackClicks() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a, [data-track]');
            if (target) {
                const trackData = {
                    element_type: target.tagName.toLowerCase(),
                    element_text: (target.textContent || '').trim().substring(0, 100),
                    element_id: target.id || null,
                    element_class: target.className || null
                };
                
                // Detectar acciones específicas
                if (target.closest('[onclick*="cart"]') || target.textContent.includes('Carrito')) {
                    trackData.action = 'add_to_cart';
                } else if (target.href && target.href.includes('reserv')) {
                    trackData.action = 'reservation_click';
                } else if (target.href && target.href.includes('menu')) {
                    trackData.action = 'menu_click';
                } else if (target.href && target.href.includes('event')) {
                    trackData.action = 'event_click';
                }
                
                trackEvent('click', trackData);
            }
        });
    }
    
    // Registrar scroll (cada 25%)
    let scrollMilestones = [25, 50, 75, 100];
    let trackedMilestones = [];
    
    function trackScroll() {
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !trackedMilestones.includes(milestone)) {
                    trackedMilestones.push(milestone);
                    trackEvent('scroll', { scroll_depth: milestone });
                }
            });
        });
    }
    
    // Registrar tiempo en página al salir
    let pageLoadTime = Date.now();
    
    function trackTimeOnPage() {
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
            
            // Usar sendBeacon para enviar antes de cerrar
            const payload = {
                visitor_id: getVisitorId(),
                session_id: getSessionId(),
                event_type: 'page_exit',
                page_url: getPageName(),
                time_on_page: timeOnPage,
                device_type: getDeviceType(),
                traffic_source: getTrafficSource()
            };
            
            navigator.sendBeacon(
                `${SUPABASE_URL}/rest/v1/analytics`,
                new Blob([JSON.stringify(payload)], { type: 'application/json' })
            );
        });
    }
    
    // Inicializar tracking
    function init() {
        // No trackear en admin
        if (window.location.pathname.includes('admin')) return;
        
        trackPageView();
        trackClicks();
        trackScroll();
        trackTimeOnPage();
        
        console.log('📊 Analytics tracker initialized');
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Exponer función para tracking manual
    window.MacondoAnalytics = {
        track: trackEvent,
        getVisitorId: getVisitorId,
        getSessionId: getSessionId
    };
})();
