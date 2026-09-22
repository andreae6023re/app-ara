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

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));

  const page = document.getElementById(id);
  if (page) page.classList.add("active-page");

  document.querySelectorAll(".nav,.bottom-nav button").forEach(b => {
    b.classList.toggle("active", b.dataset.page === id);
  });

  const pageTitle = document.getElementById("page-title");
  if (pageTitle) pageTitle.textContent = titles[id] || "ARA";

  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("open");

  const overlay = document.getElementById("overlay");
  if (overlay) overlay.style.display = "none";

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (id === "inventario") {
    loadInventory();
  }

  if (id === "recetas") {
    setupRecipeButtons();
    loadRecipes();
  }
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

let currentInventoryLocation = null;

function createInventoryModal() {
  if (document.getElementById("inventory-modal")) return;

  const modal = document.createElement("div");
  modal.id = "inventory-modal";

  modal.innerHTML = `
    <div class="inventory-modal-overlay"></div>

    <div class="inventory-modal-box">
      <div class="inventory-modal-header">
        <div>
          <small>AÑADIR PRODUCTO</small>
          <h2>Nuevo producto</h2>
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
          <button type="submit" class="primary">Guardar producto</button>
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

function openInventoryModal(location = "despensa") {
  createInventoryModal();

  document.getElementById("product-location").value = location;
  document.getElementById("inventory-modal").classList.add("open");
  document.getElementById("product-name").focus();
}

function closeInventoryModal() {
  const modal = document.getElementById("inventory-modal");
  if (!modal) return;

  modal.classList.remove("open");

  const form = document.getElementById("inventory-form");
  if (form) form.reset();
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

  let { data: ingredient, error: ingredientError } = await supabaseClient
    .from("ingredients")
    .select("id, name")
    .ilike("name", name)
    .maybeSingle();

  if (ingredientError) {
    console.error("Error buscando ingrediente:", ingredientError);
    alert("No se pudo comprobar el ingrediente.");
    return;
  }

  if (!ingredient) {
    const result = await supabaseClient
      .from("ingredients")
      .insert({
        name,
        default_unit: unit
      })
      .select()
      .single();

    ingredient = result.data;
    ingredientError = result.error;

    if (ingredientError) {
      console.error("Error creando ingrediente:", ingredientError);
      alert("No se pudo crear el ingrediente.");
      return;
    }
  }

  const { error: inventoryError } = await supabaseClient
    .from("inventory")
    .insert({
      ingredient_id: ingredient.id,
      quantity: quantityValue ? Number(quantityValue) : null,
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
  alert("Producto añadido correctamente.");
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

        <button
          type="button"
          onclick="viewInventoryProducts('${location.id}')"
        >
          Ver productos →
        </button>
      </article>
    `;
  }).join("");
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
                const quantity = product.quantity !== null
                  ? `${product.quantity} ${product.unit || ""}`.trim()
                  : "";

                return `
                  <div class="product-row">
                    <div>
                      <strong>${name}</strong>
                      <span>${quantity}</span>
                    </div>

                    <button
                      type="button"
                      class="delete-product"
                      onclick="deleteInventoryProduct(${product.id})"
                    >
                      🗑️
                    </button>
                  </div>
                `;
              }).join("")
        }
      </div>

      <div class="modal-actions">
        <button type="button" class="secondary close-products">
          Cerrar
        </button>

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

  document.querySelectorAll(".inventory-products-modal")
    .forEach(modal => modal.remove());

  await loadInventory();
}

function setupInventoryButtons() {
  const inventoryPage = document.getElementById("inventario");
  if (!inventoryPage) return;

  const addButton = inventoryPage.querySelector(".page-head .primary");

  if (addButton) {
    addButton.onclick = () => openInventoryModal("despensa");
  }
}


/* =========================================================
   RECETAS
   ========================================================= */

let currentRecipeId = null;
let currentRecipeFilter = "todas";

function createRecipeModal() {
  if (document.getElementById("recipe-modal")) return;

  const modal = document.createElement("div");
  modal.id = "recipe-modal";

  modal.innerHTML = `
    <div class="recipe-modal-overlay"></div>

    <div class="recipe-modal-box">
      <div class="inventory-modal-header">
        <div>
          <small id="recipe-modal-label">NUEVA RECETA</small>
          <h2 id="recipe-modal-title">Nueva receta</h2>
        </div>
        <button type="button" class="modal-close" id="close-recipe-modal">×</button>
      </div>

      <form id="recipe-form">
        <label>
          Nombre
          <input id="recipe-name" type="text" placeholder="Ej. Pasta con verduras" required>
        </label>

        <label>
          Descripción
          <textarea id="recipe-description" rows="2" placeholder="Opcional"></textarea>
        </label>

        <label>
          Preparación
          <textarea id="recipe-preparation" rows="7" placeholder="Pasos de la receta"></textarea>
        </label>

        <div class="form-row recipe-form-row">
          <label>
            Raciones
            <input id="recipe-servings" type="number" step="0.5" min="0" placeholder="1">
          </label>

          <label>
            Temperatura (°C)
            <input id="recipe-temperature" type="number" step="1" min="0" placeholder="Opcional">
          </label>
        </div>

        <div class="form-row recipe-form-row">
          <label>
            Tiempo preparación (min)
            <input id="recipe-prep-time" type="number" min="0" step="1" placeholder="0">
          </label>

          <label>
            Tiempo cocción (min)
            <input id="recipe-cook-time" type="number" min="0" step="1" placeholder="0">
          </label>
        </div>

        <label>
          Imagen (URL)
          <input id="recipe-image" type="url" placeholder="https://...">
        </label>

        <div class="recipe-checks">
          <label class="recipe-check">
            <input id="recipe-fun" type="checkbox">
            <span>🍿 Receta divertida</span>
          </label>

          <label class="recipe-check">
            <input id="recipe-freezable" type="checkbox">
            <span>❄️ Se puede congelar</span>
          </label>

          <label class="recipe-check">
            <input id="recipe-dont-suggest" type="checkbox">
            <span>🚫 No sugerir</span>
          </label>
        </div>

        <div class="recipe-ingredients-section">
          <div class="recipe-form-section-head">
            <div>
              <strong>Ingredientes</strong>
              <span>Añade cantidades y unidades.</span>
            </div>
            <button type="button" class="secondary" id="add-recipe-ingredient">＋ Añadir</button>
          </div>

          <div id="recipe-ingredients-list"></div>
        </div>

        <div class="modal-actions">
          <button type="button" class="secondary" id="cancel-recipe">Cancelar</button>
          <button type="submit" class="primary" id="save-recipe-button">Guardar receta</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#close-recipe-modal")
    .addEventListener("click", closeRecipeModal);

  modal.querySelector("#cancel-recipe")
    .addEventListener("click", closeRecipeModal);

  modal.querySelector(".recipe-modal-overlay")
    .addEventListener("click", closeRecipeModal);

  modal.querySelector("#add-recipe-ingredient")
    .addEventListener("click", () => addRecipeIngredientRow());

  modal.querySelector("#recipe-form")
    .addEventListener("submit", saveRecipe);

  addRecipeIngredientRow();
}

function resetRecipeModal() {
  currentRecipeId = null;

  const form = document.getElementById("recipe-form");
  if (form) form.reset();

  document.getElementById("recipe-modal-label").textContent = "NUEVA RECETA";
  document.getElementById("recipe-modal-title").textContent = "Nueva receta";
  document.getElementById("save-recipe-button").textContent = "Guardar receta";

  document.getElementById("recipe-ingredients-list").innerHTML = "";
  addRecipeIngredientRow();
}

function addRecipeIngredientRow(values = {}) {
  const container = document.getElementById("recipe-ingredients-list");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "recipe-ingredient-row";

  row.innerHTML = `
    <input class="recipe-ingredient-name" type="text" placeholder="Ingrediente" value="${escapeHtml(values.name || "")}">
    <input class="recipe-ingredient-quantity" type="number" min="0" step="0.01" placeholder="Cantidad" value="${values.quantity ?? ""}">
    <select class="recipe-ingredient-unit">
      ${["g","kg","ml","l","unidad","cucharadita","cucharada","pizca","paquete"].map(unit =>
        `<option value="${unit}" ${values.unit === unit ? "selected" : ""}>${unit}</option>`
      ).join("")}
    </select>
    <input class="recipe-ingredient-notes" type="text" placeholder="Nota" value="${escapeHtml(values.notes || "")}">
    <button type="button" class="remove-recipe-ingredient" title="Eliminar">×</button>
  `;

  row.querySelector(".remove-recipe-ingredient")
    .addEventListener("click", () => {
      const rows = container.querySelectorAll(".recipe-ingredient-row");
      if (rows.length === 1) {
        row.querySelectorAll("input").forEach(input => input.value = "");
        row.querySelector(".recipe-ingredient-quantity").value = "";
        row.querySelector(".recipe-ingredient-notes").value = "";
        return;
      }
      row.remove();
    });

  container.appendChild(row);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openRecipeModal() {
  createRecipeModal();
  resetRecipeModal();
  document.getElementById("recipe-modal").classList.add("open");
  document.getElementById("recipe-name").focus();
}

window.openRecipeModal = openRecipeModal;

async function openEditRecipeModal(recipeId) {
  createRecipeModal();

  const { data: recipe, error } = await supabaseClient
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .single();

  if (error) {
    console.error("Error cargando receta:", error);
    alert("No se pudo cargar la receta.\n\n" + error.message);
    return;
  }

  const { data: relations, error: relationError } = await supabaseClient
    .from("recipe_ingredients")
    .select(`
      quantity,
      unit,
      notes,
      ingredients (
        name
      )
    `)
    .eq("recipe_id", recipeId);

  if (relationError) {
    console.error("Error cargando ingredientes de receta:", relationError);
    alert("No se pudieron cargar los ingredientes.\n\n" + relationError.message);
    return;
  }

  currentRecipeId = recipeId;

  document.getElementById("recipe-modal-label").textContent = "EDITAR RECETA";
  document.getElementById("recipe-modal-title").textContent = "Editar receta";
  document.getElementById("save-recipe-button").textContent = "Guardar cambios";

  document.getElementById("recipe-name").value = recipe.name || "";
  document.getElementById("recipe-description").value = recipe.description || "";
  document.getElementById("recipe-preparation").value = recipe.preparation || "";
  document.getElementById("recipe-servings").value = recipe.servings ?? "";
  document.getElementById("recipe-prep-time").value = recipe.prep_time ?? "";
  document.getElementById("recipe-cook-time").value = recipe.cook_time ?? "";
  document.getElementById("recipe-temperature").value = recipe.temperature ?? "";
  document.getElementById("recipe-image").value = recipe.image_url || "";
  document.getElementById("recipe-fun").checked = !!recipe.fun_recipe;
  document.getElementById("recipe-freezable").checked = !!recipe.is_freezable;
  document.getElementById("recipe-dont-suggest").checked = !!recipe.do_not_suggest;

  const container = document.getElementById("recipe-ingredients-list");
  container.innerHTML = "";

  if (!relations?.length) {
    addRecipeIngredientRow();
  } else {
    relations.forEach(item => addRecipeIngredientRow({
      name: item.ingredients?.name || "",
      quantity: item.quantity,
      unit: item.unit || "unidad",
      notes: item.notes || ""
    }));
  }

  document.getElementById("recipe-modal").classList.add("open");
}

function closeRecipeModal() {
  const modal = document.getElementById("recipe-modal");
  if (!modal) return;

  modal.classList.remove("open");
  resetRecipeModal();
}

function collectRecipeIngredients() {
  return [...document.querySelectorAll(".recipe-ingredient-row")]
    .map(row => ({
      name: row.querySelector(".recipe-ingredient-name").value.trim(),
      quantity: row.querySelector(".recipe-ingredient-quantity").value,
      unit: row.querySelector(".recipe-ingredient-unit").value,
      notes: row.querySelector(".recipe-ingredient-notes").value.trim()
    }))
    .filter(item => item.name);
}

async function findOrCreateIngredient(name, unit) {
  let { data: ingredient, error } = await supabaseClient
    .from("ingredients")
    .select("id, name")
    .ilike("name", name)
    .maybeSingle();

  if (error) {
    return { ingredient: null, error };
  }

  if (!ingredient) {
    const result = await supabaseClient
      .from("ingredients")
      .insert({
        name,
        default_unit: unit || null
      })
      .select()
      .single();

    return {
      ingredient: result.data,
      error: result.error
    };
  }

  return {
    ingredient,
    error: null
  };
}

async function saveRecipe(event) {
  event.preventDefault();

  const name = document.getElementById("recipe-name").value.trim();
  if (!name) {
    alert("Escribe el nombre de la receta.");
    return;
  }

  const payload = {
    name,
    description: document.getElementById("recipe-description").value.trim() || null,
    preparation: document.getElementById("recipe-preparation").value.trim() || null,
    servings: document.getElementById("recipe-servings").value
      ? Number(document.getElementById("recipe-servings").value)
      : null,
    prep_time: document.getElementById("recipe-prep-time").value
      ? Number(document.getElementById("recipe-prep-time").value)
      : null,
    cook_time: document.getElementById("recipe-cook-time").value
      ? Number(document.getElementById("recipe-cook-time").value)
      : null,
    temperature: document.getElementById("recipe-temperature").value
      ? Number(document.getElementById("recipe-temperature").value)
      : null,
    image_url: document.getElementById("recipe-image").value.trim() || null,
    fun_recipe: document.getElementById("recipe-fun").checked,
    is_freezable: document.getElementById("recipe-freezable").checked,
    do_not_suggest: document.getElementById("recipe-dont-suggest").checked
  };

  let recipeId = currentRecipeId;

  if (recipeId) {
    const { error } = await supabaseClient
      .from("recipes")
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq("id", recipeId);

    if (error) {
      console.error("Error actualizando receta:", error);
      alert("No se pudo actualizar la receta.\n\n" + error.message);
      return;
    }

    const { error: deleteError } = await supabaseClient
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipeId);

    if (deleteError) {
      console.error("Error actualizando ingredientes:", deleteError);
      alert("La receta se actualizó, pero no se pudieron actualizar los ingredientes.\n\n" + deleteError.message);
      return;
    }
  } else {
    const { data, error } = await supabaseClient
      .from("recipes")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error creando receta:", error);
      alert("No se pudo crear la receta.\n\n" + error.message);
      return;
    }

    recipeId = data.id;
  }

  const ingredients = collectRecipeIngredients();

  for (const item of ingredients) {
    const { ingredient, error: ingredientError } = await findOrCreateIngredient(item.name, item.unit);

    if (ingredientError) {
      console.error("Error con ingrediente de receta:", ingredientError);
      alert("La receta se guardó, pero hubo un problema con el ingrediente " + item.name + ".\n\n" + ingredientError.message);
      continue;
    }

    const { error: relationError } = await supabaseClient
      .from("recipe_ingredients")
      .insert({
        recipe_id: recipeId,
        ingredient_id: ingredient.id,
        quantity: item.quantity ? Number(item.quantity) : null,
        unit: item.unit || null,
        notes: item.notes || null
      });

    if (relationError) {
      console.error("Error guardando ingrediente de receta:", relationError);
    }
  }

  closeRecipeModal();
  await loadRecipes();
}

async function loadRecipes() {
  const { data, error } = await supabaseClient
    .from("recipes")
    .select(`
      id,
      name,
      description,
      preparation,
      servings,
      prep_time,
      cook_time,
      temperature,
      image_url,
      fun_recipe,
      is_freezable,
      do_not_suggest,
      created_at,
      updated_at
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error cargando recetas:", error);
    renderRecipesError(error);
    return;
  }

  renderRecipes(data || []);
}

function renderRecipesError(error) {
  const page = document.getElementById("recetas");
  if (!page) return;

  const empty = page.querySelector(".empty");
  if (empty) {
    empty.innerHTML = `
      <div class="empty-icon">!</div>
      <h3>No se pudieron cargar las recetas</h3>
      <p>${escapeHtml(error.message || "Error desconocido")}</p>
    `;
  }
}

function recipeMatchesFilter(recipe) {
  if (currentRecipeFilter === "todas") return true;

  if (currentRecipeFilter === "divertidas") return !!recipe.fun_recipe;
  if (currentRecipeFilter === "congelables") return !!recipe.is_freezable;
  if (currentRecipeFilter === "no-sugerir") return !!recipe.do_not_suggest;

  return true;
}

function recipeCardHtml(recipe) {
  const meta = [];

  if (recipe.prep_time) meta.push(`⏱ ${recipe.prep_time} min prep`);
  if (recipe.cook_time) meta.push(`🔥 ${recipe.cook_time} min`);
  if (recipe.servings) meta.push(`🍽 ${recipe.servings} ración${recipe.servings === 1 ? "" : "es"}`);

  if (recipe.fun_recipe) meta.push("🍿 Divertida");
  if (recipe.is_freezable) meta.push("❄️ Congela");

  const imageHtml = recipe.image_url
    ? `<img src="${escapeHtml(recipe.image_url)}" alt="${escapeHtml(recipe.name)}">`
    : `<div class="recipe-placeholder">🍽️</div>`;

  return `
    <article class="recipe-card">
      <div class="recipe-image">${imageHtml}</div>

      <div class="recipe-content">
        <h3>${escapeHtml(recipe.name)}</h3>

        <p>${escapeHtml(recipe.description || "Sin descripción")}</p>

        <div class="recipe-meta">
          ${meta.map(item => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
        </div>

        <div class="recipe-card-actions">
          <button type="button" class="primary recipe-view" data-id="${recipe.id}">
            Ver receta
          </button>

          <button type="button" class="secondary recipe-edit" data-id="${recipe.id}">
            Editar
          </button>

          <button type="button" class="recipe-delete" data-id="${recipe.id}">
            Eliminar
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderRecipes(recipes) {
  const page = document.getElementById("recetas");
  if (!page) return;

  const filtered = recipes.filter(recipeMatchesFilter);

  let container = page.querySelector(".recipe-grid");
  if (!container) {
    container = document.createElement("div");
    container.className = "recipe-grid";

    const empty = page.querySelector(".empty");
    if (empty) empty.replaceWith(container);
    else page.appendChild(container);
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty recipe-empty">
        <div class="empty-icon">▤</div>
        <h3>${recipes.length ? "No hay recetas en este filtro" : "Aún no hay recetas"}</h3>
        <p>${recipes.length ? "Prueba otra categoría o crea una receta nueva." : "Crea tu primera receta y aparecerá aquí."}</p>
        <button class="secondary" id="empty-recipe-add">＋ Añadir receta</button>
      </div>
    `;

    const emptyAdd = container.querySelector("#empty-recipe-add");
    if (emptyAdd) {
      emptyAdd.onclick = openRecipeModal;
    }

    return;
  }

  container.innerHTML = filtered.map(recipeCardHtml).join("");

  container.querySelectorAll(".recipe-view").forEach(button => {
    button.addEventListener("click", () => openRecipeDetail(Number(button.dataset.id)));
  });

  container.querySelectorAll(".recipe-edit").forEach(button => {
    button.addEventListener("click", () => openEditRecipeModal(Number(button.dataset.id)));
  });

  container.querySelectorAll(".recipe-delete").forEach(button => {
    button.addEventListener("click", () => deleteRecipe(Number(button.dataset.id)));
  });
}


/* =========================================================
   FICHA COMPLETA DE RECETA
   ========================================================= */

async function openRecipeDetail(recipeId) {
  const { data: recipe, error } = await supabaseClient
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .single();

  if (error) {
    console.error("Error cargando detalle de receta:", error);
    alert("No se pudo cargar la receta.\n\n" + error.message);
    return;
  }

  const { data: ingredients, error: ingredientsError } = await supabaseClient
    .from("recipe_ingredients")
    .select(`
      quantity,
      unit,
      notes,
      ingredients (
        name
      )
    `)
    .eq("recipe_id", recipeId);

  if (ingredientsError) {
    console.error("Error cargando ingredientes:", ingredientsError);
    alert("No se pudieron cargar los ingredientes.\n\n" + ingredientsError.message);
    return;
  }

  showRecipeDetail(recipe, ingredients || []);
}

function showRecipeDetail(recipe, ingredients) {
  document.querySelectorAll(".recipe-detail-modal").forEach(modal => modal.remove());

  const modal = document.createElement("div");
  modal.className = "recipe-detail-modal open";

  const imageHtml = recipe.image_url
    ? `<img src="${escapeHtml(recipe.image_url)}" alt="${escapeHtml(recipe.name)}">`
    : `<div class="recipe-detail-placeholder">🍽️</div>`;

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const meta = [];
  if (recipe.servings) meta.push(`🍽 ${recipe.servings} ración${recipe.servings === 1 ? "" : "es"}`);
  if (recipe.prep_time) meta.push(`⏱ ${recipe.prep_time} min preparación`);
  if (recipe.cook_time) meta.push(`🔥 ${recipe.cook_time} min cocción`);
  if (totalTime) meta.push(`⌛ ${totalTime} min total`);
  if (recipe.temperature) meta.push(`🌡️ ${recipe.temperature} °C`);

  const tags = [];
  if (recipe.fun_recipe) tags.push("🍿 Receta divertida");
  if (recipe.is_freezable) tags.push("❄️ Se puede congelar");
  if (recipe.do_not_suggest) tags.push("🚫 No sugerir");

  modal.innerHTML = `
    <div class="recipe-detail-overlay"></div>

    <div class="recipe-detail-box">
      <div class="recipe-detail-top">
        <button type="button" class="recipe-detail-close" title="Cerrar">×</button>
      </div>

      <div class="recipe-detail-image">
        ${imageHtml}
      </div>

      <div class="recipe-detail-content">
        <small>RECETA</small>
        <h2>${escapeHtml(recipe.name)}</h2>

        ${recipe.description ? `<p class="recipe-detail-description">${escapeHtml(recipe.description)}</p>` : ""}

        ${meta.length ? `
          <div class="recipe-detail-meta">
            ${meta.map(item => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
          </div>
        ` : ""}

        ${tags.length ? `
          <div class="recipe-detail-tags">
            ${tags.map(item => `<span class="recipe-detail-tag">${escapeHtml(item)}</span>`).join("")}
          </div>
        ` : ""}

        <section class="recipe-detail-section">
          <h3>Ingredientes</h3>

          ${
            ingredients.length
              ? `
                <div class="recipe-detail-ingredients">
                  ${ingredients.map(item => `
                    <div class="recipe-detail-ingredient">
                      <span>${escapeHtml(item.ingredients?.name || "Ingrediente")}</span>
                      <strong>${item.quantity !== null && item.quantity !== undefined ? escapeHtml(String(item.quantity)) : ""} ${escapeHtml(item.unit || "")}</strong>
                      ${item.notes ? `<small>${escapeHtml(item.notes)}</small>` : ""}
                    </div>
                  `).join("")}
                </div>
              `
              : `<p class="recipe-detail-muted">Esta receta todavía no tiene ingredientes añadidos.</p>`
          }
        </section>

        <section class="recipe-detail-section">
          <h3>Preparación</h3>

          ${
            recipe.preparation
              ? `<div class="recipe-detail-preparation">${escapeHtml(recipe.preparation).replace(/\n/g, "<br>")}</div>`
              : `<p class="recipe-detail-muted">No se ha añadido la preparación.</p>`
          }
        </section>

        <div class="recipe-detail-actions">
          <button type="button" class="secondary recipe-detail-edit">Editar receta</button>
          <button type="button" class="primary recipe-detail-close-bottom">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();

  modal.querySelector(".recipe-detail-close").addEventListener("click", close);
  modal.querySelector(".recipe-detail-close-bottom").addEventListener("click", close);
  modal.querySelector(".recipe-detail-overlay").addEventListener("click", close);

  modal.querySelector(".recipe-detail-edit").addEventListener("click", () => {
    modal.remove();
    openEditRecipeModal(recipe.id);
  });
}

async function deleteRecipe(id) {
  const confirmed = confirm("¿Quieres eliminar esta receta?");

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("recipes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando receta:", error);
    alert("No se pudo eliminar la receta.\n\n" + error.message);
    return;
  }

  await loadRecipes();
}

function setupRecipeButtons() {
  const page = document.getElementById("recetas");
  if (!page) return;

  const addRecipeButton = page.querySelector(".page-head .primary");
  if (addRecipeButton) {
    addRecipeButton.onclick = openRecipeModal;
  }

  page.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      page.querySelectorAll(".chip").forEach(item => item.classList.remove("selected"));
      chip.classList.add("selected");

      const label = chip.textContent.trim().toLowerCase();

      if (label === "todas") currentRecipeFilter = "todas";
      else if (label === "divertidas") currentRecipeFilter = "divertidas";
      else if (label === "congelables") currentRecipeFilter = "congelables";
      else if (label === "no sugerir") currentRecipeFilter = "no-sugerir";
      else currentRecipeFilter = "todas";

      loadRecipes();
    });
  });
}

/* Reemplaza los filtros de texto iniciales por filtros que sí podemos soportar
   con el esquema actual. */
function normalizeRecipeFilters() {
  const page = document.getElementById("recetas");
  if (!page) return;

  const chips = page.querySelector(".chips");
  if (!chips) return;

  chips.innerHTML = `
    <button class="chip selected" type="button">Todas</button>
    <button class="chip" type="button">Divertidas</button>
    <button class="chip" type="button">Congelables</button>
    <button class="chip" type="button">No sugerir</button>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  setupInventoryButtons();
  testSupabaseConnection();

  normalizeRecipeFilters();
  setupRecipeButtons();
  loadRecipes();

  if (document.getElementById("inventario")?.classList.contains("active-page")) {
    loadInventory();
  }
});
