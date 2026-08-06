-- Expands categories per product feedback — adds the missing ones without
-- touching existing categories (which may already have real content tagged).

insert into public.categories (slug, name, description, sort_order) values
  ('money', 'Money', 'Salary, bills, and the eternal broke-before-month-end struggle', 9),
  ('family', 'Family', 'Naija family group chat and house-of-God energy', 10),
  ('school', 'School', 'Exam season, lecturers, and assignment deadlines', 11),
  ('church', 'Church', 'Sunday service and choir-rehearsal humor', 12),
  ('lagos', 'Lagos', 'Traffic, danfo, and the general chaos of Lagos life', 13),
  ('savage', 'Savage', 'No chill, no filter, straight roasting', 14)
on conflict (slug) do nothing;
