const $ = (selector) => document.querySelector(selector);

const STORAGE_KEY = "duegrove.savedInvoices.v1";
const LEGACY_STORAGE_KEY = "invoxa.savedInvoices.v1";

const fields = {
  businessName: $("#businessName"),
  businessEmail: $("#businessEmail"),
  businessAddress: $("#businessAddress"),
  clientName: $("#clientName"),
  clientEmail: $("#clientEmail"),
  clientAddress: $("#clientAddress"),
  invoiceNumber: $("#invoiceNumber"),
  currency: $("#currency"),
  invoiceDate: $("#invoiceDate"),
  dueDate: $("#dueDate"),
  taxRate: $("#taxRate"),
  discountRate: $("#discountRate"),
  notes: $("#notes"),
};

const preview = {
  businessName: $("#previewBusinessName"),
  businessEmail: $("#previewBusinessEmail"),
  businessAddress: $("#previewBusinessAddress"),
  clientName: $("#previewClientName"),
  clientEmail: $("#previewClientEmail"),
  clientAddress: $("#previewClientAddress"),
  invoiceNumber: $("#previewInvoiceNumber"),
  invoiceDate: $("#previewInvoiceDate"),
  dueDate: $("#previewDueDate"),
  notes: $("#previewNotes"),
  items: $("#previewItems"),
  subtotal: $("#previewSubtotal"),
  discount: $("#previewDiscount"),
  tax: $("#previewTax"),
  total: $("#previewTotal"),
  discountLabel: $("#discountLabel"),
  taxLabel: $("#taxLabel"),
  currency: $("#previewCurrency"),
};

const itemsEditor = $("#itemsEditor");
const addItemButton = $("#addItem");
const resetButton = $("#resetInvoice");
const saveButton = $("#saveInvoice");
const downloadButton = $("#downloadPdf");

const savedInvoicesButton = $("#savedInvoicesButton");
const savedCount = $("#savedCount");
const savedDrawer = $("#savedDrawer");
const drawerOverlay = $("#drawerOverlay");
const closeSavedDrawerButton = $("#closeSavedDrawer");
const savedInvoicesList = $("#savedInvoicesList");
const savedEmpty = $("#savedEmpty");

const draftStatus = $(".draft-status");
const draftStatusText = $("#draftStatusText");

let items = [];
let currentInvoiceId = null;
let currentInvoiceCreatedAt = null;
let isDirty = false;

function migrateLegacyStorage() {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
      }
    }
  } catch (error) {
    console.warn("Could not migrate legacy invoice storage:", error);
  }
}

function pad(number) {
  return String(number).padStart(2, "0");
}

function getTodayInputValue(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(value) {
  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatSavedTimestamp(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function generateInvoiceNumber() {
  const now = new Date();

  return `INV-${String(now.getFullYear()).slice(-2)}${pad(
    now.getMonth() + 1
  )}${pad(now.getDate())}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function currencyFormatter(value, currencyOverride = null) {
  const currency = currencyOverride || fields.currency.value;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
}

function textOrFallback(value, fallback) {
  return value.trim() || fallback;
}

function safeCloneItems(sourceItems) {
  return sourceItems.map((item) => ({
    id: item.id || crypto.randomUUID(),
    description: String(item.description || ""),
    quantity: Math.max(0, Number(item.quantity) || 0),
    rate: Math.max(0, Number(item.rate) || 0),
  }));
}

function markDirty() {
  if (!isDirty) {
    isDirty = true;
  }

  updateDraftStatus();
}

function markSaved() {
  isDirty = false;
  updateDraftStatus();
}

function updateDraftStatus() {
  draftStatus.classList.remove("saved", "dirty");

  if (currentInvoiceId && !isDirty) {
    draftStatus.classList.add("saved");
    draftStatusText.textContent = "Saved locally";
    saveButton.textContent = "Saved";
    return;
  }

  if (currentInvoiceId && isDirty) {
    draftStatus.classList.add("dirty");
    draftStatusText.textContent = "Changes not saved";
    saveButton.textContent = "Save Changes";
    return;
  }

  if (isDirty) {
    draftStatus.classList.add("dirty");
  }

  draftStatusText.textContent = "Unsaved invoice";
  saveButton.textContent = "Save Invoice";
}

function getSavedInvoices() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn("Could not read saved invoices:", error);
    return [];
  }
}

function writeSavedInvoices(savedInvoices) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedInvoices));
    return true;
  } catch (error) {
    console.error("Could not save invoice:", error);

    alert(
      "This browser could not save the invoice locally. Check that local storage is enabled and that you are not in a restricted private-browsing mode."
    );

    return false;
  }
}

function collectInvoiceData() {
  const now = new Date().toISOString();

  return {
    id: currentInvoiceId || crypto.randomUUID(),
    createdAt: currentInvoiceCreatedAt || now,
    updatedAt: now,

    businessName: fields.businessName.value,
    businessEmail: fields.businessEmail.value,
    businessAddress: fields.businessAddress.value,

    clientName: fields.clientName.value,
    clientEmail: fields.clientEmail.value,
    clientAddress: fields.clientAddress.value,

    invoiceNumber: fields.invoiceNumber.value,
    currency: fields.currency.value,
    invoiceDate: fields.invoiceDate.value,
    dueDate: fields.dueDate.value,

    taxRate: fields.taxRate.value,
    discountRate: fields.discountRate.value,
    notes: fields.notes.value,

    items: safeCloneItems(items),
  };
}

function applyInvoiceData(invoice) {
  currentInvoiceId = invoice.id || null;
  currentInvoiceCreatedAt = invoice.createdAt || null;

  fields.businessName.value = invoice.businessName || "";
  fields.businessEmail.value = invoice.businessEmail || "";
  fields.businessAddress.value = invoice.businessAddress || "";

  fields.clientName.value = invoice.clientName || "";
  fields.clientEmail.value = invoice.clientEmail || "";
  fields.clientAddress.value = invoice.clientAddress || "";

  fields.invoiceNumber.value = invoice.invoiceNumber || generateInvoiceNumber();
  fields.currency.value = invoice.currency || "MAD";
  fields.invoiceDate.value = invoice.invoiceDate || getTodayInputValue();
  fields.dueDate.value = invoice.dueDate || getTodayInputValue();

  fields.taxRate.value = invoice.taxRate ?? "0";
  fields.discountRate.value = invoice.discountRate ?? "0";
  fields.notes.value = invoice.notes || "";

  items =
    Array.isArray(invoice.items) && invoice.items.length
      ? safeCloneItems(invoice.items)
      : [
          {
            id: crypto.randomUUID(),
            description: "",
            quantity: 1,
            rate: 0,
          },
        ];

  renderItemsEditor();
  updatePreview();
  markSaved();
}

function saveInvoice() {
  const invoice = collectInvoiceData();
  const savedInvoices = getSavedInvoices();
  const existingIndex = savedInvoices.findIndex((saved) => saved.id === invoice.id);

  if (existingIndex >= 0) {
    savedInvoices[existingIndex] = invoice;
  } else {
    savedInvoices.unshift(invoice);
  }

  if (!writeSavedInvoices(savedInvoices)) return;

  currentInvoiceId = invoice.id;
  currentInvoiceCreatedAt = invoice.createdAt;

  markSaved();
  renderSavedInvoices();

  const originalText = saveButton.textContent;
  saveButton.textContent = "Saved ✓";

  window.setTimeout(() => {
    updateDraftStatus();
  }, 1100);
}

function deleteSavedInvoice(id) {
  const savedInvoices = getSavedInvoices();
  const target = savedInvoices.find((invoice) => invoice.id === id);

  if (!target) return;

  const label = target.invoiceNumber || "this invoice";

  if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
    return;
  }

  const filtered = savedInvoices.filter((invoice) => invoice.id !== id);

  if (!writeSavedInvoices(filtered)) return;

  if (currentInvoiceId === id) {
    currentInvoiceId = null;
    currentInvoiceCreatedAt = null;
    isDirty = true;
    updateDraftStatus();
  }

  renderSavedInvoices();
}

function duplicateSavedInvoice(id) {
  const savedInvoices = getSavedInvoices();
  const source = savedInvoices.find((invoice) => invoice.id === id);

  if (!source) return;

  const now = new Date().toISOString();

  const duplicate = {
    ...source,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    invoiceNumber: generateInvoiceNumber(),
    items: safeCloneItems(source.items || []),
  };

  savedInvoices.unshift(duplicate);

  if (!writeSavedInvoices(savedInvoices)) return;

  renderSavedInvoices();
  applyInvoiceData(duplicate);
  closeSavedDrawer();
}

function loadSavedInvoice(id) {
  const invoice = getSavedInvoices().find((saved) => saved.id === id);

  if (!invoice) return;

  applyInvoiceData(invoice);
  closeSavedDrawer();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function calculateTotalsForInvoice(invoice) {
  const invoiceItems = Array.isArray(invoice.items) ? invoice.items : [];

  const subtotal = invoiceItems.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );

  const discountRate = Math.min(
    100,
    Math.max(0, Number(invoice.discountRate) || 0)
  );

  const taxRate = Math.max(0, Number(invoice.taxRate) || 0);

  const discount = subtotal * (discountRate / 100);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * (taxRate / 100);

  return taxableAmount + tax;
}

function renderSavedInvoices() {
  const savedInvoices = getSavedInvoices().sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );

  savedCount.textContent = savedInvoices.length;
  savedInvoicesList.innerHTML = "";

  savedEmpty.hidden = savedInvoices.length > 0;

  savedInvoices.forEach((invoice) => {
    const card = document.createElement("article");
    card.className = "saved-card";

    const invoiceTotal = calculateTotalsForInvoice(invoice);
    const invoiceNumber = invoice.invoiceNumber || "Untitled invoice";
    const clientName = invoice.clientName || "No client name";

    card.innerHTML = `
      <div class="saved-card-top">
        <div>
          <p class="saved-card-number"></p>
          <p class="saved-card-client"></p>
        </div>

        <div>
          <p class="saved-card-total"></p>
          <p class="saved-card-date"></p>
        </div>
      </div>

      <div class="saved-card-actions">
        <button class="saved-action open-invoice" type="button">Open</button>
        <button class="saved-action duplicate-invoice" type="button">Duplicate</button>
        <button class="saved-action delete-invoice" type="button">Delete</button>
      </div>
    `;

    card.querySelector(".saved-card-number").textContent = invoiceNumber;
    card.querySelector(".saved-card-client").textContent = clientName;
    card.querySelector(".saved-card-total").textContent = currencyFormatter(
      invoiceTotal,
      invoice.currency || "MAD"
    );
    card.querySelector(".saved-card-date").textContent =
      `Updated ${formatSavedTimestamp(invoice.updatedAt)}`;

    card
      .querySelector(".open-invoice")
      .addEventListener("click", () => loadSavedInvoice(invoice.id));

    card
      .querySelector(".duplicate-invoice")
      .addEventListener("click", () => duplicateSavedInvoice(invoice.id));

    card
      .querySelector(".delete-invoice")
      .addEventListener("click", () => deleteSavedInvoice(invoice.id));

    savedInvoicesList.appendChild(card);
  });
}

function openSavedDrawer() {
  renderSavedInvoices();
  drawerOverlay.hidden = false;
  document.body.classList.add("drawer-open");

  requestAnimationFrame(() => {
    savedDrawer.classList.add("open");
    savedDrawer.setAttribute("aria-hidden", "false");
  });
}

function closeSavedDrawer() {
  savedDrawer.classList.remove("open");
  savedDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");

  window.setTimeout(() => {
    drawerOverlay.hidden = true;
  }, 250);
}

function renderItemsEditor() {
  itemsEditor.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.dataset.id = item.id;

    row.innerHTML = `
      <input class="item-description" type="text" aria-label="Item description" placeholder="Service description" />
      <input class="item-quantity" type="number" aria-label="Quantity" min="0" step="1" />
      <input class="item-rate" type="number" aria-label="Rate" min="0" step="0.01" />
      <button class="remove-item" type="button" aria-label="Remove item" title="Remove item">×</button>
    `;

    const descriptionInput = row.querySelector(".item-description");
    const quantityInput = row.querySelector(".item-quantity");
    const rateInput = row.querySelector(".item-rate");
    const removeButton = row.querySelector(".remove-item");

    descriptionInput.value = item.description;
    quantityInput.value = item.quantity;
    rateInput.value = item.rate;

    descriptionInput.addEventListener("input", (event) => {
      item.description = event.target.value;
      markDirty();
      updatePreview();
    });

    quantityInput.addEventListener("input", (event) => {
      item.quantity = Math.max(0, Number(event.target.value) || 0);
      markDirty();
      updatePreview();
    });

    rateInput.addEventListener("input", (event) => {
      item.rate = Math.max(0, Number(event.target.value) || 0);
      markDirty();
      updatePreview();
    });

    removeButton.addEventListener("click", () => {
      if (items.length === 1) {
        item.description = "";
        item.quantity = 1;
        item.rate = 0;
      } else {
        items = items.filter((currentItem) => currentItem.id !== item.id);
      }

      renderItemsEditor();
      markDirty();
      updatePreview();
    });

    itemsEditor.appendChild(row);
  });
}

function addItem() {
  items.push({
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    rate: 0,
  });

  renderItemsEditor();

  const rows = itemsEditor.querySelectorAll(".item-row");
  const latestRow = rows[rows.length - 1];

  latestRow?.querySelector(".item-description")?.focus();

  markDirty();
  updatePreview();
}

function calculateTotals() {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  const discountRate = Math.min(
    100,
    Math.max(0, Number(fields.discountRate.value) || 0)
  );

  const taxRate = Math.max(0, Number(fields.taxRate.value) || 0);

  const discount = subtotal * (discountRate / 100);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * (taxRate / 100);
  const total = taxableAmount + tax;

  return {
    subtotal,
    discountRate,
    taxRate,
    discount,
    tax,
    total,
  };
}

function renderPreviewItems() {
  preview.items.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "preview-item";

    const description = document.createElement("span");
    description.className = "preview-item-description";
    description.textContent = item.description.trim() || "Untitled item";

    const quantity = document.createElement("span");
    quantity.textContent = item.quantity;

    const rate = document.createElement("span");
    rate.textContent = currencyFormatter(item.rate);

    const amount = document.createElement("span");
    amount.textContent = currencyFormatter(item.quantity * item.rate);

    row.append(description, quantity, rate, amount);
    preview.items.appendChild(row);
  });
}

function updatePreview() {
  preview.businessName.textContent = textOrFallback(
    fields.businessName.value,
    "Your Business"
  );

  preview.businessEmail.textContent = textOrFallback(
    fields.businessEmail.value,
    "hello@example.com"
  );

  preview.businessAddress.textContent = textOrFallback(
    fields.businessAddress.value,
    "Your address"
  );

  preview.clientName.textContent = textOrFallback(
    fields.clientName.value,
    "Client name"
  );

  preview.clientEmail.textContent = textOrFallback(
    fields.clientEmail.value,
    "client@example.com"
  );

  preview.clientAddress.textContent = textOrFallback(
    fields.clientAddress.value,
    "Client address"
  );

  preview.invoiceNumber.textContent = textOrFallback(
    fields.invoiceNumber.value,
    "INV-0001"
  );

  preview.invoiceDate.textContent = formatDate(fields.invoiceDate.value);
  preview.dueDate.textContent = formatDate(fields.dueDate.value);

  preview.notes.textContent = textOrFallback(
    fields.notes.value,
    "Thank you for your business."
  );

  renderPreviewItems();

  const totals = calculateTotals();

  preview.subtotal.textContent = currencyFormatter(totals.subtotal);
  preview.discount.textContent = `- ${currencyFormatter(totals.discount)}`;
  preview.tax.textContent = currencyFormatter(totals.tax);
  preview.total.textContent = currencyFormatter(totals.total);
  preview.discountLabel.textContent = `Discount (${totals.discountRate}%)`;
  preview.taxLabel.textContent = `Tax (${totals.taxRate}%)`;
  preview.currency.textContent = fields.currency.value;
}

function resetInvoice() {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 14);

  currentInvoiceId = null;
  currentInvoiceCreatedAt = null;

  fields.businessName.value = "";
  fields.businessEmail.value = "";
  fields.businessAddress.value = "";

  fields.clientName.value = "";
  fields.clientEmail.value = "";
  fields.clientAddress.value = "";

  fields.invoiceNumber.value = generateInvoiceNumber();
  fields.currency.value = "MAD";
  fields.invoiceDate.value = getTodayInputValue(today);
  fields.dueDate.value = getTodayInputValue(due);

  fields.taxRate.value = "0";
  fields.discountRate.value = "0";
  fields.notes.value = "";

  items = [
    {
      id: crypto.randomUUID(),
      description: "Landing page development",
      quantity: 1,
      rate: 800,
    },
  ];

  renderItemsEditor();
  updatePreview();

  isDirty = false;
  updateDraftStatus();
}

async function downloadPDF() {
  const invoice = $("#invoicePaper");
  const invoiceNumber =
    fields.invoiceNumber.value.trim().replace(/[^\w-]+/g, "-") || "invoice";

  const originalText = downloadButton.textContent;

  downloadButton.disabled = true;
  downloadButton.textContent = "Preparing PDF...";

  try {
    if (
      typeof html2canvas === "undefined" ||
      !window.jspdf ||
      !window.jspdf.jsPDF
    ) {
      throw new Error("PDF libraries are unavailable.");
    }

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(invoice, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: invoice.scrollWidth,
      windowHeight: invoice.scrollHeight,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("The invoice could not be rendered.");
    }

    const imageData = canvas.toDataURL("image/png", 1.0);

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const widthRatio = pageWidth / canvas.width;
    const heightRatio = pageHeight / canvas.height;
    const ratio = Math.min(widthRatio, heightRatio);

    const renderWidth = canvas.width * ratio;
    const renderHeight = canvas.height * ratio;

    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;

    pdf.addImage(
      imageData,
      "PNG",
      offsetX,
      offsetY,
      renderWidth,
      renderHeight,
      undefined,
      "FAST"
    );

    pdf.save(`${invoiceNumber}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);

    alert(
      "Automatic PDF export failed. The print dialog will open instead. Choose “Save as PDF”."
    );

    window.print();
  } finally {
    downloadButton.disabled = false;
    downloadButton.textContent = originalText;
  }
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", () => {
    markDirty();
    updatePreview();
  });

  field.addEventListener("change", () => {
    markDirty();
    updatePreview();
  });
});

addItemButton.addEventListener("click", addItem);
resetButton.addEventListener("click", resetInvoice);
saveButton.addEventListener("click", saveInvoice);
downloadButton.addEventListener("click", downloadPDF);

savedInvoicesButton.addEventListener("click", openSavedDrawer);
closeSavedDrawerButton.addEventListener("click", closeSavedDrawer);
drawerOverlay.addEventListener("click", closeSavedDrawer);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && savedDrawer.classList.contains("open")) {
    closeSavedDrawer();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveInvoice();
  }
});

migrateLegacyStorage();
renderSavedInvoices();
resetInvoice();
