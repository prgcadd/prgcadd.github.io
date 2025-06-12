document.addEventListener('DOMContentLoaded', function() {
    // Загрузка темы из localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Инициализация корзины и избранного
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    updateCartCount();
    updateWishlistToggle();
    
    // Загрузка продуктов
    loadProducts();
    
    // Обработчики событий
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('cart-toggle').addEventListener('click', openCart);
    document.getElementById('close-cart').addEventListener('click', closeCart);
    document.querySelector('.mobile-menu-toggle').addEventListener('click', toggleMobileMenu);
    document.getElementById('wishlist-toggle').addEventListener('click', function() {
        document.querySelector('.filter-btn[data-filter="wishlist"]').click();
    });
    
    // Фильтрация продуктов
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterProducts(this.dataset.filter);
        });
    });
    
    // Функция загрузки продуктов
    function loadProducts() {
        const productContainer = document.getElementById('product-container');
        productContainer.innerHTML = '';
        
        products.forEach(product => {
            const isInWishlist = wishlist.includes(product.id);
            const productCard = document.createElement('div');
            productCard.className = `product-card ${product.category}`;
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="images/${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <p class="product-price">${product.price.toLocaleString()} ₽</p>
                    <div class="product-actions">
                        <button class="add-to-cart" data-id="${product.id}">В корзину</button>
                        <button class="wishlist ${isInWishlist ? 'active' : ''}" data-id="${product.id}">
                            <i class="${isInWishlist ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
            productContainer.appendChild(productCard);
        });
        
        // Добавление обработчиков для кнопок "В корзину"
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.dataset.id);
                addToCart(productId);
            });
        });
        
        // Добавление обработчиков для кнопок избранного
        document.querySelectorAll('.wishlist').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.dataset.id);
                toggleWishlist(productId, this);
            });
        });
    }
    
    // Функция фильтрации продуктов
    function filterProducts(filter) {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
            } else if (filter === 'wishlist') {
                const productId = parseInt(card.querySelector('.wishlist').dataset.id);
                card.style.display = wishlist.includes(productId) ? 'block' : 'none';
            } else {
                card.style.display = card.classList.contains(filter) ? 'block' : 'none';
            }
        });
    }
    
    // Функции для работы с корзиной
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        updateCart();
        showNotification(`${product.name} добавлен в корзину`);
    }
    
    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }
    
    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-count').textContent = count;
    }
    
    function renderCartItems() {
        const cartContent = document.getElementById('cart-content');
        
        if (cart.length === 0) {
            cartContent.innerHTML = '<p class="empty-cart">Ваша корзина пуста</p>';
            document.getElementById('cart-total').textContent = '0';
            return;
        }
        
        cartContent.innerHTML = '';
        
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="images/${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">${item.price.toLocaleString()} ₽</p>
                    <div class="cart-item-actions">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                        <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            cartContent.appendChild(cartItem);
        });
        
        // Обновление итоговой суммы
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cart-total').textContent = total.toLocaleString();
        
        // Добавление обработчиков для кнопок в корзине
        document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.dataset.id);
                updateQuantity(productId, -1);
            });
        });
        
        document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.dataset.id);
                updateQuantity(productId, 1);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.dataset.id);
                removeFromCart(productId);
            });
        });
    }
    
    function updateQuantity(productId, change) {
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex !== -1) {
            cart[itemIndex].quantity += change;
            
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1);
            }
            
            updateCart();
        }
    }
    
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCart();
    }
    
    // Функции для работы с избранным
    function toggleWishlist(productId, button) {
        const index = wishlist.indexOf(productId);
        
        if (index === -1) {
            wishlist.push(productId);
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-heart"></i>';
            showNotification('Товар добавлен в избранное');
        } else {
            wishlist.splice(index, 1);
            button.classList.remove('active');
            button.innerHTML = '<i class="far fa-heart"></i>';
            showNotification('Товар удален из избранного');
        }
        
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        updateWishlistToggle();
    }
    
    function updateWishlistToggle() {
        const wishlistToggle = document.getElementById('wishlist-toggle');
        if (wishlist.length > 0) {
            wishlistToggle.classList.add('active');
            wishlistToggle.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            wishlistToggle.classList.remove('active');
            wishlistToggle.innerHTML = '<i class="far fa-heart"></i>';
        }
    }
    
    // Функции для работы с темой
    function toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        setTheme(currentTheme);
    }
    
    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-theme');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
        }
        localStorage.setItem('theme', theme);
    }
    
    // Функции для работы с корзиной (открытие/закрытие)
    function openCart() {
        const cartOverlay = document.getElementById('cart-overlay');
        cartOverlay.classList.add('active');
        renderCartItems();
        document.body.style.overflow = 'hidden';
    }
    
    function closeCart() {
        const cartOverlay = document.getElementById('cart-overlay');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Функция для мобильного меню
    function toggleMobileMenu() {
        document.querySelector('.mobile-nav').classList.toggle('active');
    }
    
    // Вспомогательная функция для уведомлений
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Закрытие корзины при клике вне ее области
    document.getElementById('cart-overlay').addEventListener('click', function(e) {
        if (e.target === this || e.target.classList.contains('cart-container')) {
            closeCart();
        }
    });
    
    // Обработчик Escape для закрытия корзины
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCart();
        }
    });
    
    // Плавная прокрутка для навигации
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                document.querySelector('.mobile-nav').classList.remove('active');
            }
        });
    });
    
    // Обработчик для кнопки оформления заказа
    document.querySelector('.checkout-btn').addEventListener('click', function() {
        if (cart.length > 0) {
            alert('Заказ оформлен! Спасибо за покупку!');
            cart = [];
            updateCart();
            closeCart();
        }
    });
});