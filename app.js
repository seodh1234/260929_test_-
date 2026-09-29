const LOGIN_ID = 'admin';
const LOGIN_PASSWORD = '1234';
const STORAGE_KEY = 'morning-oven-inventory-v1';

const loginPage = document.querySelector('#login-page');
const appShell = document.querySelector('#app-shell');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const productForm = document.querySelector('#product-form');
const productList = document.querySelector('#product-list');
const searchInput = document.querySelector('#search-input');
const notice = document.querySelector('#notice');
let products = loadProducts();
let noticeTimer;

function loadProducts() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
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

    products = products.filter((item) => item.id !== id);
    if (!saveProducts()) {
        products = loadProducts();
        return;
    }
    if (productForm.elements.id.value === id) resetForm();
    renderProducts();
    showNotice('상품을 삭제했습니다.');
}

function showApp() {
    loginPage.hidden = true;
    appShell.hidden = false;
    document.querySelector('#today').textContent = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    }).format(new Date());
    renderProducts();
}

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    if (formData.get('username') !== LOGIN_ID || formData.get('password') !== LOGIN_PASSWORD) {
        loginMessage.textContent = '아이디 또는 비밀번호를 확인해 주세요.';
        return;
    }
    sessionStorage.setItem('morning-oven-authenticated', 'true');
    loginMessage.textContent = '';
    showApp();
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
    showNotice(existing ? '상품 정보를 수정했습니다.' : '새 상품을 등록했습니다.');
});

document.querySelector('#cancel-button').addEventListener('click', resetForm);
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