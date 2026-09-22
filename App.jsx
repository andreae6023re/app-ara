import { useState } from "react";
import {
  Home,
  CalendarDays,
  BookOpen,
  Boxes,
  ShoppingCart,
  Settings,
  Menu as MenuIcon,
  X,
  ChevronRight,
  Plus,
  Sparkles
} from "lucide-react";
import { supabaseConfigured } from "./lib/supabase";

const navItems = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "menu", label: "Menú", icon: CalendarDays },
  { id: "recipes", label: "Recetas", icon: BookOpen },
  { id: "inventory", label: "Inventario", icon: Boxes },
  { id: "shopping", label: "Compra", icon: ShoppingCart },
];

function Sidebar({ active, setActive, mobileOpen, setMobileOpen }) {
  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">A</div>
        <div>
          <strong>ARA</strong>
          <span>Comidas</span>
        </div>
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <nav>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${active === id ? "active" : ""}`}
            onClick={() => {
              setActive(id);
              setMobileOpen(false);
            }}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="nav-item">
          <Settings size={19} strokeWidth={1.8} />
          <span>Configuración</span>
        </button>
      </div>
    </aside>
  );
}

function Header({ title, setMobileOpen }) {
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
        <MenuIcon size={22} />
      </button>
      <div>
        <div className="eyebrow">ARA · COMIDAS</div>
        <h1>{title}</h1>
      </div>
    </header>
  );
}

function HomePage({ setActive }) {
  return (
    <div className="page">
      <section className="hero-card">
        <div>
          <span className="soft-label">TU SEMANA</span>
          <h2>Organizar la comida,<br />sin complicaciones.</h2>
          <p>Planifica, aprovecha lo que tienes y ten la compra bajo control.</p>
        </div>
        <div className="hero-icon"><Sparkles size={30} /></div>
      </section>

      <div className="section-heading">
        <div>
          <span className="eyebrow">ACCESOS RÁPIDOS</span>
          <h3>¿Qué quieres hacer?</h3>
        </div>
      </div>

      <div className="quick-grid">
        {[
          ["menu", "Planificar menú", "Organiza esta semana", CalendarDays],
          ["recipes", "Ver recetas", "Busca qué cocinar", BookOpen],
          ["inventory", "Revisar inventario", "Mira qué tienes", Boxes],
          ["shopping", "Lista de compra", "Añade lo que falta", ShoppingCart],
        ].map(([id, title, text, Icon]) => (
          <button className="quick-card" key={id} onClick={() => setActive(id)}>
            <div className="quick-icon"><Icon size={20} /></div>
            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
            <ChevronRight size={18} className="arrow" />
          </button>
        ))}
      </div>

      {!supabaseConfigured && (
        <div className="setup-note">
          <strong>Supabase todavía no está conectado.</strong>
          <span>Cuando creemos el proyecto, añadiremos tus claves en el archivo <code>.env</code>.</span>
        </div>
      )}
    </div>
  );
}

function MenuPage() {
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  return (
    <div className="page">
      <div className="page-actions">
        <div>
          <span className="eyebrow">SEMANA</span>
          <h2>Menú semanal</h2>
        </div>
        <button className="primary-btn"><Sparkles size={17} /> Generar menú</button>
      </div>
      <div className="week-grid">
        {days.map((day, i) => (
          <article className="day-card" key={day}>
            <div className="day-head">
              <strong>{day}</strong>
              <span>{i + 1}</span>
            </div>
            <Meal label="Desayuno" />
            <Meal label="Comida" />
            <Meal label="Cena" />
          </article>
        ))}
      </div>
    </div>
  );
}

function Meal({ label }) {
  return (
    <button className="meal-slot">
      <span>{label}</span>
      <em>+ Añadir</em>
    </button>
  );
}

function RecipesPage() {
  const categories = ["Todas", "Comidas", "Cenas", "Desayunos", "Dulces", "Pan"];
  return (
    <div className="page">
      <div className="page-actions">
        <div>
          <span className="eyebrow">RECETARIO</span>
          <h2>Recetas</h2>
        </div>
        <button className="primary-btn"><Plus size={17} /> Nueva receta</button>
      </div>
      <div className="chips">
        {categories.map((category, i) => (
          <button className={`chip ${i === 0 ? "selected" : ""}`} key={category}>{category}</button>
        ))}
      </div>
      <div className="empty-state">
        <div className="empty-icon"><BookOpen size={26} /></div>
        <h3>Aún no hay recetas</h3>
        <p>Cuando añadamos Supabase podremos guardar aquí todo tu recetario.</p>
        <button className="secondary-btn"><Plus size={17} /> Añadir receta</button>
      </div>
    </div>
  );
}

function InventoryPage() {
  const areas = [
    ["Despensa", "Productos secos, conservas y básicos", "🥫"],
    ["Frigorífico", "Lo que tienes fresco", "🥬"],
    ["Congelador", "Tus productos congelados", "🧊"],
  ];
  return (
    <div className="page">
      <div className="page-actions">
        <div>
          <span className="eyebrow">INVENTARIO</span>
          <h2>Lo que tienes</h2>
        </div>
        <button className="primary-btn"><Plus size={17} /> Añadir producto</button>
      </div>
      <div className="inventory-grid">
        {areas.map(([title, text, emoji]) => (
          <article className="inventory-card" key={title}>
            <div className="inventory-emoji">{emoji}</div>
            <h3>{title}</h3>
            <p>{text}</p>
            <button className="text-btn">Ver productos <ChevronRight size={16} /></button>
          </article>
        ))}
      </div>
    </div>
  );
}

function ShoppingPage() {
  return (
    <div className="page">
      <div className="page-actions">
        <div>
          <span className="eyebrow">COMPRA</span>
          <h2>Lista de compra</h2>
        </div>
        <button className="primary-btn"><Plus size={17} /> Añadir</button>
      </div>
      <div className="empty-state compact">
        <div className="empty-icon"><ShoppingCart size={26} /></div>
        <h3>Tu lista está vacía</h3>
        <p>Los ingredientes que falten para tu menú podrán aparecer aquí automáticamente.</p>
      </div>
    </div>
  );
}

function App() {
  const [active, setActive] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  const titles = {
    home: "Hola 👋",
    menu: "Tu menú",
    recipes: "Recetario",
    inventory: "Inventario",
    shopping: "Lista de compra",
  };

  const pages = {
    home: <HomePage setActive={setActive} />,
    menu: <MenuPage />,
    recipes: <RecipesPage />,
    inventory: <InventoryPage />,
    shopping: <ShoppingPage />,
  };

  return (
    <div className="app-shell">
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <Sidebar {...{ active, setActive, mobileOpen, setMobileOpen }} />
      <main className="main">
        <Header title={titles[active]} setMobileOpen={setMobileOpen} />
        {pages[active]}
      </main>
      <div className="mobile-bottom">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={active === id ? "active" : ""} onClick={() => setActive(id)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;