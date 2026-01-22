class OrderSystem {
    constructor() {
        this.orders = [];
        this.init();
    }

    init() {
        // Cargar pedidos desde localStorage
        const savedOrders = localStorage.getItem('macondo_orders');
        if (savedOrders) {
            this.orders = JSON.parse(savedOrders);
        }
    }

    createOrder(cartItems, userInfo) {
        const order = {
            id: Date.now().toString(),
            userId: userInfo.id,
            userEmail: userInfo.email,
            userName: userInfo.name,
            items: cartItems,
            total: this.calculateTotal(cartItems),
            status: 'pending',
            date: new Date().toISOString(),
            type: 'delivery', // o 'pickup'
            address: null,
            phone: userInfo.phone,
            notes: ''
        };

        this.orders.push(order);
        this.saveOrders();
        this.saveOrderToUser(order);
        
        return order;
    }

    calculateTotal(items) {
        return items.reduce((total, item) => {
            const price = parseFloat(item.price.replace(/[^\d.]/g, ''));
            return total + (price * item.quantity);
        }, 0);
    }

    saveOrders() {
        localStorage.setItem('macondo_orders', JSON.stringify(this.orders));
    }

    saveOrderToUser(order) {
        const users = JSON.parse(localStorage.getItem('macondo_users') || '[]');
        const userIndex = users.findIndex(u => u.id === order.userId);
        
        if (userIndex !== -1) {
            if (!users[userIndex].orders) {
                users[userIndex].orders = [];
            }
            users[userIndex].orders.push(order);
            localStorage.setItem('macondo_users', JSON.stringify(users));
            
            // Actualizar usuario actual si está logueado
            if (window.auth && window.auth.getCurrentUser().id === order.userId) {
                localStorage.setItem('macondo_user', JSON.stringify(users[userIndex]));
                window.auth.currentUser = users[userIndex];
            }
        }
    }

    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            this.saveOrders();
            this.updateOrderInUser(order);
        }
    }

    updateOrderInUser(updatedOrder) {
        const users = JSON.parse(localStorage.getItem('macondo_users') || '[]');
        const userIndex = users.findIndex(u => u.id === updatedOrder.userId);
        
        if (userIndex !== -1) {
            const orderIndex = users[userIndex].orders.findIndex(o => o.id === updatedOrder.id);
            if (orderIndex !== -1) {
                users[userIndex].orders[orderIndex] = updatedOrder;
                localStorage.setItem('macondo_users', JSON.stringify(users));
            }
        }
    }

    getUserOrders(userId) {
        return this.orders.filter(order => order.userId === userId);
    }

    getAllOrders() {
        return this.orders;
    }

    getOrder(orderId) {
        return this.orders.find(order => order.id === orderId);
    }
}

// Instancia global
window.orderSystem = new OrderSystem();
