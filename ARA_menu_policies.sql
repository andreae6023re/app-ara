-- Políticas de desarrollo para Menú
-- Ejecutar en Supabase > SQL Editor.

create policy "anon can read meal_plans"
on meal_plans
for select
to anon
using (true);

create policy "anon can insert meal_plans"
on meal_plans
for insert
to anon
with check (true);

create policy "anon can update meal_plans"
on meal_plans
for update
to anon
using (true)
with check (true);

create policy "anon can delete meal_plans"
on meal_plans
for delete
to anon
using (true);

create policy "anon can read meal_plan_items"
on meal_plan_items
for select
to anon
using (true);

create policy "anon can insert meal_plan_items"
on meal_plan_items
for insert
to anon
with check (true);

create policy "anon can update meal_plan_items"
on meal_plan_items
for update
to anon
using (true)
with check (true);

create policy "anon can delete meal_plan_items"
on meal_plan_items
for delete
to anon
using (true);
