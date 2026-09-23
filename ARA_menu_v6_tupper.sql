-- ARA · Añadir indicador de tupper al menú
alter table meal_plan_items
add column if not exists is_tupper boolean default false;

update meal_plan_items
set is_tupper = false
where is_tupper is null;
