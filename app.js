/* ========= Data initialization (single source) ========= */
let stock = JSON.parse(localStorage.getItem('stock') || '[]');
let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
let invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
let loans = JSON.parse(localStorage.getItem('loans') || '[]');
let laptops = JSON.parse(localStorage.getItem('laptops') || '[]');
let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
let shop = JSON.parse(localStorage.getItem('shop') || 'null') || {
  name: 'Guru Thozhil Maiyam', address:'', gst:'', contact:'', logo:'', invoiceCounter:1, openAmount:0, openHistory:[]
};
// admin credentials in localStorage (simple)
let admin = JSON.parse(localStorage.getItem('admin') || 'null') || { username: 'admin', password: 'admin' };

/* ========= helpers ========= */
function saveAll(){
  localStorage.setItem('stock', JSON.stringify(stock));
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('invoices', JSON.stringify(invoices));
  localStorage.setItem('shop', JSON.stringify(shop));
  localStorage.setItem('loans', JSON.stringify(loans));
  localStorage.setItem('laptops', JSON.stringify(laptops));
  localStorage.setItem('expenses', JSON.stringify(expenses));
  localStorage.setItem('admin', JSON.stringify(admin));
}
function currency(n){ return Number(n || 0).toFixed(2); }
function formatINR(n){ return '₹' + Number(n || 0).toLocaleString('en-IN', {minimumFractionDigits:2}) }
function nextSerialFor(arr, field = 'serial'){
  // simple incremental serial: max existing numeric + 1, fallback to length+1
  let max = 0;
  arr.forEach(a => {
    const v = a[field];
    const n = parseInt(String(v).replace(/\D/g,'')) || 0;
    if(n > max) max = n;
  });
  return String(max + 1);
}

/* ========== Authentication & UI boot ========== */
function login(){
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  if(u === admin.username && p === admin.password){
    sessionStorage.setItem('logged', '1');
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('app').style.display = '';
    document.getElementById('mainNav').style.display = '';
    document.getElementById('greeting').innerText = 'Hello, ' + admin.username + ' 👋';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    loadSettings();
    renderAllAfterLogin();
    showSection('dashboard');
  } else {
    alert('Invalid credentials');
  }
}
function logout(){
  sessionStorage.removeItem('logged');
  location.reload();
}
function showResetAdmin(){
  if(!confirm('Restore admin to default (admin/admin)?')) return;
  admin = { username:'admin', password:'admin' }; localStorage.setItem('admin', JSON.stringify(admin));
  alert('Admin reset to admin/admin');
}
function renderAllAfterLogin(){
  renderStock(); renderPosOptions(); renderCart(); renderTransactions(); generateReport(); renderInvoices(); renderLoans(); renderLaptops(); renderExpenses(); updateDashboard(); renderOpenHistory();
}

/* If already logged from previous session (sessionStorage), skip login overlay */
if(sessionStorage.getItem('logged')){
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('app').style.display = '';
  document.getElementById('mainNav').style.display = '';
  document.getElementById('greeting').innerText = 'Hello, ' + admin.username + ' 👋';
  document.getElementById('logoutBtn').style.display = 'inline-block';
  loadSettings();
  renderAllAfterLogin();
} else {
  document.getElementById('app').style.display = 'none';
  document.getElementById('mainNav').style.display = 'none';
}

/* ========== showSection (SPA) ========== */
function showSection(id){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('section').forEach(s=>s.style.display='none');
  const el = document.getElementById(id);
  if(!el){ console.error('No section with id', id); return; }
  el.style.display = 'block';
  const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => (b.dataset.target===id) || (b.getAttribute('onclick')||'').includes(`showSection('${id}')`));
  if(btn) btn.classList.add('active');

  if(id === 'inventory') renderStock();
  if(id === 'pos') { renderStock(); renderPosOptions(); renderCart(); }
  if(id === 'transactions') renderTransactions();
  if(id === 'reports') generateReport();
  if(id === 'invoices') renderInvoices();
  if(id === 'loans') renderLoans();
  if(id === 'laptops') renderLaptops();
  if(id === 'expenses') renderExpenses();
  if(id === 'settings') loadSettings();
  if(id === 'dashboard') updateDashboard();
}

/* ========== Inventory ========= */
function clearInventoryForm(){ ['invName','invQty','invActual','invSell'].forEach(id=>document.getElementById(id).value=''); }
function addOrUpdateItem(){
  const name = document.getElementById('invName').value.trim();
  const qty = parseInt(document.getElementById('invQty').value || '0');
  const actual = parseFloat(document.getElementById('invActual').value || '0');
  const sell = parseFloat(document.getElementById('invSell').value || '0');
  if(!name || isNaN(qty) || isNaN(actual) || isNaN(sell)) return alert('Please fill all inventory fields correctly.');
  const idx = stock.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
  if(idx >= 0){
    stock[idx].quantity = qty;
    stock[idx].actualPrice = actual;
    stock[idx].sellingPrice = sell;
  } else {
    stock.push({ name, quantity: qty, actualPrice: actual, sellingPrice: sell });
  }
  saveAll(); renderStock(); clearInventoryForm(); updateDashboard(); renderPosOptions();
}
function renderStock(){
  const tbody = document.getElementById('stockTbody'); tbody.innerHTML = '';
  const q = (document.getElementById('stockSearch').value || '').toLowerCase();
  let totalInventoryValue=0;
  stock.forEach((s,i) => {
    if(q && !s.name.toLowerCase().includes(q)) return;
    const value = s.quantity * s.actualPrice;
    totalInventoryValue += value;
    const tr = document.createElement('tr');
    const low = s.quantity < 5;
    tr.className = low ? 'low-stock' : '';
    tr.innerHTML = `<td style="text-align:left">${s.name}${low? ' ⚠️':''}</td>
      <td>${s.quantity}</td><td>₹${currency(s.actualPrice)}</td><td>₹${currency(s.sellingPrice)}</td>
      <td>₹${currency(value)}</td>
      <td class="actions">
        <button class="small" onclick="editItem(${i})">✏️</button>
        <button class="small" onclick="deleteItem(${i})">🗑</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('inventoryValue').innerText = '📦 Total Inventory Value: ' + formatINR(totalInventoryValue);
}
function editItem(i){
  const it = stock[i];
  document.getElementById('invName').value = it.name;
  document.getElementById('invQty').value = it.quantity;
  document.getElementById('invActual').value = it.actualPrice;
  document.getElementById('invSell').value = it.sellingPrice;
}
function deleteItem(i){
  if(!confirm('Delete this item?')) return;
  stock.splice(i,1);
  saveAll(); renderStock(); renderPosOptions(); updateDashboard();
}
function clearAllStockConfirm(){
  if(!confirm('Delete ALL stock items? This cannot be undone.')) return;
  stock = []; saveAll(); renderStock(); renderPosOptions(); updateDashboard();
}

/* ========== POS / Cart ========= */
/* ---------- GLOBAL DATA ---------- */
// let stock = [
//   { name: "Pelican", quantity: 10, sellingPrice: 120, actualPrice: 80 },
//   { name: "Marker", quantity: 20, sellingPrice: 30, actualPrice: 15 },
//   { name: "Notebook", quantity: 15, sellingPrice: 50, actualPrice: 35 }
// ];
// Remove redeclaration of stock, cart, shop, transactions, invoices here as they are already declared and initialized above.

/* ---------- UTIL ---------- */
function currency(n) { return Number(n).toFixed(2); }

/* ---------- INIT DROPDOWN ---------- */
const posSelect = document.getElementById("posSelect");
function refreshStockDropdown() {
  posSelect.innerHTML = "";
  stock.forEach((item, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${item.name} (qty:${item.quantity})`;
    posSelect.appendChild(option);
  });
}
refreshStockDropdown();

/* ---------- CART FUNCTIONS ---------- */
function addToCart(){
  const idx = document.getElementById('posSelect').value;
  const qty = parseInt(document.getElementById('posQty').value || '0');
  const method = document.getElementById('posPaymentMethod').value;
  const upi = document.getElementById('posUpi').value.trim();
  if(idx === '' || isNaN(qty) || qty <= 0) return alert('Select item and enter qty');
  const item = stock[idx];
  if(item.quantity < qty) return alert('Not enough stock in inventory for this item.');

  const existing = cart.find(c => c.name === item.name && c.paymentMethod === method && (method !== 'upi' || c.upi === upi));
  if(existing){
    existing.qty += qty;
    existing.total = existing.qty * existing.price;
    existing.profit = (existing.price - existing.actualPrice) * existing.qty;
  } else {
    cart.push({
      name: item.name,
      qty: qty,
      price: item.sellingPrice,
      actualPrice: item.actualPrice,
      total: qty * item.sellingPrice,
      profit: (item.sellingPrice - item.actualPrice) * qty,
      paymentMethod: method,
      upi: (method === 'upi' ? upi : '')
    });
  }
  renderCart();
  document.getElementById('posQty').value = '';
  document.getElementById('posUpi').value = '';
}

function renderCart(){
  const tbody = document.getElementById('cartTbody'); tbody.innerHTML = '';
  let total = 0, profit = 0;
  cart.forEach((c, i) => {
    total += c.total; profit += c.profit;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="text-align:left">${c.name}</td>
      <td>${c.qty}</td>
      <td>₹${currency(c.price)}</td>
      <td>₹${currency(c.total)}</td>
      <td>${c.paymentMethod.toUpperCase()}${c.upi? ' ('+c.upi+')' : ''}</td>
      <td><button class="small" onclick="removeCartItem(${i})">Remove</button></td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('cartTotal').innerText = currency(total);
  document.getElementById('cartProfit').innerText = currency(profit);
}

function removeCartItem(i){ cart.splice(i,1); renderCart(); }
function clearCart(){ cart = []; renderCart(); }

/* ---------- COMPLETE SALE ---------- */
function completeSale(){
  const buyer = (document.getElementById('posBuyer').value || '').trim();
  const mobile = (document.getElementById('posMobile').value || '').trim();
  if(cart.length === 0) return alert('Cart is empty');

  for(const c of cart){
    const invItem = stock.find(s => s.name === c.name);
    if(!invItem || invItem.quantity < c.qty) return alert(`Not enough stock for ${c.name}`);
  }
  for(const c of cart){
    const invItem = stock.find(s => s.name === c.name);
    invItem.quantity -= c.qty;
  }
  const invoiceNo = shop.invoiceCounter || 1; shop.invoiceCounter = invoiceNo + 1;
  const dateISO = new Date().toISOString(); const dateDisplay = new Date().toLocaleString();
  const total = cart.reduce((s,i)=>s+i.total,0);
  const profit = cart.reduce((s,i)=>s+i.profit,0);
  const itemsCopy = cart.map(it => ({ ...it }));
  const invoice = { invoiceNo, dateISO, dateDisplay, buyer, mobile, items: itemsCopy, total, profit };
  transactions.push(invoice);
  invoices.push(invoice);

  alert(`Sale completed! Invoice #${invoiceNo}\nTotal: ₹${currency(total)}`);
  cart = []; renderCart();
  document.getElementById('posBuyer').value = ''; document.getElementById('posMobile').value = '';
  refreshStockDropdown();
}

/* ---------- PRINT RECEIPT ---------- */
function printCurrentCartReceipt(){
  if(cart.length === 0) return alert('Cart is empty');
  let html = `<div style="font-family:monospace;font-size:12px;padding:6px">`;
  html += `<div style="text-align:center;font-weight:700">${shop.name || 'My Shop'}</div>`;
  html += `<div style="text-align:center;font-size:12px">${shop.address || ''}</div><hr>`;
  html += `<table style="width:100%;border-collapse:collapse">`;
  html += `<thead><tr><th style="text-align:left">Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>`;
  cart.forEach(c => html += `<tr><td style="text-align:left">${c.name}</td><td>${c.qty}</td><td>₹${currency(c.total)}</td></tr>`);
  html += `</tbody></table><hr>`;
  html += `<div><b>Total:</b> ₹${currency(cart.reduce((s,i)=>s+i.total,0))}</div>`;
  html += `<div style="text-align:center;margin-top:8px">Thank you!</div></div>`;
  const w = window.open('', '_blank', 'width=320,height=600');
  w.document.write('<html><head><title>Receipt</title></head><body>'+html+'</body></html>');
  w.document.close(); w.print();
}

/* Print current cart (narrow bill) */
function printCurrentCartReceipt(){
  if(cart.length === 0) return alert('Cart is empty');
  let html = `<div style="font-family:monospace;font-size:12px;padding:6px">`;
  html += `<div style="text-align:center;font-weight:700">${shop.name || 'My Shop'}</div>`;
  html += `<div style="text-align:center;font-size:12px">${shop.address || ''}</div><hr>`;
  html += `<table style="width:100%;border-collapse:collapse">`;
  html += `<thead><tr><th style="text-align:left">Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>`;
  cart.forEach(c => html += `<tr><td style="text-align:left">${c.name}</td><td>${c.qty}</td><td>₹${currency(c.total)}</td></tr>`);
  html += `</tbody></table><hr>`;
  html += `<div><b>Total:</b> ₹${currency(cart.reduce((s,i)=>s+i.total,0))}</div>`;
  html += `<div style="text-align:center;margin-top:8px">Thank you!</div></div>`;
  const w = window.open('', '_blank', 'width=320,height=600');
  w.document.write('<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:12px;padding:6px}table{width:100%;border-collapse:collapse}td,th{padding:3px;text-align:left}</style></head><body>');
  w.document.write(html);
  w.document.close();
  w.print();
}

/* ========== Transactions & Reports ========== */
function renderTransactions(){
  const tbody = document.getElementById('transTbody'); tbody.innerHTML = '';
  const q = (document.getElementById('transSearch').value || '').toLowerCase();
  transactions.slice().reverse().forEach(tr => {
    if(q){
      const hay = (tr.buyer + ' ' + (tr.mobile||'') + ' ' + tr.items?.map(i=>i.name).join(' ')).toLowerCase();
      if(!hay.includes(q)) return;
    }
    const itemsText = tr.items ? tr.items.map(i=>`${i.name} x${i.qty}`).join(', ') : '';
    const payments = tr.items ? tr.items.map(i => `${i.name}:${i.paymentMethod}${i.upi? '('+i.upi+')':''}`).join('; ') : '';
    const row = document.createElement('tr');
    row.innerHTML = `<td style="text-align:left">${itemsText}</td><td>${tr.buyer || ''}</td><td>${tr.items?.reduce((s,i)=>s+i.qty,0)||''}</td>
      <td>₹${currency(tr.total)}</td><td>₹${currency(tr.profit)}</td><td style="text-align:left">${payments}</td><td>${tr.dateDisplay}</td><td>${tr.invoiceNo}</td>`;
    tbody.appendChild(row);
  });
}

let lastReportFiltered = [];
function generateReport(){
  const filter = document.getElementById('reportFilter').value;
  const now = new Date(); let filtered = transactions.slice();
  if(filter === 'today') filtered = transactions.filter(t => new Date(t.dateISO).toDateString() === now.toDateString());
  else if(filter === 'week'){ const start = new Date(now); start.setDate(now.getDate()-now.getDay()); start.setHours(0,0,0,0); filtered = transactions.filter(t => new Date(t.dateISO) >= start); }
  else if(filter === 'month'){ filtered = transactions.filter(t => { const d=new Date(t.dateISO); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); }); }
  lastReportFiltered = filtered;
  const tbody = document.getElementById('reportTbody'); tbody.innerHTML = '';
  let sumSales=0,sumProfit=0,sumItems=0;
  filtered.slice().reverse().forEach(tr=>{
    const items = Array.isArray(tr.items) ? tr.items : []; const itemsText = items.map(i=>`${i.name} x${i.qty}`).join(', '); const qtySum = items.reduce((s,i)=>s+(i.qty||0),0);
    sumSales += tr.total||0; sumProfit += tr.profit||0; sumItems += qtySum;
    const row = document.createElement('tr'); row.innerHTML = `<td style="text-align:left">${itemsText||'No items'}</td><td>${tr.buyer||'N/A'}</td><td>${qtySum}</td><td>₹${currency(tr.total||0)}</td><td>₹${currency(tr.profit||0)}</td><td>${tr.dateDisplay||''}</td><td>${tr.invoiceNo||''}</td>`;
    tbody.appendChild(row);
  });
  document.getElementById('repSales').innerText = formatINR(sumSales);
  document.getElementById('repProfit').innerText = formatINR(sumProfit);
  document.getElementById('repItems').innerText = sumItems;
}
async function downloadReportPDF(){
  generateReport();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF(); let y=14;
  if(shop.logo){ const img = new Image(); img.src = shop.logo; await new Promise(r=>img.onload=r); doc.addImage(img,'PNG',150,6,40,24); }
  doc.setFontSize(14); doc.text(shop.name||'My Shop',14,y); y+=8; doc.setFontSize(10);
  if(shop.address){ doc.text(shop.address,14,y); y+=6; }
  if(shop.contact){ doc.text('Contact: '+shop.contact,14,y); y+=6; }
  if(shop.gst){ doc.text('GST: '+shop.gst,14,y); y+=6; }
  doc.setFontSize(12); doc.text('Sales Report',14,y); y+=8;
  const rows = lastReportFiltered.map(tr => [ tr.invoiceNo, tr.dateDisplay, tr.buyer, tr.items.map(i=>`${i.name} x${i.qty}`).join('; '), `₹${currency(tr.total)}`, `₹${currency(tr.profit)}` ]);
  doc.autoTable({ head:[['Inv#','Date','Buyer','Items','Total ₹','Profit ₹']], body: rows, startY:y });
  doc.save('sales_report.pdf');
}

/* ========== Invoice preview & download (buyer/seller copies) ========== */
let currentInvoice = null;
function showInvoicePreview(inv){
  currentInvoice = inv;
  const contentEl = document.getElementById('invoiceContent');
  const logoHTML = shop.logo ? `<img src="${shop.logo}" style="max-width:100px;display:block;margin-bottom:6px">` : '';
  let itemsHTML = '';
  inv.items.forEach(it => {
    itemsHTML += `<tr><td style="text-align:left">${it.name}</td><td>${it.qty}</td><td>₹${currency(it.price)}</td><td>₹${currency(it.total)}</td><td>${it.paymentMethod.toUpperCase()}${it.upi? ' ('+it.upi+')':''}</td></tr>`;
  });
  const html = `${logoHTML}<h3 style="margin:6px 0">${shop.name||'My Shop'}</h3><div style="font-size:13px">${shop.address||''}</div><div style="font-size:13px">GST: ${shop.gst||''}</div><div style="font-size:13px">Contact: ${shop.contact||''}</div><hr>
  <div style="display:flex;justify-content:space-between"><div><b>Invoice:</b> #${inv.invoiceNo}</div><div><b>Date:</b> ${inv.dateDisplay}</div></div>
  <div style="margin-top:6px"><b>Buyer:</b> ${inv.buyer || ''} ${inv.mobile? '('+inv.mobile+')':''}</div>
  <table style="width:100%;margin-top:8px;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #ddd"><th style="text-align:left">Item</th><th>Qty</th><th>Price</th><th>Total</th><th>Payment</th></tr></thead><tbody>${itemsHTML}</tbody></table>
  <div style="margin-top:8px"><b>Total:</b> ₹${currency(inv.total)}</div><div><b>Profit:</b> ₹${currency(inv.profit)}</div><hr><div style="text-align:center;font-weight:700">Thank you! Visit Again 🙏</div>`;
  contentEl.innerHTML = html;
  document.getElementById('invoiceModal').style.display = 'block';
  saveAll();
}
function closeInvoicePreview(){ document.getElementById('invoiceModal').style.display = 'none'; currentInvoice = null; }
function downloadBuyerCopy(){
  if(!currentInvoice) return alert('No invoice selected');
  let html = `<div style="font-family:Arial;padding:8px;">`;
  if(shop.logo) html += `<img src="${shop.logo}" style="max-width:100px;display:block;margin-bottom:6px">`;
  html += `<h3>${shop.name}</h3><div>${shop.address||''}</div><div>GST: ${shop.gst||''}</div><div>Contact: ${shop.contact||''}</div><hr>`;
  html += `<div><b>Invoice #</b> ${currentInvoice.invoiceNo} &nbsp; <b>Date:</b> ${currentInvoice.dateDisplay}</div>`;
  html += `<div><b>Buyer:</b> ${currentInvoice.buyer || ''} ${currentInvoice.mobile? '('+currentInvoice.mobile+')':''}</div>`;
  html += `<table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr><th style="text-align:left">Item</th><th>Qty</th><th>Price</th><th>Total</th><th>Payment</th></tr></thead><tbody>`;
  currentInvoice.items.forEach(it => { html += `<tr><td style="text-align:left">${it.name}</td><td>${it.qty}</td><td>₹${currency(it.price)}</td><td>₹${currency(it.total)}</td><td>${it.paymentMethod.toUpperCase()}${it.upi? ' ('+it.upi+')':''}</td></tr>`; });
  html += `</tbody></table><div style="margin-top:6px"><b>Total:</b> ₹${currency(currentInvoice.total)}</div></div>`;
  downloadHtmlAsPdf(html, `buyer_invoice_${currentInvoice.invoiceNo}.pdf`);
}
function downloadSellerCopy(){
  if(!currentInvoice) return alert('No invoice selected');
  let html = `<div style="font-family:Arial;padding:8px;">`;
  if(shop.logo) html += `<img src="${shop.logo}" style="max-width:100px;display:block;margin-bottom:6px">`;
  html += `<h3>${shop.name} (Seller Copy)</h3><div>${shop.address || ''}</div><div>GST: ${shop.gst || ''}</div><div>Contact: ${shop.contact || ''}</div><hr>`;
  html += `<div><b>Invoice #</b> ${currentInvoice.invoiceNo} &nbsp; <b>Date:</b> ${currentInvoice.dateDisplay}</div>`;
  html += `<div><b>Buyer:</b> ${currentInvoice.buyer || ''} ${currentInvoice.mobile? '('+currentInvoice.mobile+')':''}</div>`;
  html += `<table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr><th style="text-align:left">Item</th><th>Qty</th><th>Cost</th><th>Sell</th><th>Profit</th><th>Payment</th></tr></thead><tbody>`;
  currentInvoice.items.forEach(it => {
    html += `<tr><td style="text-align:left">${it.name}</td><td>${it.qty}</td><td>₹${currency(it.actualPrice)}</td><td>₹${currency(it.price)}</td><td>₹${currency(it.profit)}</td><td>${it.paymentMethod.toUpperCase()}${it.upi? ' ('+it.upi+')':''}</td></tr>`;
  });
  html += `</tbody></table><div style="margin-top:6px"><b>Total:</b> ₹${currency(currentInvoice.total)}</div><div><b>Profit:</b> ₹${currency(currentInvoice.profit)}</div></div>`;
  downloadHtmlAsPdf(html, `seller_invoice_${currentInvoice.invoiceNo}.pdf`);
}
function downloadHtmlAsPdf(html, filename){
  const opt = { margin:6, filename, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'mm',format:'a6',orientation:'portrait'} };
  const element = document.createElement('div'); element.innerHTML = html;
  html2pdf().set(opt).from(element).save();
}
function printReceipt(){
  if(!currentInvoice) return alert('No invoice to print');
  const content = document.getElementById('invoiceContent').innerHTML;
  const w = window.open('', '_blank', 'width=320,height=600');
  w.document.write('<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:12px;padding:6px}table{width:100%;border-collapse:collapse}td,th{padding:3px;text-align:left}</style></head><body>');
  w.document.write('<div class="receipt">'); w.document.write(content); w.document.write('</div></body></html>'); w.document.close(); w.print();
}

/* ========== Invoices listing ========== */
function renderInvoices(){
  const tbody = document.getElementById('invoiceTbody'); const q = (document.getElementById('invoiceSearch').value||'').toLowerCase();
  tbody.innerHTML = '';
  invoices.slice().reverse().forEach(inv=>{
    if(q && !(String(inv.invoiceNo).includes(q) || (inv.buyer||'').toLowerCase().includes(q))) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${inv.invoiceNo}</td><td>${inv.buyer || ''}</td><td>₹${currency(inv.total)}</td><td>₹${currency(inv.profit)}</td><td>${inv.dateDisplay}</td>
      <td><button class="small" onclick="showInvoicePreviewByNo(${inv.invoiceNo})">View</button> <button class="small" onclick="downloadInvoiceByNo(${inv.invoiceNo})">Download</button></td>`;
    tbody.appendChild(tr);
  });
}
function showInvoicePreviewByNo(no){ const inv = invoices.find(i=>i.invoiceNo===no); if(!inv) return alert('Invoice not found'); showInvoicePreview(inv); }
function downloadInvoiceByNo(no){ const inv = invoices.find(i=>i.invoiceNo===no); if(!inv) return alert('Invoice not found'); currentInvoice = inv; downloadBuyerCopy(); downloadSellerCopy(); }

/* ========== Settings ========= */
function uploadLogo(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader(); reader.onload = function(ev){ shop.logo = ev.target.result; saveAll(); document.getElementById('logoPreview').src = shop.logo; document.getElementById('logoPreview').style.display = 'block'; };
  reader.readAsDataURL(file);
}
function saveSettings(){
  shop.name = document.getElementById('shopName').value.trim() || shop.name || 'My Shop';
  shop.address = document.getElementById('shopAddress').value.trim() || shop.address || '';
  shop.gst = document.getElementById('shopGST').value.trim() || shop.gst || '';
  shop.contact = document.getElementById('shopContact').value.trim() || shop.contact || '';
  saveAll(); alert('Settings saved'); renderInvoices(); updateDashboard();
}
function loadSettings(){
  document.getElementById('shopName').value = shop.name || '';
  document.getElementById('shopAddress').value = shop.address || '';
  document.getElementById('shopGST').value = shop.gst || '';
  document.getElementById('shopContact').value = shop.contact || '';
  if(shop.logo){ document.getElementById('logoPreview').src = shop.logo; document.getElementById('logoPreview').style.display = 'block'; } else { document.getElementById('logoPreview').style.display='none'; }
  document.getElementById('headerTitle').innerText = shop.name || 'Guru Thozhil Maiyam';
  if(shop.logo){ document.getElementById('headerLogo').src = shop.logo; document.getElementById('headerLogo').style.display = ''; } else { document.getElementById('headerLogo').style.display = 'none'; }
}
function resetSettings(){ if(!confirm('Reset shop settings?')) return; shop = { name:'Guru Thozhil Maiyam', address:'', gst:'', contact:'', logo:'', invoiceCounter:1, openAmount:0, openHistory:[] }; saveAll(); loadSettings(); updateDashboard(); alert('Settings reset'); }

/* Admin change */
function changeAdmin(){
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;
  const pc = document.getElementById('adminPassConfirm').value;
  if(!u || !p) return alert('Fill new username and password');
  if(p !== pc) return alert('Passwords do not match');
  admin.username = u; admin.password = p; localStorage.setItem('admin', JSON.stringify(admin));
  alert('Admin updated. New username: ' + u);
  document.getElementById('greeting').innerText = 'Hello, ' + admin.username + ' 👋';
}

/* ========== Export / Import / CSV ========= */
function exportCSV(filename, rows){ const blob = new Blob([rows.join('\n')], { type:'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
function exportStockCSV(){ if(stock.length===0) return alert('No stock'); const rows=['Item,Quantity,Actual Price,Selling Price,Value']; stock.forEach(s=>rows.push(`${escapeCSV(s.name)},${s.quantity},${currency(s.actualPrice)},${currency(s.sellingPrice)},${currency(s.quantity*s.actualPrice)}`)); exportCSV('stock.csv', rows); }
function exportTransactionsCSV(){ if(transactions.length===0) return alert('No transactions'); const rows=['Inv#,Buyer,Mobile,Total,Profit,Date,Items,Payments']; transactions.forEach(t=> { const items = t.items.map(i=>`${i.name} x${i.qty}`).join('; '); const payments = t.items.map(i=>`${i.name}:${i.paymentMethod}${i.upi? '('+i.upi+')':''}`).join('; '); rows.push(`${t.invoiceNo},${escapeCSV(t.buyer)},${t.mobile},${currency(t.total)},${currency(t.profit)},${t.dateISO},${escapeCSV(items)},${escapeCSV(payments)}`); }); exportCSV('transactions.csv', rows); }
function exportInvoicesCSV(){ if(invoices.length===0) return alert('No invoices'); const rows=['Inv#,Buyer,Total,Profit,Date']; invoices.forEach(inv=>rows.push(`${inv.invoiceNo},${escapeCSV(inv.buyer)},${currency(inv.total)},${currency(inv.profit)},${inv.dateISO}`)); exportCSV('invoices.csv', rows); }
function exportLoansCSV(){ if(loans.length===0) return alert('No loans'); const rows=['Serial,Borrower,Mobile,Scheme,Size,Fees']; loans.forEach(l=>rows.push(`${escapeCSV(l.serial)},${escapeCSV(l.borrower)},${l.mobile},${escapeCSV(l.scheme)},${currency(l.size)},${currency(l.fees)}`)); exportCSV('loans.csv', rows); }
function exportLaptopsCSV(){ if(laptops.length===0) return alert('No laptops'); const rows=['Serial,Model,Buy,Sell,Customer,Mobile,Payment']; laptops.forEach(lp=>rows.push(`${escapeCSV(lp.serial)},${escapeCSV(lp.model)},${currency(lp.buy)},${currency(lp.sell)},${escapeCSV(lp.customer)},${lp.mobile},${escapeCSV(lp.payment + (lp.upi? '('+lp.upi+')':''))}`)); exportCSV('laptops.csv', rows); }
function exportExpensesCSV(){ if(expenses.length===0) return alert('No expenses'); const rows=['Time,Description,Amount']; expenses.forEach(e=>rows.push(`${escapeCSV(e.time)},${escapeCSV(e.desc)},${currency(e.amount)}`)); exportCSV('expenses.csv', rows); }
function escapeCSV(v){ if(typeof v === 'string' && (v.includes(',') || v.includes('"'))) return `"${v.replace(/"/g,'""')}"`; return v; }
function downloadStockJSON(){ const blob = new Blob([JSON.stringify(stock,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download='stock.json';a.click();URL.revokeObjectURL(url); }
function downloadTransactionsJSON(){ const blob = new Blob([JSON.stringify(transactions,null,2) ],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download='transactions.json';a.click();URL.revokeObjectURL(url); }
function exportAllData(){ const dump = { stock, transactions, invoices, loans, laptops, expenses, shop, admin }; const blob = new Blob([JSON.stringify(dump,null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='stock_app_data.json'; a.click(); URL.revokeObjectURL(url); }
function importData(){ const inp = document.createElement('input'); inp.type='file'; inp.accept='.json'; inp.onchange = e=>{ const f=e.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload=ev=>{ try{ const parsed=JSON.parse(ev.target.result); if(parsed.stock) stock=parsed.stock; if(parsed.transactions) transactions=parsed.transactions; if(parsed.invoices) invoices=parsed.invoices; if(parsed.loans) loans=parsed.loans; if(parsed.laptops) laptops=parsed.laptops; if(parsed.expenses) expenses=parsed.expenses; if(parsed.shop) shop=parsed.shop; if(parsed.admin) admin=parsed.admin; saveAll(); renderAllAfterLogin(); alert('Imported successfully'); } catch(err){ alert('Invalid JSON') } }; reader.readAsText(f); }; inp.click(); }
function clearAllDataConfirm(){ if(!confirm('Clear ALL app data? This will remove stock, transactions, invoices, loans, laptops, expenses and settings.')) return; stock=[]; transactions=[]; invoices=[]; loans=[]; laptops=[]; expenses=[]; shop={name:'Guru Thozhil Maiyam',address:'',gst:'',contact:'',logo:'',invoiceCounter:1,openAmount:0,openHistory:[]}; admin={username:'admin',password:'admin'}; saveAll(); renderAllAfterLogin(); alert('Cleared'); }

/* ========== Loans ========= */
function clearLoanForm(){ ['loanSerial','loanBorrower','loanMobile','loanScheme','loanSize','loanFees'].forEach(id=>document.getElementById(id).value=''); }
function addLoan(){
  let serial = document.getElementById('loanSerial').value.trim();
  const borrower = document.getElementById('loanBorrower').value.trim();
  const mobile = document.getElementById('loanMobile').value.trim();
  const scheme = document.getElementById('loanScheme').value.trim();
  const size = parseFloat(document.getElementById('loanSize').value || '0');
  const fees = parseFloat(document.getElementById('loanFees').value || '0');
  if(!borrower) return alert('Borrower required');
  if(!serial) serial = nextSerialFor(loans,'serial');
  loans.push({ serial, borrower, mobile, scheme, size, fees, date: new Date().toISOString() });
  saveAll(); renderLoans(); clearLoanForm(); updateDashboard();
}
function renderLoans(){
  const tbody = document.getElementById('loansTbody'); const q = (document.getElementById('loanSearch').value||'').toLowerCase();
  tbody.innerHTML = '';
  loans.slice().reverse().forEach((l,i)=>{
    if(q){
      if(!(String(l.serial).toLowerCase().includes(q) || (l.borrower||'').toLowerCase().includes(q) || (l.scheme||'').toLowerCase().includes(q))) return;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${l.serial}</td><td>${l.borrower}</td><td>${l.mobile}</td><td>${l.scheme}</td><td>₹${currency(l.size)}</td><td>₹${currency(l.fees)}</td>
      <td class="loans-actions"><button class="small" onclick="editLoan(${i})">Edit</button> <button class="small" onclick="deleteLoan(${i})">Del</button></td>`;
    tbody.appendChild(tr);
  });
}
function editLoan(index){
  const l = loans[index];
  document.getElementById('loanSerial').value = l.serial; document.getElementById('loanBorrower').value = l.borrower;
  document.getElementById('loanMobile').value = l.mobile; document.getElementById('loanScheme').value = l.scheme;
  document.getElementById('loanSize').value = l.size; document.getElementById('loanFees').value = l.fees;
  loans.splice(index,1); saveAll(); renderLoans();
}
function deleteLoan(index){ if(!confirm('Delete loan?')) return; loans.splice(index,1); saveAll(); renderLoans(); updateDashboard(); }
function clearAllLoansConfirm(){ if(!confirm('Delete ALL loans?')) return; loans=[]; saveAll(); renderLoans(); updateDashboard(); }

/* ========== Laptops ========= */
function clearLaptopForm(){ ['lapSerial','lapModel','lapBuy','lapSell','lapCustomer','lapMobile','lapUpi'].forEach(id=>document.getElementById(id).value=''); document.getElementById('lapPayment').value='cash'; }
function addLaptop(){
  let serial = document.getElementById('lapSerial').value.trim();
  const model = document.getElementById('lapModel').value.trim();
  const buy = parseFloat(document.getElementById('lapBuy').value || '0');
  const sell = parseFloat(document.getElementById('lapSell').value || '0');
  const customer = document.getElementById('lapCustomer').value.trim();
  const mobile = document.getElementById('lapMobile').value.trim();
  const payment = document.getElementById('lapPayment').value;
  const upi = document.getElementById('lapUpi').value.trim();
  if(!model || isNaN(buy) || isNaN(sell)) return alert('Model, buy and sell prices required');
  if(!serial) serial = nextSerialFor(laptops,'serial');
  laptops.push({ serial, model, buy, sell, customer, mobile, payment, upi, date: new Date().toISOString() });
  saveAll(); renderLaptops(); clearLaptopForm(); updateDashboard();
}
function renderLaptops(){
  const tbody = document.getElementById('laptopsTbody'); const q = (document.getElementById('lapSearch').value||'').toLowerCase();
  tbody.innerHTML = '';
  laptops.slice().reverse().forEach((lp,i)=>{
    if(q){
      if(!(String(lp.serial).toLowerCase().includes(q) || (lp.model||'').toLowerCase().includes(q) || (lp.customer||'').toLowerCase().includes(q))) return;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${lp.serial}</td><td style="text-align:left">${lp.model}</td><td>₹${currency(lp.buy)}</td><td>₹${currency(lp.sell)}</td><td>${lp.customer||''}</td><td>${lp.mobile||''}</td><td>${lp.payment.toUpperCase()}${lp.upi? ' ('+lp.upi+')':''}</td>
      <td><button class="small" onclick="editLaptop(${i})">Edit</button> <button class="small" onclick="deleteLaptop(${i})">Del</button></td>`;
    tbody.appendChild(tr);
  });
}
function editLaptop(index){
  const lp = laptops[index];
  document.getElementById('lapSerial').value = lp.serial; document.getElementById('lapModel').value = lp.model;
  document.getElementById('lapBuy').value = lp.buy; document.getElementById('lapSell').value = lp.sell;
  document.getElementById('lapCustomer').value = lp.customer; document.getElementById('lapMobile').value = lp.mobile;
  document.getElementById('lapPayment').value = lp.payment; document.getElementById('lapUpi').value = lp.upi;
  laptops.splice(index,1); saveAll(); renderLaptops();
}
function deleteLaptop(index){ if(!confirm('Delete laptop entry?')) return; laptops.splice(index,1); saveAll(); renderLaptops(); updateDashboard(); }
function clearAllLaptopsConfirm(){ if(!confirm('Delete ALL laptop entries?')) return; laptops=[]; saveAll(); renderLaptops(); updateDashboard(); }

/* ========== Expenses ========= */
function clearExpenseForm(){ ['expDesc','expAmt'].forEach(id=>document.getElementById(id).value=''); }
function addExpense(){
  const desc = document.getElementById('expDesc').value.trim();
  const amt = parseFloat(document.getElementById('expAmt').value || '0');
  if(!desc || isNaN(amt) || amt <= 0) return alert('Provide description and amount');
  expenses.push({ time: new Date().toISOString(), desc, amount: amt });
  saveAll(); renderExpenses(); clearExpenseForm(); updateDashboard();
}
function renderExpenses(){
  const tbody = document.getElementById('expensesTbody'); tbody.innerHTML = '';
  const today = new Date().toDateString();
  let totalToday = 0;
  expenses.slice().reverse().forEach((e,i)=>{
    const t = new Date(e.time);
    if(t.toDateString() === today) totalToday += (e.amount || 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${t.toLocaleString()}</td><td style="text-align:left">${e.desc}</td><td>₹${currency(e.amount)}</td><td><button class="small" onclick="deleteExpense(${i})">Del</button></td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('expensesTodayTotal').innerText = formatINR(totalToday);
  document.getElementById('dashExpensesCount').innerText = expenses.length;
  document.getElementById('dashExpensesToday').innerText = formatINR(totalToday);
}
function deleteExpense(index){ if(!confirm('Delete this expense?')) return; expenses.splice(index,1); saveAll(); renderExpenses(); updateDashboard(); }
function clearAllExpensesConfirm(){ if(!confirm('Delete ALL expenses?')) return; expenses=[]; saveAll(); renderExpenses(); updateDashboard(); }
function exportExpensesCSV(){ exportExpensesCSV = exportExpensesCSV || function(){ if(expenses.length===0) return alert('No expenses'); const rows=['Time,Description,Amount']; expenses.forEach(e=>rows.push(`${escapeCSV(e.time)},${escapeCSV(e.desc)},${currency(e.amount)}`)); exportCSV('expenses.csv', rows);} ; exportExpensesCSV(); }

/* ========== Dashboard & Opening amount ========= */
function updateDashboard(){
  document.getElementById('dashItems').innerText = stock.length;
  const invVal = stock.reduce((s,i)=>s + (i.quantity * i.actualPrice), 0); document.getElementById('dashInventoryValue').innerText = formatINR(invVal);
  const sales = transactions.reduce((s,t)=>s + (t.total || 0), 0); document.getElementById('dashSales').innerText = formatINR(sales);
  const profit = transactions.reduce((s,t)=>s + (t.profit || 0), 0); document.getElementById('dashProfit').innerText = formatINR(profit);
  const low = stock.filter(s=>s.quantity < 5).length; document.getElementById('dashLow').innerText = low;
  const openAmount = shop.openAmount || 0; document.getElementById('dashopen').innerText = formatINR(openAmount);
  const closeAmount = openAmount + sales - (expenses.reduce((s,e)=>s+(e.amount||0),0) || 0); document.getElementById('dashClose').innerText = formatINR(closeAmount);

  // loans summary
  document.getElementById('dashLoansCount').innerText = loans.length;
  const today = new Date().toDateString();
  const loansToday = loans.filter(l => new Date(l.date).toDateString() === today).reduce((s,l)=>s+(l.size||0),0);
  document.getElementById('dashLoansToday').innerText = formatINR(loansToday);

  // laptops summary
  document.getElementById('dashLaptopsCount').innerText = laptops.length;
  const laptopsToday = laptops.filter(lp => new Date(lp.date).toDateString() === today).reduce((s,lp)=>s+(lp.sell||0),0);
  document.getElementById('dashLaptopsToday').innerText = formatINR(laptopsToday);

  // expenses summary updated in renderExpenses()
  renderExpenses();
}
function setOpening(){
  const val = parseFloat(document.getElementById('setOpenAmount').value) || 0; shop.openAmount = val;
  shop.openHistory = shop.openHistory || []; shop.openHistory.push({ date: new Date().toLocaleString(), amount: val });
  saveAll(); updateDashboard(); renderOpenHistory(); document.getElementById('setOpenAmount').value='';
}
function resetOpening(){
  if(!confirm('Reset Opening amount to 0?')) return;
  shop.openAmount = 0; shop.openHistory = shop.openHistory || []; shop.openHistory.push({ date: new Date().toLocaleString(), amount: 0 });
  saveAll(); updateDashboard(); renderOpenHistory(); alert('Opening amount reset');
}
function renderOpenHistory(){
  const list = document.getElementById('openHistoryList'); list.innerHTML = '';
  if(!shop.openHistory || shop.openHistory.length===0){ list.innerHTML = '<li>No history yet</li>'; return; }
  shop.openHistory.slice().reverse().forEach(entry=>{ const li=document.createElement('li'); li.textContent = `${entry.date} → ${formatINR(entry.amount)}`; list.appendChild(li); });
}
/* ========== Init ========= */
document.addEventListener("DOMContentLoaded", function() {
  init();
});
function init(){
  if(!shop.invoiceCounter) shop.invoiceCounter = 1;
  saveAll(); loadSettings(); renderStock(); renderPosOptions(); renderCart(); renderTransactions(); generateReport(); renderInvoices(); renderLoans(); renderLaptops(); renderExpenses(); updateDashboard(); renderOpenHistory();
}

