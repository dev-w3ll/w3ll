// ==================== PRODUCTS ====================
const defaultProducts = [
    { id: 1, name: 'Smartphone', category: 'Eletrônicos', price: 1999.99, stock: 15, emoji: '📱' },
    { id: 2, name: 'Notebook', category: 'Eletrônicos', price: 3499.99, stock: 8, emoji: '💻' },
    { id: 3, name: 'Fone Bluetooth', category: 'Eletrônicos', price: 299.99, stock: 25, emoji: '🎧' },
    { id: 4, name: 'Camiseta', category: 'Roupas', price: 79.99, stock: 50, emoji: '👕' },
    { id: 5, name: 'Calça Jeans', category: 'Roupas', price: 149.99, stock: 30, emoji: '👖' },
    { id: 6, name: 'Tênis', category: 'Roupas', price: 299.99, stock: 20, emoji: '👟' },
    { id: 7, name: 'Café Premium', category: 'Alimentos', price: 45.99, stock: 40, emoji: '☕' },
    { id: 8, name: 'Chocolate', category: 'Alimentos', price: 19.99, stock: 60, emoji: '🍫' },
    { id: 9, name: 'Mouse Gamer', category: 'Eletrônicos', price: 199.99, stock: 18, emoji: '🖱️' },
    { id: 10, name: 'Teclado', category: 'Eletrônicos', price: 249.99, stock: 12, emoji: '⌨️' },
    { id: 11, name: 'Smartwatch', category: 'Eletrônicos', price: 899.99, stock: 10, emoji: '⌚' },
    { id: 12, name: 'Mochila', category: 'Outros', price: 159.99, stock: 22, emoji: '🎒' },
];

// ==================== HISTORY ====================
function renderSalesHistory() {
    const tbody = document.getElementById('salesHistoryBody');
    const sortedSales = [...sales].reverse();
    
    tbody.innerHTML = sortedSales.map(sale => `
        <tr>
            <td>#${sale.id.toString().padStart(6, '0')}</td>
            <td>${formatDate(sale.date)}</td>
            <td>${sale.customer}</td>
            <td>${sale.items.reduce((sum, i) => sum + i.qty, 0)}</td>
            <td class="text-success">${formatCurrency(sale.total)}</td>
            <td>${getPaymentLabel(sale.paymentMethod)}</td>
            <td>
                <button class="action-btn" onclick="viewReceipt(${sale.id})">🧾</button>
            </td>
        </tr>
    `).join('');
}

function viewReceipt(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
        showReceipt(sale);
    }
}

function updateStats() {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    
    document.getElementById('totalSales').textContent = todaySales.length;
    document.getElementById('totalRevenue').textContent = formatCurrency(
        todaySales.reduce((sum, s) => sum + s.total, 0)
    );
    document.getElementById('totalItems').textContent = todaySales.reduce(
        (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.qty, 0), 0
    );
    
    renderSalesHistory();
}
