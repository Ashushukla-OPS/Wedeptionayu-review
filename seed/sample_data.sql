-- Sample data for Wedeption
insert into users (id, role, name, email, phone) values ('user_demo_1','customer','Demo User','demo@example.com','+919999999999');
insert into users (id, role, name, email, phone) values ('vendor_demo_1','vendor','Vendor User','vendor@example.com','+918888888888');
insert into vendors (user_id, business_name, category, city, short_desc, verified, subscription_level, priority_rank) values ('vendor_demo_1','Royal Decor','decorator','Bhopal','Beautiful stage decorations', true, 'pro', 50);
insert into vendor_portfolio (vendor_id, media_url, media_type, caption, approved, likes) values ((select id from vendors where business_name='Royal Decor'), 'https://via.placeholder.com/800x600.png?text=Decor+1','image','Mandap design', true, 10);
insert into leads (vendor_id, user_id, contact_phone, name, event_date, budget_range, details) values ((select id from vendors where business_name='Royal Decor'), 'user_demo_1', '+919999999999', 'Demo User','2026-02-14','3,00,000', '{"notes":"Need decor for 300 guests"}');
insert into user_credits (user_id, credits) values ('user_demo_1', 5);
