const SUPABASE_URL = "https://rxkkwsnxgmbzveaipkob.supabase.co";

const SUPABASE_KEY = "sb_publishable_cqZyBl4hAEI77KE39TFilg_In1ZCwzl";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
const titles={inicio:"Hola 👋",menu:"Tu menú",recetas:"Recetario",inventario:"Inventario",compra:"Lista de compra"};
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
  const page=document.getElementById(id);
  if(page) page.classList.add("active-page");
  document.querySelectorAll(".nav,.bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  document.getElementById("page-title").textContent=titles[id]||"ARA";
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").style.display="none";
  window.scrollTo({top:0,behavior:"smooth"});
}
function toggleMenu(){
  const open=document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").style.display=open?"block":"none";
}
