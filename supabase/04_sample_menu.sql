-- 04: Sample menu (prices are placeholders for the prototype).
insert into public.categories (name, sort_order) values
  ('Coffee', 1), ('Other drinks', 2), ('Breakfast', 3), ('Lunch', 4), ('Cabinet', 5);

insert into public.menu_items (category_id, name, description, price, prep_time_minutes)
select c.id, v.name, v.description, v.price, v.prep from (values
  ('Coffee', 'Flat White', 'Double shot with silky steamed milk', 5.50, 3),
  ('Coffee', 'Cappuccino', 'Espresso, steamed milk, thick foam and chocolate dusting', 5.50, 3),
  ('Coffee', 'Long Black', 'Double shot over hot water', 5.00, 2),
  ('Coffee', 'Mocha', 'Espresso, chocolate and steamed milk', 6.00, 4),
  ('Other drinks', 'Hot Chocolate', 'Rich chocolate with steamed milk', 5.50, 3),
  ('Other drinks', 'English Breakfast Tea', 'A pot of loose-leaf tea', 5.00, 2),
  ('Other drinks', 'Iced Coffee', 'Espresso, milk, ice cream and cream', 7.50, 4),
  ('Other drinks', 'Fresh Orange Juice', 'Squeezed to order', 6.50, 3),
  ('Breakfast', 'Eggs Benedict', 'Poached eggs, bacon and hollandaise on toasted sourdough', 22.00, 15),
  ('Breakfast', 'Smashed Avocado', 'Avocado, feta and a poached egg on sourdough', 18.50, 12),
  ('Breakfast', 'Big Breakfast', 'Eggs, bacon, sausage, hash brown, mushrooms and toast', 25.00, 18),
  ('Breakfast', 'Bircher Muesli', 'Oats soaked overnight with apple, yoghurt and berries', 14.00, 5),
  ('Lunch', 'Chicken Burger', 'Crumbed chicken, slaw and aioli with fries', 21.00, 15),
  ('Lunch', 'Steak Sandwich', 'Sirloin, caramelised onion and rocket on ciabatta', 24.00, 16),
  ('Lunch', 'Seafood Chowder', 'Creamy chowder with toasted bread', 19.50, 10),
  ('Cabinet', 'Cinnamon Scroll', 'Baked this morning', 6.00, 2),
  ('Cabinet', 'Blueberry Muffin', 'Served warm with butter', 5.50, 2),
  ('Cabinet', 'Carrot Cake', 'With cream cheese icing', 7.50, 2)
) as v(category, name, description, price, prep)
join public.categories c on c.name = v.category;
