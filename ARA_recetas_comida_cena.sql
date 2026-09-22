-- ARA · Migración de recetas: COMIDA / CENA
-- Ejecutar en Supabase > SQL Editor

alter table recipes
  add column if not exists meal_types text[] not null default ARRAY['comida','cena'];

update recipes
set meal_types = ARRAY['comida','cena']
where meal_types is null or cardinality(meal_types) = 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'recipes_meal_types_check'
      and conrelid = 'recipes'::regclass
  ) then
    alter table recipes
      add constraint recipes_meal_types_check
      check (
        cardinality(meal_types) between 1 and 2
        and meal_types <@ ARRAY['comida','cena']::text[]
      );
  end if;
end $$;
