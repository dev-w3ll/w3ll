// ==================== DATA ====================
let products = JSON.parse(localStorage.getItem('products')) || [...defaultProducts];

function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}



let cart = [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let saleCounter = parseInt(localStorage.getItem('saleCounter')) || 1;



// ==================== ELEMENTS ====================
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const subtotalEl = document.getElementById('subtotal');
const totalAmountEl = document.getElementById('totalAmount');
const discountInput = document.getElementById('discountPercent');
const customerNameInput = document.getElementById('customerName');
const customerCpfInput = document.getElementById('customerCpf');
const searchProductInput = document.getElementById('searchProduct');
const finalizeSaleBtn = document.getElementById('finalizeSale');
const clearCartBtn = document.getElementById('clearCart');

// Modals
const receiptModal = document.getElementById('receiptModal');
const productModal = document.getElementById('productModal');

// ==================== NAVIGATION ====================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        if (section === 'historico') updateStats();
        if (section === 'recibos') renderReceipts();
        if (section === 'produtos') renderProductsTable();
        if (section === 'empresa') {
            renderEmpresasTable();
            renderEmpresaSelect();
        }
    });
});

// ==================== PRODUCTS ====================
function renderProducts(filter = '') {
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.category.toLowerCase().includes(filter.toLowerCase())
    );
    
    productsGrid.innerHTML = filtered.map(product => `
        <div class="product-card" onclick="addToCart(${product.id})">
            <div class="product-emoji">${product.emoji}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${formatCurrency(product.price)}</div>
            <div class="product-stock">Estoque: ${product.stock}</div>
        </div>
    `).join('');
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>#${product.id.toString().padStart(4, '0')}</td>
            <td>${product.emoji} ${product.name}</td>
            <td>${product.category}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="action-btn" onclick="editProduct(${product.id})">✏️</button>
                <button class="action-btn" onclick="deleteProduct(${product.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

searchProductInput.addEventListener('input', (e) => {
    renderProducts(e.target.value);
});

// ==================== CART ====================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.qty < product.stock) {
            existingItem.qty++;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
            emoji: product.emoji
        });
    }
    
    renderCart();
    updateTotals();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
    updateTotals();
}

function updateQty(productId, change) {
    const item = cart.find(i => i.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            removeFromCart(productId);
        } else if (item.qty > product.stock) {
            item.qty = product.stock;
        }
        renderCart();
        updateTotals();
    }
}

function renderCart() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Carrinho vazio</p>';
        finalizeSaleBtn.disabled = true;
        return;
    }
    
    finalizeSaleBtn.disabled = false;
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.emoji} ${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)} un.</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                <span class="cart-item-qty">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
            </div>
            <span class="cart-item-total">${formatCurrency(item.price * item.qty)}</span>
            <button class="remove-item" onclick="removeFromCart(${item.id})">×</button>
        </div>
    `).join('');
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = parseFloat(discountInput.value) || 0;
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;
    
    subtotalEl.textContent = formatCurrency(subtotal);
    totalAmountEl.textContent = formatCurrency(total);
}

discountInput.addEventListener('input', updateTotals);

clearCartBtn.addEventListener('click', () => {
    cart = [];
    renderCart();
    updateTotals();
});

// ==================== INSTALLMENTS ====================
const installmentsSection = document.getElementById('installmentsSection');
const installmentsSelect = document.getElementById('installments');

document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'credito') {
            installmentsSection.style.display = 'flex';
        } else {
            installmentsSection.style.display = 'none';
            installmentsSelect.value = '1';
        }
    });
});

// ==================== SALES ====================
finalizeSaleBtn.addEventListener('click', finalizeSale);

function finalizeSale() {
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = parseFloat(discountInput.value) || 0;
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    const installments = paymentMethod === 'credito' ? parseInt(installmentsSelect.value) : 1;
    
    const sale = {
        id: saleCounter++,
        date: new Date().toISOString(),
        customer: customerNameInput.value || 'Consumidor Final',
        cpf: customerCpfInput.value || '',
        items: [...cart],
        subtotal: subtotal,
        discountPercent: discount,
        discountAmount: discountAmount,
        total: total,
        paymentMethod: paymentMethod,
        installments: installments
    };
    
    // Update stock
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock -= cartItem.qty;
        }
    });
    saveProducts();
    
    // Save sale
    sales.push(sale);
    localStorage.setItem('sales', JSON.stringify(sales));
    localStorage.setItem('saleCounter', saleCounter.toString());
    
    // Show receipt
    showReceipt(sale);
    
    // Clear cart
    cart = [];
    customerNameInput.value = '';
    customerCpfInput.value = '';
    discountInput.value = '0';
    renderCart();
    updateTotals();
    renderProducts();
}

// ==================== RECEIPT ====================
function showReceipt(sale) {
    updateReceiptCompanyInfo();
    document.getElementById('receiptNumber').textContent = sale.id.toString().padStart(6, '0');
    document.getElementById('receiptDate').textContent = formatDate(sale.date);
    document.getElementById('receiptCustomer').textContent = sale.customer;
    
    document.getElementById('receiptItems').innerHTML = sale.items.map(item => `
        <div class="receipt-item">
            <div class="receipt-item-details">
                ${item.name}<br>
                <small>${item.qty}x ${formatCurrency(item.price)}</small>
            </div>
            <span>${formatCurrency(item.price * item.qty)}</span>
        </div>
    `).join('');
    
    document.getElementById('receiptSubtotal').textContent = formatCurrency(sale.subtotal);
    document.getElementById('receiptDiscount').textContent = `${sale.discountPercent}% (${formatCurrency(sale.discountAmount)})`;
    document.getElementById('receiptTotal').textContent = formatCurrency(sale.total);
    
    let paymentText = getPaymentLabel(sale.paymentMethod);
    if (sale.paymentMethod === 'credito' && sale.installments > 1) {
        const installmentValue = sale.total / sale.installments;
        paymentText += ` ${sale.installments}x de ${formatCurrency(installmentValue)}`;
    }
    document.getElementById('receiptPayment').textContent = paymentText;
    document.getElementById('receiptTimestamp').textContent = new Date().toLocaleString('pt-BR');
    
    receiptModal.classList.add('active');
}

document.getElementById('closeReceipt').addEventListener('click', () => {
    receiptModal.classList.remove('active');
});

document.getElementById('printReceipt').addEventListener('click', () => {
    window.print();
});

document.getElementById('downloadReceipt').addEventListener('click', async () => {
    const receiptElement = document.getElementById('receiptContent');
    const receiptNumber = document.getElementById('receiptNumber').textContent;
    
    const btn = document.getElementById('downloadReceipt');
    const originalText = btn.textContent;
    btn.textContent = 'Gerando PDF...';
    btn.disabled = true;
    
    try {
        const canvas = await html2canvas(receiptElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true
        });
        
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        
        const imgWidth = 80;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [imgWidth, imgHeight + 10]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, imgHeight);
        pdf.save(`recibo_${receiptNumber}.pdf`);
        
        btn.textContent = '✅ PDF Baixado!';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        btn.textContent = '❌ Erro';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    }
});

// ==================== RECEIPTS SECTION ====================
function renderReceipts() {
    const grid = document.getElementById('receiptsGrid');
    const sortedSales = [...sales].reverse();
    
    if (sortedSales.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1; padding: 40px;">Nenhum recibo emitido ainda.</p>';
        return;
    }
    
    grid.innerHTML = sortedSales.map(sale => `
        <div class="receipt-card" onclick="viewReceipt(${sale.id})">
            <div class="receipt-card-header">
                <span class="receipt-card-number">#${sale.id.toString().padStart(6, '0')}</span>
                <span class="receipt-card-date">${formatDate(sale.date)}</span>
            </div>
            <div class="receipt-card-customer">👤 ${sale.customer}</div>
            <div class="receipt-card-total">${formatCurrency(sale.total)}</div>
        </div>
    `).join('');
}

document.getElementById('searchReceipt').addEventListener('input', (e) => {
    const filter = e.target.value.toLowerCase();
    const filtered = sales.filter(s => 
        s.id.toString().includes(filter) ||
        s.customer.toLowerCase().includes(filter)
    );
    
    const grid = document.getElementById('receiptsGrid');
    grid.innerHTML = filtered.reverse().map(sale => `
        <div class="receipt-card" onclick="viewReceipt(${sale.id})">
            <div class="receipt-card-header">
                <span class="receipt-card-number">#${sale.id.toString().padStart(6, '0')}</span>
                <span class="receipt-card-date">${formatDate(sale.date)}</span>
            </div>
            <div class="receipt-card-customer">👤 ${sale.customer}</div>
            <div class="receipt-card-total">${formatCurrency(sale.total)}</div>
        </div>
    `).join('');
});

// ==================== PRODUCT MANAGEMENT ====================
document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('productForm').reset();
    productModal.classList.add('active');
});

document.getElementById('cancelProduct').addEventListener('click', () => {
    productModal.classList.remove('active');
});

document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
    const newProduct = {
        id: maxId + 1,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        emoji: getCategoryEmoji(document.getElementById('productCategory').value)
    };
    
    products.push(newProduct);
    saveProducts();
    productModal.classList.remove('active');
    renderProducts();
    renderProductsTable();
});

function getCategoryEmoji(category) {
    const emojis = {
        'Eletrônicos': '📱',
        'Roupas': '👕',
        'Alimentos': '🍔',
        'Outros': '📦'
    };
    return emojis[category] || '📦';
}

function deleteProduct(id) {
    if (confirm('Deseja realmente excluir este produto?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderProducts();
        renderProductsTable();
    }
}

function editProduct(id) {
    alert('Funcionalidade de edição será implementada');
}

// ==================== UTILITIES ====================
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getPaymentLabel(method) {
    const labels = {
        'dinheiro': '💵 Dinheiro',
        'pix': '📱 PIX',
        'credito': '💳 Crédito',
        'debito': '💳 Débito'
    };
    return labels[method] || method;
}

// ==================== CLEAR HISTORY & RECEIPTS ====================
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja excluir todo o histórico de vendas? Esta ação não pode ser desfeita.')) {
        sales = [];
        localStorage.setItem('sales', JSON.stringify(sales));
        saleCounter = 1;
        localStorage.setItem('saleCounter', '1');
        updateStats();
        renderSalesHistory();
    }
});

document.getElementById('clearReceiptsBtn').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja excluir todos os recibos? Esta ação não pode ser desfeita.')) {
        sales = [];
        localStorage.setItem('sales', JSON.stringify(sales));
        saleCounter = 1;
        localStorage.setItem('saleCounter', '1');
        renderReceipts();
        updateStats();
    }
});

// ==================== EMPRESA MANAGEMENT ====================
const empresaModal = document.getElementById('empresaModal');
const empresaForm = document.getElementById('empresaForm');
const empresaAtivaSelect = document.getElementById('empresaAtivaSelect');
let editingEmpresaId = null;

function renderEmpresasTable() {
    const tbody = document.getElementById('empresasTableBody');
    const allEmpresas = getAllEmpresas();
    
    tbody.innerHTML = allEmpresas.map(empresa => `
        <tr>
            <td style="font-size: 1.5rem;">${empresa.emoji || '🏢'}</td>
            <td>${empresa.name}</td>
            <td>${empresa.cnpj}</td>
            <td>${empresa.address}</td>
            <td>${empresa.phone}</td>
            <td>
                <button class="action-btn" onclick="editEmpresa(${empresa.id})">✏️</button>
                <button class="action-btn" onclick="deleteEmpresaById(${empresa.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function renderEmpresaSelect() {
    const allEmpresas = getAllEmpresas();
    const ativa = getEmpresaAtiva();
    
    empresaAtivaSelect.innerHTML = allEmpresas.map(empresa => `
        <option value="${empresa.id}" ${ativa && ativa.id === empresa.id ? 'selected' : ''}>
            ${empresa.emoji || '🏢'} ${empresa.name}
        </option>
    `).join('');
}

empresaAtivaSelect.addEventListener('change', (e) => {
    setEmpresaAtiva(parseInt(e.target.value));
});

document.getElementById('addEmpresaBtn').addEventListener('click', () => {
    editingEmpresaId = null;
    document.getElementById('empresaModalTitle').textContent = 'Nova Empresa';
    empresaForm.reset();
    empresaModal.classList.add('active');
});

document.getElementById('cancelEmpresa').addEventListener('click', () => {
    empresaModal.classList.remove('active');
});

empresaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const empresaData = {
        name: document.getElementById('empresaNome').value,
        cnpj: document.getElementById('empresaCnpj').value,
        address: document.getElementById('empresaEndereco').value,
        phone: document.getElementById('empresaTelefone').value,
        emoji: document.getElementById('empresaEmoji').value || '🏢'
    };
    
    if (editingEmpresaId) {
        updateEmpresa(editingEmpresaId, empresaData);
    } else {
        addEmpresa(empresaData);
    }
    
    empresaModal.classList.remove('active');
    renderEmpresasTable();
    renderEmpresaSelect();
});

function editEmpresa(id) {
    const allEmpresas = getAllEmpresas();
    const empresa = allEmpresas.find(e => e.id === id);
    if (empresa) {
        editingEmpresaId = id;
        document.getElementById('empresaModalTitle').textContent = 'Editar Empresa';
        document.getElementById('empresaNome').value = empresa.name;
        document.getElementById('empresaCnpj').value = empresa.cnpj;
        document.getElementById('empresaEndereco').value = empresa.address;
        document.getElementById('empresaTelefone').value = empresa.phone;
        document.getElementById('empresaEmoji').value = empresa.emoji || '';
        empresaModal.classList.add('active');
    }
}

function deleteEmpresaById(id) {
    const allEmpresas = getAllEmpresas();
    if (allEmpresas.length <= 1) {
        alert('Você precisa manter pelo menos uma empresa cadastrada.');
        return;
    }
    if (confirm('Deseja realmente excluir esta empresa?')) {
        deleteEmpresa(id);
        renderEmpresasTable();
        renderEmpresaSelect();
    }
}

function updateReceiptCompanyInfo() {
    const empresa = getEmpresaAtiva();
    if (empresa) {
        document.getElementById('receiptCompanyName').textContent = `${empresa.emoji || '🏢'} ${empresa.name}`;
        document.getElementById('receiptCompanyCnpj').textContent = `CNPJ: ${empresa.cnpj}`;
        document.getElementById('receiptCompanyAddress').textContent = empresa.address;
        document.getElementById('receiptCompanyPhone').textContent = `Tel: ${empresa.phone}`;
    }
}

// ==================== INIT ====================
renderProducts();
renderCart();
updateTotals();
renderEmpresasTable();
renderEmpresaSelect();
