class CartSystem {
    constructor() {
        this.items = [];
        this.init();
    }

    init() {
        // Cargar carrito desde localStorage
        const savedCart = localStorage.getItem('macondo_cart');
        if (savedCart) {
            this.items = JSON.parse(savedCart);
        }
        this.updateUI();
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.updateUI();
        this.showNotification(`${product.name} agregado al carrito`);
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateUI();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
            this.updateUI();
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => {
            // Reemplazar coma por punto para manejar formato PLN (35,00 -> 35.00)
            const price = parseFloat(item.price.replace(/[^\d,]/g, '').replace(',', '.'));
            return total + (price * item.quantity);
        }, 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateUI();
    }

    saveCart() {
        localStorage.setItem('macondo_cart', JSON.stringify(this.items));
    }

    updateUI() {
        // Actualizar contador del carrito
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = this.getItemCount();
        }

        const navbar = document.querySelector('custom-navbar');
        const shadowCartCount = navbar?.shadowRoot?.getElementById('cart-count');
        if (shadowCartCount) {
            shadowCartCount.textContent = this.getItemCount();
        }
        
        // Actualizar contenido del carrito si está abierto
        this.renderCart();
    }

    toggleCart() {
        const cartModal = document.getElementById('cart-modal');
        if (!cartModal) {
            this.openCart();
            return;
        }

        if (cartModal.classList.contains('hidden')) {
            this.openCart();
        } else {
            this.closeCart();
        }
    }

    openCart() {
        const cartModal = document.getElementById('cart-modal');
        if (!cartModal) {
            this.createCartModal();
        }
        document.getElementById('cart-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        this.renderCart();
    }

    closeCart() {
        document.getElementById('cart-modal').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    createCartModal() {
        const modalHTML = `
            <div id="cart-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="p-6 border-b">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-amber-800">Tu Carrito</h2>
                            <button onclick="window.cart.closeCart()" class="text-gray-500 hover:text-gray-700">
                                <i data-feather="x" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-6">
                        <div id="cart-items" class="space-y-4">
                            <!-- Items del carrito se renderizarán aquí -->
                        </div>
                        
                        <div id="cart-empty" class="text-center py-8 hidden">
                            <i data-feather="shopping-cart" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                            <p class="text-gray-500">Tu carrito está vacío</p>
                        </div>
                    </div>
                    
                    <div class="p-6 border-t">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-xl font-bold text-amber-800">Total:</span>
                            <span class="text-2xl font-bold text-amber-600" id="cart-total">0,00 PLN</span>
                        </div>
                        
                        <div class="space-y-2">
                            <button onclick="window.cart.proceedToCheckout()" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400" id="checkout-btn">
                                Proceder al Pago
                            </button>
                            <button onclick="window.cart.clearCart()" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                Vaciar Carrito
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        feather.replace();
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartEmpty = document.getElementById('cart-empty');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (!cartItems) return;
        
        if (this.items.length === 0) {
            cartItems.innerHTML = '';
            cartEmpty.classList.remove('hidden');
            checkoutBtn.disabled = true;
        } else {
            cartEmpty.classList.add('hidden');
            checkoutBtn.disabled = false;
            
            cartItems.innerHTML = this.items.map(item => `
                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                    <div class="flex-1">
                        <h4 class="font-semibold text-amber-800">${item.name}</h4>
                        <p class="text-amber-600">${item.price}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="window.cart.updateQuantity('${item.id}', ${item.quantity - 1})" class="w-8 h-8 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center">
                            <i data-feather="minus" class="w-4 h-4"></i>
                        </button>
                        <span class="w-8 text-center font-semibold">${item.quantity}</span>
                        <button onclick="window.cart.updateQuantity('${item.id}', ${item.quantity + 1})" class="w-8 h-8 bg-amber-200 hover:bg-amber-300 rounded-full flex items-center justify-center">
                            <i data-feather="plus" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.cart.removeItem('${item.id}')" class="w-8 h-8 bg-red-200 hover:bg-red-300 rounded-full flex items-center justify-center ml-2">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
            feather.replace();
        }
        
        // Actualizar total
        const totalElement = document.getElementById('cart-total');
        if (totalElement) {
            // Formatear con coma como separador decimal para PLN
            totalElement.textContent = `${this.getTotal().toFixed(2).replace('.', ',')} PLN`;
        }
    }

    proceedToCheckout() {
        if (!window.auth.isAuthenticated()) {
            this.showNotification('Debes iniciar sesión para continuar con la compra', 'error');
            window.authModal.open();
            return;
        }
        
        // Abrir modal de checkout
        window.checkout.openCheckout();
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Instancia global
window.cart = new CartSystem();
