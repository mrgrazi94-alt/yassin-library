let products = JSON.parse(localStorage.getItem('yassin_products_v2')) || [];
let cart = JSON.parse(localStorage.getItem('yassin_cart_v2')) || [];
let wishlist = JSON.parse(localStorage.getItem('yassin_wishlist_v2')) || [];
let orderHistory = JSON.parse(localStorage.getItem('yassin_orders_v2')) || [];

let currentCategory = "الكل";
let searchQuery = "";
let sortOption = "default";
let onlyDiscounts = false;
let appliedDiscountPercent = 0;
let selectedQuickViewVariant = "";

function showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// الوضع الليلي والنهاري
const savedTheme = localStorage.getItem('yassin_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
const themeIcon = document.querySelector('#themeToggleBtn i');
if (themeIcon) themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('yassin_theme', next);
    if (themeIcon) themeIcon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
});

// عرض المنتجات
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let filtered = products.filter(p => {
        const matchCat = currentCategory === "الكل" || p.category === currentCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchDiscount = !onlyDiscounts || (p.oldPrice && p.oldPrice > p.price);
        return matchCat && matchSearch && matchDiscount;
    });

    if (sortOption === "low-high") filtered.sort((a, b) => a.price - b.price);
    else if (sortOption === "high-low") filtered.sort((a, b) => b.price - a.price);
    else if (sortOption === "discount") {
        filtered.sort((a, b) => {
            const dA = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0;
            const dB = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0;
            return dB - dA;
        });
    }

    const countLabel = document.getElementById('productsCountLabel');
    if (countLabel) countLabel.textContent = `${filtered.length} منتج`;
    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px 20px; color:var(--text-muted);"><h3>لا توجد منتجات مطابقة</h3></div>`;
        return;
    }

    filtered.forEach(prod => {
        const isFav = wishlist.includes(prod.id);
        const isOut = prod.outOfStock === true;
        const discountPct = prod.oldPrice && prod.oldPrice > prod.price ? Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100) : 0;
        const badgeHTML = isOut ? `<span class="badge-tag out">نفذت الكمية</span>` : (discountPct > 0 ? `<span class="badge-tag sale">خصم ${discountPct}%</span>` : '');
        const variantsHTML = prod.variants?.length ? `<div class="card-variants-preview">${prod.variants.map(v => `<span class="mini-variant-chip">${sanitizeHTML(v)}</span>`).join('')}</div>` : '';
        const defaultVar = prod.variants?.[0] || "";

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${badgeHTML}
            <div class="card-floating-actions">
                <button class="circle-action-btn ${isFav ? 'fav-active' : ''}" onclick="toggleWishlist(${prod.id})"><i class="${isFav ? 'fas' : 'far'} fa-heart"></i></button>
                <button class="circle-action-btn share-btn" onclick="shareProduct(${prod.id})"><i class="fas fa-share-alt"></i></button>
            </div>
            <div class="card-img-wrap" style="${isOut ? 'opacity:0.65;' : ''}">
                <img src="${sanitizeHTML(prod.img)}" alt="${sanitizeHTML(prod.name)}" loading="lazy">
                <button class="quick-view-bar" onclick="openQuickView(${prod.id})"><i class="fas fa-eye"></i> معاينة سريعة</button>
            </div>
            <div class="card-body">
                <div>
                    <span class="card-cat">${sanitizeHTML(prod.category)}</span>
                    <h3 class="card-title">${sanitizeHTML(prod.name)}</h3>
                    ${variantsHTML}
                </div>
                <div>
                    <div class="card-price-row">
                        <span class="price-now">${prod.price.toLocaleString()} د.ع</span>
                        ${prod.oldPrice && prod.oldPrice > prod.price ? `<span class="price-was">${prod.oldPrice.toLocaleString()} د.ع</span>` : ''}
                    </div>
                    <button class="card-add-btn" onclick="addToCart(${prod.id}, '${sanitizeHTML(defaultVar)}', this)" ${isOut ? 'disabled' : ''}>
                        ${isOut ? 'غير متوفر حالياً' : '<i class="fas fa-cart-plus"></i> أضف إلى السلة'}
                    </button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

window.filterByCategory = function(cat) {
    currentCategory = cat;
    document.querySelectorAll('#mainNav a').forEach(a => a.classList.toggle('active', a.dataset.cat === cat));
    const titleEl = document.getElementById('currentCategoryTitle');
    if (titleEl) titleEl.textContent = cat === "الكل" ? "أحدث المنتجات المميزة" : `قسم: ${cat}`;
    document.getElementById('mainNav')?.classList.remove('open');
    renderProducts();
};

window.resetStoreFilters = function() {
    currentCategory = "الكل";
    searchQuery = "";
    onlyDiscounts = false;
    const sIn = document.getElementById('liveSearchInput');
    if (sIn) sIn.value = "";
    filterByCategory("الكل");
};

// البحث الفوري
document.getElementById('liveSearchInput')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    document.getElementById('clearSearchBtn')?.classList.toggle('hidden', !searchQuery);
    renderProducts();
});

document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
    document.getElementById('liveSearchInput').value = "";
    searchQuery = "";
    document.getElementById('clearSearchBtn').classList.add('hidden');
    renderProducts();
});

// السلة
window.addToCart = function(prodId, variant = "", btn = null) {
    const product = products.find(p => p.id === prodId);
    if (!product || product.outOfStock) return;
    const chosenVar = variant || product.variants?.[0] || "";
    const cartKey = `${prodId}_${chosenVar}`;
    const existing = cart.find(i => i.cartKey === cartKey);
    if (existing) existing.quantity++;
    else cart.push({ cartKey, id: product.id, name: product.name, price: product.price, img: product.img, variant: chosenVar, quantity: 1 });
    localStorage.setItem('yassin_cart_v2', JSON.stringify(cart));
    updateCartUI();
    showToast(`تمت إضافة "${product.name}" للسلة`);
};

window.changeCartQty = function(key, delta) {
    const item = cart.find(i => i.cartKey === key);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(i => i.cartKey !== key);
    localStorage.setItem('yassin_cart_v2', JSON.stringify(cart));
    updateCartUI();
};

window.removeCartItem = function(key) {
    cart = cart.filter(i => i.cartKey !== key);
    localStorage.setItem('yassin_cart_v2', JSON.stringify(cart));
    updateCartUI();
};

function updateCartUI() {
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = totalItems;

    const container = document.getElementById('cartItemsContainer');
    if (!container) return;
    container.innerHTML = '';
    let subTotal = 0;

    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px 10px; color:var(--text-muted);">السلة فارغة حالياً</div>`;
    } else {
        cart.forEach(item => {
            subTotal += item.price * item.quantity;
            container.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--border-color);">
                    <img src="${sanitizeHTML(item.img)}" style="width:48px; height:48px; border-radius:8px; object-fit:cover;">
                    <div style="flex:1;">
                        <h4 style="font-size:13.5px;">${sanitizeHTML(item.name)}</h4>
                        ${item.variant ? `<span style="font-size:11px; color:var(--text-muted); display:block;">${sanitizeHTML(item.variant)}</span>` : ''}
                        <span style="font-size:12.5px; color:var(--accent); font-weight:800;">${item.price.toLocaleString()} د.ع</span>
                        <div style="margin-top:4px;">
                            <button onclick="changeCartQty('${item.cartKey}', -1)" style="padding:1px 7px; cursor:pointer;">-</button>
                            <strong style="margin:0 6px;">${item.quantity}</strong>
                            <button onclick="changeCartQty('${item.cartKey}', 1)" style="padding:1px 7px; cursor:pointer;">+</button>
                        </div>
                    </div>
                    <button onclick="removeCartItem('${item.cartKey}')" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash"></i></button>
                </div>`;
        });
    }

    const threshold = STORE_CONFIG.freeShippingThreshold;
    const pct = Math.min(100, (subTotal / threshold) * 100);
    const bar = document.getElementById('freeShippingBar');
    if (bar) bar.style.width = `${pct}%`;
    const shipTxt = document.getElementById('freeShippingText');
    if (shipTxt) shipTxt.innerHTML = subTotal >= threshold ? `🎉 حصلت على <strong>توصيل مجاني</strong>!` : `باقي <strong>${(threshold - subTotal).toLocaleString()} د.ع</strong> للتوصيل المجاني!`;

    const citySel = document.getElementById('custCity');
    const opt = citySel?.options[citySel.selectedIndex];
    let fee = opt?.dataset.fee ? parseInt(opt.dataset.fee, 10) : 0;
    if (subTotal >= threshold && subTotal > 0) {
        fee = 0;
        document.getElementById('deliveryFeeText').textContent = "مجاني 🎉";
    } else if (opt?.value) {
        document.getElementById('deliveryFeeText').textContent = `${fee.toLocaleString()} د.ع`;
    }

    const disc = Math.round((subTotal * appliedDiscountPercent) / 100);
    document.getElementById('discountRow')?.classList.toggle('hidden', disc <= 0);
    if (disc > 0) document.getElementById('discountAmount').textContent = `-${disc.toLocaleString()} د.ع`;

    const finalTotal = Math.max(0, subTotal - disc + (subTotal > 0 ? fee : 0));
    document.getElementById('subTotalPrice').textContent = `${subTotal.toLocaleString()} د.ع`;
    document.getElementById('finalTotalPrice').textContent = `${finalTotal.toLocaleString()} د.ع`;
    document.getElementById('headerMiniTotal').textContent = `${subTotal.toLocaleString()} د.ع`;
}

document.getElementById('custCity')?.addEventListener('change', updateCartUI);

document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
    if (document.getElementById('couponInput').value.trim().toUpperCase() === "YASSIN10") {
        appliedDiscountPercent = 10;
        showToast("تم تطبيق خصم 10%");
        updateCartUI();
    } else showToast("كود الخصم غير صحيح");
});

document.getElementById('checkoutForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (cart.length === 0) return showToast("السلة فارغة!");
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const city = document.getElementById('custCity').value;
    const address = document.getElementById('custAddress').value.trim();
    if (!isValidIraqiPhone(phone)) return alert("يرجى إدخال رقم هاتف عراقي صحيح (07XXXXXXXXX)");

    const orderId = "YAS-" + Math.floor(1000 + Math.random() * 9000);
    const totalStr = document.getElementById('finalTotalPrice').textContent;
    orderHistory.unshift({ orderId, date: new Date().toLocaleDateString('ar-IQ'), total: totalStr, city, itemsCount: cart.reduce((s, i) => s + i.quantity, 0) });
    localStorage.setItem('yassin_orders_v2', JSON.stringify(orderHistory));

    let msg = `*فاتورة طلب #${orderId} - مكتبة ياسين المولى* 📚\nالاسم: ${name}\nالهاتف: ${phone}\nالمحافظة: ${city}\nالعنوان: ${address}\n----------------\n`;
    cart.forEach(i => msg += `• ${i.name} ${i.variant ? `[${i.variant}]` : ''} × ${i.quantity}\n`);
    msg += `----------------\nالمجموع النهائي: ${totalStr}`;
    window.open(`https://wa.me/${STORE_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
});

// النوافذ والمفضلة ولوحة الإدارة
window.openQuickView = function(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('modalImg').src = p.img;
    document.getElementById('modalCategory').textContent = p.category;
    document.getElementById('modalTitle').textContent = p.name;
    document.getElementById('modalPrice').textContent = `${p.price.toLocaleString()} د.ع`;
    document.getElementById('modalDesc').textContent = p.desc;
    const pills = document.getElementById('modalVariantPills');
    pills.innerHTML = '';
    if (p.variants?.length) {
        document.getElementById('modalVariantsBox').classList.remove('hidden');
        selectedQuickViewVariant = p.variants[0];
        p.variants.forEach((v, idx) => {
            const b = document.createElement('button');
            b.className = `variant-pill-btn ${idx === 0 ? 'selected' : ''}`;
            b.textContent = v;
            b.onclick = () => {
                document.querySelectorAll('.variant-pill-btn').forEach(x => x.classList.remove('selected'));
                b.classList.add('selected');
                selectedQuickViewVariant = v;
            };
            pills.appendChild(b);
        });
    } else document.getElementById('modalVariantsBox').classList.add('hidden');

    document.getElementById('modalAddToCartBtn').onclick = () => {
        addToCart(p.id, selectedQuickViewVariant);
        document.getElementById('quickViewModal').classList.remove('active');
    };
    document.getElementById('quickViewModal').classList.add('active');
};

window.toggleWishlist = function(id) {
    wishlist = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id];
    localStorage.setItem('yassin_wishlist_v2', JSON.stringify(wishlist));
    document.getElementById('wishlistCount').textContent = wishlist.length;
    renderProducts();
};

window.shareProduct = function(id) {
    const p = products.find(x => x.id === id);
    if (p) navigator.clipboard.writeText(`${p.name} - ${p.price.toLocaleString()} د.ع\n${window.location.href}`).then(() => showToast("تم نسخ رابط المنتج"));
};

// أزرار فتح وإغلاق القوائم والنوافذ
document.getElementById('cartToggleBtn')?.addEventListener('click', () => {
    document.getElementById('cartDrawer').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
});
document.getElementById('closeCartBtn')?.addEventListener('click', () => {
    document.getElementById('cartDrawer').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
});
document.getElementById('cartOverlay')?.addEventListener('click', () => {
    document.getElementById('cartDrawer').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
});
document.getElementById('wishlistToggleBtn')?.addEventListener('click', () => {
    const box = document.getElementById('wishlistItemsContainer');
    box.innerHTML = wishlist.length ? wishlist.map(id => {
        const p = products.find(x => x.id === id);
        return p ? `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);"><span>${sanitizeHTML(p.name)}</span><button onclick="addToCart(${p.id})" class="btn-primary-lg" style="padding:4px 10px; font-size:12px;">للسلة</button></div>` : '';
    }).join('') : '<p style="text-align:center; padding:20px;">المفضلة فارغة</p>';
    document.getElementById('wishlistModal').classList.add('active');
});
document.getElementById('closeWishlistModal')?.addEventListener('click', () => document.getElementById('wishlistModal').classList.remove('active'));
document.getElementById('ordersHistoryBtn')?.addEventListener('click', () => {
    const box = document.getElementById('ordersHistoryContainer');
    box.innerHTML = orderHistory.length ? orderHistory.map(o => `<div style="padding:10px; border-bottom:1px solid var(--border-color);"><strong>#${o.orderId}</strong> - ${o.total} (${o.date})</div>`).join('') : '<p style="text-align:center; padding:20px;">لا توجد طلبات سابقة</p>';
    document.getElementById('ordersModal').classList.add('active');
});
document.getElementById('closeOrdersModal')?.addEventListener('click', () => document.getElementById('ordersModal').classList.remove('active'));
document.getElementById('closeQuickView')?.addEventListener('click', () => document.getElementById('quickViewModal').classList.remove('active'));
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => document.getElementById('mainNav').classList.toggle('open'));
document.getElementById('shopNowBtn')?.addEventListener('click', () => document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' }));

document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); filterByCategory(a.dataset.cat); }));
document.getElementById('sortProducts')?.addEventListener('change', (e) => { sortOption = e.target.value; renderProducts(); });
document.getElementById('onlyDiscountCheckbox')?.addEventListener('change', (e) => { onlyDiscounts = e.target.checked; renderProducts(); });

// بوابة الإدارة
document.getElementById('secretAdminTrigger')?.addEventListener('click', () => document.getElementById('adminModal').classList.add('active'));
document.getElementById('closeAdminModal')?.addEventListener('click', () => document.getElementById('adminModal').classList.remove('active'));

document.getElementById('adminLoginSubmit')?.addEventListener('click', async () => {
    const pass = document.getElementById('adminPasswordInput').value;
    const hash = await sha256(pass);
    if (hash === STORE_CONFIG.adminHash) {
        document.getElementById('adminLoginSection').classList.add('hidden');
        document.getElementById('adminDashboardSection').classList.remove('hidden');
        renderAdminList();
    } else {
        document.getElementById('adminErrorMsg').textContent = "كلمة المرور غير صحيحة!";
    }
});

document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    document.getElementById('adminDashboardSection').classList.add('hidden');
    document.getElementById('adminLoginSection').classList.remove('hidden');
    document.getElementById('adminModal').classList.remove('active');
});

function renderAdminList() {
    const list = document.getElementById('adminProductsList');
    list.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color); font-size:13px;">
            <span>${sanitizeHTML(p.name)} (${p.price.toLocaleString()} د.ع)</span>
            <button onclick="adminDelete(${p.id})" style="background:#ef4444; color:#fff; border:none; padding:3px 8px; border-radius:5px; cursor:pointer;">حذف</button>
        </div>`).join('');
}

window.adminDelete = function(id) {
    products = products.filter(p => p.id !== id);
    localStorage.setItem('yassin_products_v2', JSON.stringify(products));
    renderProducts();
    renderAdminList();
};

document.getElementById('addProductForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const vars = document.getElementById('newProdVariants').value.split(',').map(v => v.trim()).filter(Boolean);
    products.unshift({
        id: Date.now(),
        name: document.getElementById('newProdName').value.trim(),
        category: document.getElementById('newProdCat').value,
        price: parseInt(document.getElementById('newProdPrice').value, 10),
        oldPrice: document.getElementById('newProdOldPrice').value ? parseInt(document.getElementById('newProdOldPrice').value, 10) : null,
        img: document.getElementById('newProdImg').value.trim(),
        variants: vars,
        outOfStock: false,
        desc: document.getElementById('newProdDesc').value.trim()
    });
    localStorage.setItem('yassin_products_v2', JSON.stringify(products));
    e.target.reset();
    renderProducts();
    renderAdminList();
    showToast("تمت إضافة المنتج!");
});

document.getElementById('exportProductsBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(JSON.stringify(products, null, 4)).then(() => alert("تم نسخ كود JSON للمنتجات! الصقه في data/products.json"));
});

// تحميل المنتجات من JSON
async function initStore() {
    try {
        const res = await fetch('data/products.json?v=' + Date.now());
        if (res.ok && !localStorage.getItem('yassin_products_v2')) {
            products = await res.json();
        }
    } catch (e) {}
    document.getElementById('wishlistCount').textContent = wishlist.length;
    renderProducts();
    updateCartUI();
}
initStore();
