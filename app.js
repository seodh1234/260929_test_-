const LOGIN_ID = 'admin';
const LOGIN_PASSWORD = '1234';
const LOGIN_PASSWORD_STORAGE_KEY = 'morning-oven-admin-password-v1';
const STORAGE_KEY = 'morning-oven-inventory-v1';
const SALES_STORAGE_KEY = 'morning-oven-sales-v1';

const loginPage = document.querySelector('#login-page');
const appShell = document.querySelector('#app-shell');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const productForm = document.querySelector('#product-form');
const productList = document.querySelector('#product-list');
const searchInput = document.querySelector('#search-input');
const saleForm = document.querySelector('#sale-form');
const saleProduct = document.querySelector('#sale-product');
const saleQuantity = document.querySelector('#sale-quantity');
const notice = document.querySelector('#notice');
let products = loadProducts();
let sales = loadSales();
let noticeTimer;

function loadProducts() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function loadSales() {
    try {
        const stored = JSON.parse(localStorage.getItem(SALES_STORAGE_KEY) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function getLoginPassword() {
    return localStorage.getItem(LOGIN_PASSWORD_STORAGE_KEY) || LOGIN_PASSWORD;
}

function saveProducts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        return true;
    } catch {
        showNotice('브라우저 저장 공간에 기록하지 못했습니다.', 'error');
        return false;
    }
}

function saveSaleState(nextProducts, nextSales) {
    const previousProducts = localStorage.getItem(STORAGE_KEY);
    const previousSales = localStorage.getItem(SALES_STORAGE_KEY);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProducts));
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(nextSales));
        products = nextProducts;
        sales = nextSales;
        return true;
    } catch {
        try {
            if (previousProducts === null) localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, previousProducts);
            if (previousSales === null) localStorage.removeItem(SALES_STORAGE_KEY);
            else localStorage.setItem(SALES_STORAGE_KEY, previousSales);
        } catch {
            // Keep the in-memory state unchanged if browser storage is unavailable.
        }
        showNotice('브라우저 저장 공간에 판매 내역을 기록하지 못했습니다.', 'error');
        return false;
    }
}

function showNotice(message, type = 'success') {
    notice.textContent = message;
    notice.classList.toggle('error', type === 'error');
    notice.hidden = false;
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 3500);
}

function isLowStock(product) {
    return Number(product.quantity) <= Number(product.minimum);
}

function formatNumber(value) {
    return new Intl.NumberFormat('ko-KR').format(Number(value) || 0);
}

function addCell(row, text, className = '') {
    const cell = document.createElement('td');
    cell.textContent = text;
    if (className) cell.className = className;
    row.append(cell);
    return cell;
}

function renderProducts() {
    const query = searchInput.value.trim().toLocaleLowerCase('ko-KR');
    const filtered = products.filter((product) =>
        ['name', 'category', 'code', 'supplier'].some((field) =>
            String(product[field] || '').toLocaleLowerCase('ko-KR').includes(query)
        )
    );

    document.querySelector('#product-count').innerHTML = `${products.length}<small>종</small>`;
    document.querySelector('#low-count').innerHTML = `${products.filter(isLowStock).length}<small>종</small>`;
    document.querySelector('#visible-count').textContent = `(${filtered.length})`;
    productList.replaceChildren();

    if (filtered.length === 0) {
        const row = document.createElement('tr');
        const cell = addCell(row, query ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다. 왼쪽에서 첫 상품을 등록해 주세요.');
        cell.colSpan = 7;
        cell.className = 'empty-cell';
        productList.append(row);
        return;
    }

    filtered.forEach((product) => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        const name = document.createElement('span');
        name.className = 'product-name';
        name.textContent = product.name;
        const code = document.createElement('span');
        code.className = 'product-code';
        code.textContent = product.code || '';
        nameCell.append(name, code);
        row.append(nameCell);
        addCell(row, product.category || '');
        addCell(row, `${formatNumber(product.quantity)} ${product.unit || ''}`, isLowStock(product) ? 'low-stock' : 'stock-ok');
        addCell(row, `${formatNumber(product.minimum)} ${product.unit || ''}`);
        addCell(row, `${formatNumber(product.price)}원`);
        addCell(row, product.expiry || '-');

        const actionsCell = document.createElement('td');
        const actions = document.createElement('div');
        actions.className = 'row-actions';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = '수정';
        editButton.addEventListener('click', () => editProduct(product.id));
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-button';
        deleteButton.textContent = '삭제';
        deleteButton.addEventListener('click', () => deleteProduct(product.id));
        actions.append(editButton, deleteButton);
        actionsCell.append(actions);
        row.append(actionsCell);
        productList.append(row);
    });
}

function updateSalePreview() {
    const product = products.find((item) => item.id === saleProduct.value);
    const quantity = Number(saleQuantity.value);
    const unitPrice = product ? Number(product.price) || 0 : 0;
    document.querySelector('#sale-stock').textContent = product
        ? `현재고 ${formatNumber(product.quantity)} ${product.unit || ''}`
        : products.length ? '상품을 선택해 주세요.' : '먼저 재고 관리에서 상품을 등록해 주세요.';
    document.querySelector('#sale-unit-price').value = `${formatNumber(unitPrice)}원`;
    document.querySelector('#sale-total-preview').textContent = `${formatNumber(unitPrice * quantity)}원`;
    saleQuantity.max = product ? String(product.quantity) : '0';
    document.querySelector('#sale-submit').disabled = !product || Number(product.quantity) < 1;
}

function renderSales() {
    const selectedId = saleProduct.value;
    saleProduct.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '상품 선택';
    placeholder.disabled = true;
    placeholder.selected = true;
    saleProduct.append(placeholder);

    products.forEach((product) => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} · 재고 ${formatNumber(product.quantity)} ${product.unit || ''}`;
        option.disabled = Number(product.quantity) < 1;
        saleProduct.append(option);
    });
    if (products.some((product) => product.id === selectedId && Number(product.quantity) > 0)) {
        saleProduct.value = selectedId;
    }

    const today = new Date().toLocaleDateString('en-CA');
    const todaysSales = sales.filter((sale) => new Date(sale.createdAt).toLocaleDateString('en-CA') === today);
    document.querySelector('#sales-total').innerHTML = `${formatNumber(todaysSales.reduce((total, sale) => total + Number(sale.amount), 0))}<small>원</small>`;
    document.querySelector('#sales-count').innerHTML = `${todaysSales.length}<small>건</small>`;
    document.querySelector('#sales-visible-count').textContent = `(${sales.length})`;

    const salesList = document.querySelector('#sales-list');
    salesList.replaceChildren();
    if (sales.length === 0) {
        const row = document.createElement('tr');
        const cell = addCell(row, '등록된 판매 내역이 없습니다.');
        cell.colSpan = 6;
        cell.className = 'empty-cell';
        salesList.append(row);
        updateSalePreview();
        return;
    }

    sales.forEach((sale) => {
        const row = document.createElement('tr');
        addCell(row, new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(sale.createdAt)));
        addCell(row, sale.productName);
        addCell(row, `${formatNumber(sale.quantity)} ${sale.unit || ''}`);
        addCell(row, `${formatNumber(sale.unitPrice)}원`);
        addCell(row, `${formatNumber(sale.amount)}원`);
        const actionCell = document.createElement('td');
        const actions = document.createElement('div');
        actions.className = 'row-actions';
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'delete-button';
        cancelButton.textContent = '취소';
        cancelButton.addEventListener('click', () => cancelSale(sale.id));
        actions.append(cancelButton);
        actionCell.append(actions);
        row.append(actionCell);
        salesList.append(row);
    });
    updateSalePreview();
}

function resetForm() {
    productForm.reset();
    productForm.elements.id.value = '';
    productForm.elements.category.value = '빵·완제품';
    productForm.elements.quantity.value = '0';
    productForm.elements.minimum.value = '0';
    productForm.elements.price.value = '0';
    productForm.elements.unit.value = '개';
    document.querySelector('#form-title').textContent = '상품 등록';
    document.querySelector('#save-button').textContent = '상품 등록';
    document.querySelector('#cancel-button').hidden = true;
}

function editProduct(id) {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    Object.entries(product).forEach(([key, value]) => {
        const field = productForm.elements.namedItem(key);
        if (field) field.value = value;
    });
    document.querySelector('#form-title').textContent = '상품 수정';
    document.querySelector('#save-button').textContent = '수정 내용 저장';
    document.querySelector('#cancel-button').hidden = false;
    productForm.elements.name.focus();
    if (window.matchMedia('(max-width: 700px)').matches) {
        productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function deleteProduct(id) {
    const product = products.find((item) => item.id === id);
    if (!product || !window.confirm(`'${product.name}' 상품을 삭제할까요?`)) return;
    if (sales.some((sale) => sale.productId === id)) {
        showNotice('판매 내역이 있는 상품은 삭제할 수 없습니다. 판매를 취소한 뒤 삭제해 주세요.', 'error');
        return;
    }

    products = products.filter((item) => item.id !== id);
    if (!saveProducts()) {
        products = loadProducts();
        return;
    }
    if (productForm.elements.id.value === id) resetForm();
    renderProducts();
    renderSales();
    showNotice('상품을 삭제했습니다.');
}

function cancelSale(id) {
    const sale = sales.find((item) => item.id === id);
    if (!sale || !window.confirm(`${sale.productName} 판매 ${formatNumber(sale.amount)}원을 취소할까요? 재고가 복구됩니다.`)) return;
    const product = products.find((item) => item.id === sale.productId);
    if (!product) {
        showNotice('상품이 없어 재고를 복구할 수 없습니다.', 'error');
        return;
    }

    const nextProducts = products.map((item) => item.id === sale.productId
        ? { ...item, quantity: Number(item.quantity) + Number(sale.quantity) }
        : item);
    const nextSales = sales.filter((item) => item.id !== id);
    if (!saveSaleState(nextProducts, nextSales)) return;
    renderProducts();
    renderSales();
    showNotice('판매를 취소하고 재고를 복구했습니다.');
}

function switchView(view) {
    const inventoryActive = view === 'inventory';
    document.querySelector('#inventory-view').hidden = !inventoryActive;
    document.querySelector('#sales-view').hidden = inventoryActive;
    document.querySelector('#inventory-tab').classList.toggle('active', inventoryActive);
    document.querySelector('#sales-tab').classList.toggle('active', !inventoryActive);
    document.querySelector('#inventory-tab').setAttribute('aria-selected', String(inventoryActive));
    document.querySelector('#sales-tab').setAttribute('aria-selected', String(!inventoryActive));
    document.querySelector('#page-title').textContent = inventoryActive ? '재고 관리' : '판매 등록';
    document.querySelector('#page-description').textContent = inventoryActive
        ? '상품과 재료의 입고 현황을 관리합니다.'
        : '판매 금액을 기록하고 재고를 자동 차감합니다.';
    if (!inventoryActive) renderSales();
}

function showApp() {
    loginPage.hidden = true;
    appShell.hidden = false;
    document.querySelector('#today').textContent = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    }).format(new Date());
    renderProducts();
    renderSales();
}

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    if (formData.get('username') !== LOGIN_ID || formData.get('password') !== getLoginPassword()) {
        loginMessage.textContent = '아이디 또는 비밀번호를 확인해 주세요.';
        return;
    }
    sessionStorage.setItem('morning-oven-authenticated', 'true');
    loginMessage.textContent = '';
    showApp();
});

const passwordDialog = document.querySelector('#password-dialog');
const passwordForm = document.querySelector('#password-form');
const passwordMessage = document.querySelector('#password-message');

document.querySelector('#change-password-button').addEventListener('click', () => {
    passwordForm.reset();
    passwordMessage.textContent = '';
    passwordDialog.showModal();
    passwordForm.elements.currentPassword.focus();
});

document.querySelector('#cancel-password-change').addEventListener('click', () => passwordDialog.close());

passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(passwordForm);
    if (formData.get('currentPassword') !== getLoginPassword()) {
        passwordMessage.textContent = '현재 비밀번호가 올바르지 않습니다.';
        return;
    }
    if (formData.get('newPassword') !== formData.get('confirmPassword')) {
        passwordMessage.textContent = '새 비밀번호가 서로 일치하지 않습니다.';
        return;
    }

    try {
        localStorage.setItem(LOGIN_PASSWORD_STORAGE_KEY, String(formData.get('newPassword')));
    } catch {
        passwordMessage.textContent = '브라우저 저장 공간에 비밀번호를 저장하지 못했습니다.';
        return;
    }

    passwordDialog.close();
    showNotice('관리자 비밀번호를 변경했습니다.');
});

document.querySelector('#logout-button').addEventListener('click', () => {
    sessionStorage.removeItem('morning-oven-authenticated');
    productForm.reset();
    appShell.hidden = true;
    loginPage.hidden = false;
    loginForm.reset();
    loginMessage.textContent = '';
});

productForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!productForm.reportValidity()) return;

    const formData = new FormData(productForm);
    const id = formData.get('id');
    const existing = products.find((product) => product.id === id);
    const product = {
        id: id || crypto.randomUUID(),
        name: String(formData.get('name')).trim(),
        category: String(formData.get('category')),
        code: String(formData.get('code')).trim(),
        quantity: Number(formData.get('quantity')),
        unit: String(formData.get('unit')).trim(),
        minimum: Number(formData.get('minimum')),
        price: Number(formData.get('price')),
        supplier: String(formData.get('supplier')).trim(),
        expiry: String(formData.get('expiry')),
        memo: String(formData.get('memo')).trim(),
        updatedAt: new Date().toISOString(),
    };

    products = existing
        ? products.map((item) => item.id === id ? product : item)
        : [product, ...products];
    if (!saveProducts()) {
        products = loadProducts();
        return;
    }

    resetForm();
    renderProducts();
    renderSales();
    showNotice(existing ? '상품 정보를 수정했습니다.' : '새 상품을 등록했습니다.');
});

saleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!saleForm.reportValidity()) return;
    const product = products.find((item) => item.id === saleProduct.value);
    const quantity = Number(saleQuantity.value);
    if (!product || !Number.isInteger(quantity) || quantity < 1) {
        showNotice('상품과 판매 수량을 확인해 주세요.', 'error');
        return;
    }
    if (quantity > Number(product.quantity)) {
        showNotice('판매 수량이 현재고보다 많습니다.', 'error');
        return;
    }

    const unitPrice = Number(product.price) || 0;
    const sale = {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        quantity,
        unit: product.unit || '',
        unitPrice,
        amount: unitPrice * quantity,
        createdAt: new Date().toISOString(),
    };
    const nextProducts = products.map((item) => item.id === product.id
        ? { ...item, quantity: Number(item.quantity) - quantity }
        : item);
    if (!saveSaleState(nextProducts, [sale, ...sales])) return;

    saleForm.reset();
    saleQuantity.value = '1';
    renderProducts();
    renderSales();
    showNotice(`${product.name} ${formatNumber(quantity)}${product.unit || '개'} 판매, ${formatNumber(sale.amount)}원 등록 완료`);
});

document.querySelector('#cancel-button').addEventListener('click', resetForm);
document.querySelector('#inventory-tab').addEventListener('click', () => switchView('inventory'));
document.querySelector('#sales-tab').addEventListener('click', () => switchView('sales'));
saleProduct.addEventListener('change', updateSalePreview);
saleQuantity.addEventListener('input', updateSalePreview);
document.querySelector('#search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    renderProducts();
});
searchInput.addEventListener('input', renderProducts);
document.querySelector('#clear-search').addEventListener('click', () => {
    searchInput.value = '';
    renderProducts();
    searchInput.focus();
});

if (sessionStorage.getItem('morning-oven-authenticated') === 'true') {
    showApp();
}