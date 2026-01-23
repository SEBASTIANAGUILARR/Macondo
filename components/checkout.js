class CheckoutSystem {
    constructor() {
        // No inicializar aquí, esperar a que el DOM esté listo
    }

    init() {
        // Solo crear el modal si el DOM está listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createCheckoutModal());
        } else {
            this.createCheckoutModal();
        }
        this.attachEventListeners();
    }

    createCheckoutModal() {
        const modalHTML = `
            <div id="checkout-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[9998] hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-amber-800">Finalizar Pedido</h2>
                            <button onclick="window.checkout.closeCheckout()" class="text-gray-500 hover:text-gray-700">
                                <i data-feather="x" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                    
                    <form id="checkout-form" class="p-6 space-y-6">
                        <!-- Resumen del pedido -->
                        <div class="bg-amber-50 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-amber-800 mb-3">Resumen del Pedido</h3>
                            <div id="checkout-items" class="space-y-2 mb-3">
                                <!-- Items se cargarán aquí -->
                            </div>
                            <div class="border-t pt-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-xl font-bold text-amber-800">Total:</span>
                                    <span class="text-xl font-bold text-amber-600" id="checkout-total">0,00 PLN</span>
                                </div>
                            </div>
                        </div>

                        <!-- Tipo de entrega -->
                        <div>
                            <h3 class="text-lg font-semibold text-amber-800 mb-3">Tipo de Entrega</h3>
                            <div class="space-y-2">
                                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-amber-50">
                                    <input type="radio" name="delivery-type" value="pickup" checked class="mr-3">
                                    <div>
                                        <span class="font-medium">Recoger en Restaurante</span>
                                        <p class="text-sm text-gray-600">Recoge tu pedido en Macondo Bar Latino</p>
                                    </div>
                                </label>
                                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-amber-50">
                                    <input type="radio" name="delivery-type" value="delivery" class="mr-3">
                                    <div>
                                        <span class="font-medium">Delivery</span>
                                        <p class="text-sm text-gray-600">Recibe tu pedido en domicilio</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Dirección de entrega (solo para delivery) -->
                        <div id="delivery-address" class="hidden">
                            <h3 class="text-lg font-semibold text-amber-800 mb-3">Dirección de Entrega</h3>
                            <div class="space-y-3">
                                <input type="text" id="street" placeholder="Calle" required 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                                <div class="grid grid-cols-2 gap-3">
                                    <input type="text" id="city" placeholder="Ciudad" required 
                                        class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                                    <input type="text" id="postal-code" placeholder="Código Postal" required 
                                        class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                                </div>
                            </div>
                        </div>

                        <!-- Información de contacto -->
                        <div>
                            <h3 class="text-lg font-semibold text-amber-800 mb-3">Información de Contacto</h3>
                            <div class="space-y-3">
                                <input type="tel" id="checkout-phone" placeholder="Teléfono" required 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                                <textarea id="checkout-notes" rows="3" placeholder="Notas especiales (opcional)" 
                                    class="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
                            </div>
                        </div>

                        <!-- Método de pago -->
                        <div>
                            <h3 class="text-lg font-semibold text-amber-800 mb-3">Método de Pago</h3>
                            <div class="space-y-2">
                                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-amber-50">
                                    <input type="radio" name="payment-method" value="cash" checked class="mr-3">
                                    <div>
                                        <span class="font-medium">Efectivo</span>
                                        <p class="text-sm text-gray-600">Paga al recibir</p>
                                    </div>
                                </label>
                                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-amber-50">
                                    <input type="radio" name="payment-method" value="card" class="mr-3">
                                    <div>
                                        <span class="font-medium">Tarjeta de Crédito/Débito</span>
                                        <p class="text-sm text-gray-600">Pago seguro en línea</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Botones -->
                        <div class="flex gap-3">
                            <button type="button" onclick="window.checkout.closeCheckout()" 
                                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" 
                                class="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                Confirmar Pedido
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        feather.replace();
    }

    attachEventListeners() {
        // Formulario de checkout
        document.getElementById('checkout-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processOrder();
        });

        // Tipo de entrega
        document.querySelectorAll('input[name="delivery-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const deliveryAddress = document.getElementById('delivery-address');
                if (e.target.value === 'delivery') {
                    deliveryAddress.classList.remove('hidden');
                } else {
                    deliveryAddress.classList.add('hidden');
                }
            });
        });

        // Close on background click
        document.getElementById('checkout-modal').addEventListener('click', (e) => {
            if (e.target.id === 'checkout-modal') {
                this.closeCheckout();
            }
        });
    }

    openCheckout() {
        if (!window.auth.isAuthenticated()) {
            window.cart.showNotification('Debes iniciar sesión para continuar', 'error');
            window.authModal.open();
            return;
        }

        if (window.cart.items.length === 0) {
            window.cart.showNotification('Tu carrito está vacío', 'error');
            return;
        }

        this.loadCheckoutData();
        document.getElementById('checkout-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeCheckout() {
        document.getElementById('checkout-modal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        document.getElementById('checkout-form').reset();
    }

    loadCheckoutData() {
        const user = window.auth.getCurrentUser();
        const items = window.cart.items;
        
        // Cargar items del carrito
        const itemsContainer = document.getElementById('checkout-items');
        itemsContainer.innerHTML = items.map(item => `
            <div class="flex justify-between items-center">
                <div>
                    <span class="font-medium">${item.name}</span>
                    <span class="text-gray-600 ml-2">x${item.quantity}</span>
                </div>
                <span class="font-medium">${(parseFloat(item.price.replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)} PLN</span>
            </div>
        `).join('');

        // Cargar total
        document.getElementById('checkout-total').textContent = `${window.cart.getTotal().toFixed(2)} PLN`;

        // Cargar información del usuario
        if (user) {
            document.getElementById('checkout-phone').value = user.phone || '';
        }
    }

    processOrder() {
        const formData = new FormData(document.getElementById('checkout-form'));
        const deliveryType = formData.get('delivery-type');
        const paymentMethod = formData.get('payment-method');
        
        const orderData = {
            cartItems: window.cart.items,
            userInfo: window.auth.getCurrentUser(),
            deliveryType: deliveryType,
            paymentMethod: paymentMethod,
            phone: document.getElementById('checkout-phone').value,
            notes: document.getElementById('checkout-notes').value
        };

        if (deliveryType === 'delivery') {
            orderData.address = {
                street: document.getElementById('street').value,
                city: document.getElementById('city').value,
                postalCode: document.getElementById('postal-code').value
            };
        }

        // Crear pedido
        const order = window.orderSystem.createOrder(orderData.cartItems, orderData.userInfo);
        
        // Actualizar datos adicionales del pedido
        order.type = deliveryType;
        order.paymentMethod = paymentMethod;
        order.phone = orderData.phone;
        order.notes = orderData.notes;
        order.address = orderData.address || null;
        
        window.orderSystem.saveOrders();

        // Limpiar carrito
        window.cart.clearCart();
        window.cart.closeCart();

        // Cerrar checkout
        this.closeCheckout();

        // Mostrar confirmación
        this.showOrderConfirmation(order);
    }

    showOrderConfirmation(order) {
        const modalHTML = `
            <div id="confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg max-w-md w-full p-6 text-center">
                    <div class="mb-4">
                        <i data-feather="check-circle" class="w-16 h-16 text-green-500 mx-auto"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-amber-800 mb-2">¡Pedido Confirmado!</h2>
                    <p class="text-gray-600 mb-4">Tu pedido #${order.id} ha sido recibido</p>
                    <div class="bg-amber-50 p-4 rounded-lg mb-4">
                        <p class="text-sm text-gray-600">Estado del pedido:</p>
                        <p class="font-semibold text-amber-800">Pendiente de confirmación</p>
                        <p class="text-sm text-gray-600 mt-2">Tiempo estimado: 30-45 minutos</p>
                    </div>
                    <button onclick="window.checkout.closeConfirmation()" 
                        class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        feather.replace();
    }

    closeConfirmation() {
        document.getElementById('confirmation-modal').remove();
    }
}

// Instancia global
window.checkout = new CheckoutSystem();
