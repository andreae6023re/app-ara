const SUPABASE_URL = "https://rxkkwsnxgmbzveaipkob.supabase.co";
const SUPABASE_KEY = "sb_publishable_cqZyBl4hAEI77KE39TFilg_In1ZCwzl";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const titles = {
  inicio: "Hola 👋",
  menu: "Tu menú",
  recetas: "Recetario",
  inventario: "Inventario",
  compra: "Lista de compra"
};

let currentInventoryLocation = null;
let editingInventoryId = null;

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));

  const page = document.getElementById(id);
  if (page) page.classList.add("active-page");

  document.querySelectorAll(".nav,.bottom-nav button").forEach(b => {
    b.classList.toggle("active", b.dataset.page === id);
  });

  const pageTitle = document.getElementById("page-title");
  if (pageTitle) pageTitle.textContent = titles[id] || "ARA";

  document.getElementById("sidebar")?.classList.remove("open");
  const overlay = document.getElementById("overlay");
  if (overlay) overlay.style.display = "none";

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (id === "inventario") loadInventory();
}

function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  const open = sidebar.classList.toggle("open");
  const overlay = document.getElementById("overlay");
  if (overlay) overlay.style.display = open ? "block" : "none";
}

async function testSupabaseConnection() {
  const { data, error } = await supabaseClient
    .from("ingredients")
    .select("id, name")
    .limit(1);

  if (error) {
    console.error("❌ Error conectando con Supabase:", error);
    return;
  }

  console.log("✅ Supabase conectado correctamente:", data);
}

function createInventoryModal() {
  if (document.getElementById("inventory-modal")) return;

  const modal = document.createElement("div");
  modal.id = "inventory-modal";

  modal.innerHTML = `
    <div class="inventory-modal-overlay"></div>

    <div class="inventory-modal-box">
      <div class="inventory-modal-header">
        <div>
          <small id="inventory-modal-label">AÑADIR PRODUCTO</small>
          <h2 id="inventory-modal-title">Nuevo producto</h2>
        </div>
        <button type="button" id="close-inventory-modal" class="modal-close">×</button>
      </div>

      <form id="inventory-form">
        <label>
          Producto
          <input id="product-name" type="text" placeholder="Ej. Arroz" required>
        </label>

        <div class="form-row">
          <label>
            Cantidad
            <input id="product-quantity" type="number" step="0.01" min="0" placeholder="1">
          </label>

          <label>
            Unidad
            <select id="product-unit">
              <option value="unidad">unidad</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="paquete">paquete</option>
              <option value="bote">bote</option>
              <option value="lata">lata</option>
              <option value="ración">ración</option>
            </select>
          </label>
        </div>

        <label>
          Ubicación
          <select id="product-location">
            <option value="despensa">🥫 Despensa</option>
            <option value="frigorifico">🥬 Frigorífico</option>
            <option value="congelador">🧊 Congelador</option>
          </select>
        </label>

        <label>
          Fecha de caducidad
          <input id="product-expiration" type="date">
        </label>

        <label>
          Notas
          <textarea id="product-notes" rows="3" placeholder="Opcional"></textarea>
        </label>

        <div class="modal-actions">
          <button type="button" id="cancel-inventory" class="secondary">Cancelar</button>
          <button type="submit" class="primary" id="save-inventory-button">Guardar producto</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("close-inventory-modal")
    .addEventListener("click", closeInventoryModal);

  document.getElementById("cancel-inventory")
    .addEventListener("click", closeInventoryModal);

  modal.querySelector(".inventory-modal-overlay")
    .addEventListener("click", closeInventoryModal);

  document.getElementById("inventory-form")
    .addEventListener("submit", saveInventoryProduct);
}

function resetInventoryModal() {
  editingInventoryId = null;

  const form = document.getElementById("inventory-form");
  if (form) form.reset();

  document.getElementById("inventory-modal-label").textContent = "AÑADIR PRODUCTO";
  document.getElementById("inventory-modal-title").textContent = "Nuevo producto";
  document.getElementById("save-inventory-button").textContent = "Guardar producto";
}

function openInventoryModal(location = "despensa") {
  createInventoryModal();
  resetInventoryModal();

  document.getElementById("product-location").value = location;
  document.getElementById("inventory-modal").classList.add("open");
  document.getElementById("product-name").focus();
}

function openEditInventoryModal(product) {
  createInventoryModal();

  editingInventoryId = product.id;

  document.getElementById("inventory-modal-label").textContent = "EDITAR PRODUCTO";
  document.getElementById("inventory-modal-title").textContent = "Editar producto";
  document.getElementById("save-inventory-button").textContent = "Guardar cambios";

  document.getElementById("product-name").value = product.ingredients?.name || "";
  document.getElementById("product-quantity").value =
    product.quantity === null || product.quantity === undefined ? "" : product.quantity;
  document.getElementById("product-unit").value = product.unit || "unidad";
  document.getElementById("product-location").value = product.location || "despensa";
  document.getElementById("product-expiration").value = product.expiration_date || "";
  document.getElementById("product-notes").value = product.notes || "";

  document.getElementById("inventory-modal").classList.add("open");
  document.getElementById("product-name").focus();
}

function closeInventoryModal() {
  const modal = document.getElementById("inventory-modal");
  if (!modal) return;

  modal.classList.remove("open");
  resetInventoryModal();
}

async function findOrCreateIngredient(name, unit) {
  let { data: ingredient, error } = await supabaseClient
    .from("ingredients")
    .select("id, name")
    .ilike("name", name)
    .maybeSingle();

  if (error) return { ingredient: null, error };

  if (!ingredient) {
    const result = await supabaseClient
      .from("ingredients")
      .insert({ name, default_unit: unit })
      .select()
      .single();

    return { ingredient: result.data, error: result.error };
  }

  return { ingredient, error: null };
}

async function saveInventoryProduct(event) {
  event.preventDefault();

  const name = document.getElementById("product-name").value.trim();
  const quantityValue = document.getElementById("product-quantity").value;
  const unit = document.getElementById("product-unit").value;
  const location = document.getElementById("product-location").value;
  const expiration = document.getElementById("product-expiration").value;
  const notes = document.getElementById("product-notes").value.trim();

  if (!name) {
    alert("Escribe el nombre del producto.");
    return;
  }

  const quantity = quantityValue ? Number(quantityValue) : null;

  if (editingInventoryId) {
    const { ingredient, error: ingredientError } =
      await findOrCreateIngredient(name, unit);

    if (ingredientError) {
      console.error("Error buscando/creando ingrediente:", ingredientError);
      alert("No se pudo guardar el ingrediente.\n\n" + ingredientError.message);
      return;
    }

    const { error } = await supabaseClient
      .from("inventory")
      .update({
        ingredient_id: ingredient.id,
        quantity,
        unit,
        location,
        expiration_date: expiration || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", editingInventoryId);

    if (error) {
      console.error("Error actualizando inventario:", error);
      alert("No se pudo actualizar el producto.\n\n" + error.message);
      return;
    }

    closeInventoryModal();
    await loadInventory();

    if (currentInventoryLocation) {
      await viewInventoryProducts(currentInventoryLocation);
    }

    return;
  }

  const { ingredient, error: ingredientError } =
    await findOrCreateIngredient(name, unit);

  if (ingredientError) {
    console.error("Error creando/buscando ingrediente:", ingredientError);
    alert("No se pudo guardar el ingrediente.\n\n" + ingredientError.message);
    return;
  }

  const { error: inventoryError } = await supabaseClient
    .from("inventory")
    .insert({
      ingredient_id: ingredient.id,
      quantity,
      unit,
      location,
      expiration_date: expiration || null,
      notes: notes || null
    });

  if (inventoryError) {
    console.error("Error guardando inventario:", inventoryError);
    alert("No se pudo guardar el producto.\n\n" + inventoryError.message);
    return;
  }

  closeInventoryModal();
  await loadInventory();
}

async function loadInventory() {
  const { data, error } = await supabaseClient
    .from("inventory")
    .select(`
      id,
      quantity,
      unit,
      location,
      expiration_date,
      notes,
      created_at,
      updated_at,
      ingredients (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando inventario:", error);
    return;
  }

  renderInventory(data || []);
}

function renderInventory(items) {
  const inventoryContainer = document.querySelector(".inventory");
  if (!inventoryContainer) return;

  const locations = [
    {
      id: "despensa",
      emoji: "🥫",
      title: "Despensa",
      description: "Productos secos, conservas y básicos."
    },
    {
      id: "frigorifico",
      emoji: "🥬",
      title: "Frigorífico",
      description: "Lo que tienes fresco."
    },
    {
      id: "congelador",
      emoji: "🧊",
      title: "Congelador",
      description: "Tus productos congelados."
    }
  ];

  inventoryContainer.innerHTML = locations.map(location => {
    const products = items.filter(item => item.location === location.id);

    return `
      <article class="inventory-card">
        <div class="emoji">${location.emoji}</div>
        <h3>${location.title}</h3>
        <p>${location.description}</p>

        <div class="inventory-count">
          ${products.length}
          ${products.length === 1 ? "producto" : "productos"}
        </div>

        <button type="button" onclick="viewInventoryProducts('${location.id}')">
          Ver productos →
        </button>
      </article>
    `;
  }).join("");
}

function formatExpiration(date) {
  if (!date) return "";

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

async function viewInventoryProducts(location) {
  currentInventoryLocation = location;

  const { data, error } = await supabaseClient
    .from("inventory")
    .select(`
      id,
      quantity,
      unit,
      location,
      expiration_date,
      notes,
      ingredients (
        name
      )
    `)
    .eq("location", location)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando productos:", error);
    alert("No se pudieron cargar los productos.\n\n" + error.message);
    return;
  }

  showInventoryProducts(location, data || []);
}

function showInventoryProducts(location, products) {
  document.querySelectorAll(".inventory-products-modal").forEach(modal => modal.remove());

  const names = {
    despensa: "🥫 Despensa",
    frigorifico: "🥬 Frigorífico",
    congelador: "🧊 Congelador"
  };

  const modal = document.createElement("div");
  modal.className = "inventory-products-modal open";

  modal.innerHTML = `
    <div class="inventory-modal-overlay"></div>

    <div class="inventory-modal-box products-box">
      <div class="inventory-modal-header">
        <div>
          <small>INVENTARIO</small>
          <h2>${names[location]}</h2>
        </div>

        <button type="button" class="modal-close">×</button>
      </div>

      <div class="inventory-list-summary">
        ${products.length} ${products.length === 1 ? "producto" : "productos"}
      </div>

      <div class="products-list">
        ${
          products.length === 0
            ? `
              <div class="products-empty">
                <div>📦</div>
                <p>No tienes productos en esta sección.</p>
              </div>
            `
            : products.map(product => {
                const name = product.ingredients?.name || "Producto";
                const quantity = product.quantity !== null && product.quantity !== undefined
                  ? `${product.quantity} ${product.unit || ""}`.trim()
                  : "Sin cantidad";

                const expiration = product.expiration_date
                  ? `Caduca: ${formatExpiration(product.expiration_date)}`
                  : "";

                return `
                  <div class="product-row product-row-rich">
                    <div class="product-main">
                      <strong>${name}</strong>
                      <span>${quantity}</span>
                      ${expiration ? `<small>${expiration}</small>` : ""}
                      ${product.notes ? `<small>${product.notes}</small>` : ""}
                    </div>

                    <div class="product-row-actions">
                      <button
                        type="button"
                        class="edit-product"
                        data-product-id="${product.id}"
                        title="Editar producto"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        class="delete-product"
                        data-product-id="${product.id}"
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                `;
              }).join("")
        }
      </div>

      <div class="modal-actions">
        <button type="button" class="secondary close-products">Cerrar</button>

        <button type="button" class="primary add-from-products">
          ＋ Añadir producto
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".modal-close")
    .addEventListener("click", () => modal.remove());

  modal.querySelector(".close-products")
    .addEventListener("click", () => modal.remove());

  modal.querySelector(".inventory-modal-overlay")
    .addEventListener("click", () => modal.remove());

  modal.querySelector(".add-from-products")
    .addEventListener("click", () => {
      modal.remove();
      openInventoryModal(location);
    });

  modal.querySelectorAll(".edit-product").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.productId);
      const product = products.find(item => item.id === id);
      if (!product) return;

      modal.remove();
      openEditInventoryModal(product);
    });
  });

  modal.querySelectorAll(".delete-product").forEach(button => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.productId);
      await deleteInventoryProduct(id);
    });
  });
}

async function deleteInventoryProduct(id) {
  const confirmed = confirm(
    "¿Quieres eliminar este producto del inventario?"
  );

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("inventory")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando producto:", error);
    alert("No se pudo eliminar el producto.\n\n" + error.message);
    return;
  }

  await loadInventory();

  if (currentInventoryLocation) {
    await viewInventoryProducts(currentInventoryLocation);
  }
}

function setupInventoryButtons() {
  const inventoryPage = document.getElementById("inventario");
  if (!inventoryPage) return;

  const addButton = inventoryPage.querySelector(".page-head .primary");

  if (addButton) {
    addButton.onclick = () => openInventoryModal("despensa");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupInventoryButtons();
  testSupabaseConnection();

  if (document.getElementById("inventario")?.classList.contains("active-page")) {
    loadInventory();
  }
});
