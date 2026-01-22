// Stripe Checkout Integration
// IMPORTANTE: Reemplaza con tu clave pública de Stripe
const STRIPE_PUBLIC_KEY = 'TU_STRIPE_PUBLIC_KEY'; // pk_test_xxx o pk_live_xxx

// URL base para redirecciones (cambia esto a tu dominio en producción)
const BASE_URL = window.location.origin;

// Inicializar Stripe
let stripeInstance = null;

function initStripe() {
  if (typeof Stripe !== 'undefined' && STRIPE_PUBLIC_KEY !== 'TU_STRIPE_PUBLIC_KEY') {
    stripeInstance = Stripe(STRIPE_PUBLIC_KEY);
    console.log('Stripe inicializado correctamente');
    return true;
  }
  console.warn('Stripe no configurado. Por favor, configura STRIPE_PUBLIC_KEY');
  return false;
}

// Sistema de Pagos con Stripe
const StripeCheckout = {
  // Crear sesión de checkout y redirigir
  async redirectToCheckout(items, customerEmail = null) {
    if (!stripeInstance) {
      console.error('Stripe no está inicializado');
      showNotification('Error: Sistema de pagos no disponible', 'error');
      return { success: false, error: 'Stripe no configurado' };
    }

    try {
      // Preparar los line items para Stripe
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'pln', // Zloty polaco para BLIK
          product_data: {
            name: item.name,
            description: item.description || '',
            images: item.image ? [item.image] : []
          },
          unit_amount: Math.round(item.price * 100) // Stripe usa centavos
        },
        quantity: item.quantity || 1
      }));

      // Crear la sesión de checkout en el servidor
      // NOTA: En producción, esto debe hacerse desde un backend seguro
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lineItems,
          customerEmail,
          successUrl: `${BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${BASE_URL}/index.html#menu`
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear sesión de checkout');
      }

      const session = await response.json();

      // Redirigir a Stripe Checkout
      const { error } = await stripeInstance.redirectToCheckout({
        sessionId: session.id
      });

      if (error) {
        console.error('Error en redirect:', error);
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error en checkout:', err);
      showNotification('Error al procesar el pago. Intenta de nuevo.', 'error');
      return { success: false, error: err.message };
    }
  },

  // Método simplificado para checkout con Stripe Checkout (modo cliente)
  // Este método usa Price IDs predefinidos en Stripe Dashboard
  async checkoutWithPriceIds(priceItems, customerEmail = null) {
    if (!stripeInstance) {
      showNotification('Error: Sistema de pagos no disponible', 'error');
      return { success: false, error: 'Stripe no configurado' };
    }

    try {
      const { error } = await stripeInstance.redirectToCheckout({
        lineItems: priceItems.map(item => ({
          price: item.priceId,
          quantity: item.quantity || 1
        })),
        mode: 'payment',
        successUrl: `${BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${BASE_URL}/index.html#menu`,
        customerEmail: customerEmail,
        // Habilitar BLIK y otros métodos de pago
        paymentMethodTypes: ['card', 'blik', 'p24']
      });

      if (error) {
        showNotification(error.message, 'error');
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      showNotification('Error al procesar el pago', 'error');
      return { success: false, error: err.message };
    }
  },

  // Checkout directo desde el carrito
  async checkoutFromCart() {
    // Obtener items del carrito
    const cart = JSON.parse(localStorage.getItem('macondo_cart') || '[]');
    
    if (cart.length === 0) {
      showNotification('El carrito está vacío', 'error');
      return { success: false, error: 'Carrito vacío' };
    }

    // Obtener email del usuario si está logueado
    const user = JSON.parse(localStorage.getItem('macondo_user') || 'null');
    const customerEmail = user?.email || null;

    // Preparar items para checkout
    const items = cart.map(item => ({
      name: item.name,
      description: item.category || 'Producto Macondo',
      price: item.price,
      quantity: item.quantity,
      image: item.image || null
    }));

    return await this.redirectToCheckout(items, customerEmail);
  }
};

// Función para iniciar checkout desde cualquier botón
function initiateStripeCheckout(productName, price, quantity = 1, description = '') {
  const items = [{
    name: productName,
    description: description,
    price: price,
    quantity: quantity
  }];

  StripeCheckout.redirectToCheckout(items);
}

// Función para checkout del carrito completo
function checkoutCart() {
  StripeCheckout.checkoutFromCart();
}

// Configurar botones de pago
function setupPaymentButtons() {
  // Botón de checkout en el carrito
  const checkoutBtn = document.querySelector('#checkout-btn, .checkout-button, [data-checkout]');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      checkoutCart();
    });
  }

  // Botones de compra directa en productos
  document.querySelectorAll('[data-stripe-product]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productName = btn.dataset.productName || 'Producto';
      const price = parseFloat(btn.dataset.price) || 0;
      const quantity = parseInt(btn.dataset.quantity) || 1;
      const description = btn.dataset.description || '';
      
      initiateStripeCheckout(productName, price, quantity, description);
    });
  });
}

// Verificar estado de la sesión de pago (para página de éxito)
async function checkPaymentStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  if (sessionId) {
    try {
      // En producción, verificar el estado en el servidor
      const response = await fetch(`/api/check-session?session_id=${sessionId}`);
      if (response.ok) {
        const session = await response.json();
        return session;
      }
    } catch (err) {
      console.error('Error verificando sesión:', err);
    }
  }

  return null;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initStripe();
  setupPaymentButtons();
});

// Exportar para uso global
window.StripeCheckout = StripeCheckout;
window.initiateStripeCheckout = initiateStripeCheckout;
window.checkoutCart = checkoutCart;
window.checkPaymentStatus = checkPaymentStatus;
