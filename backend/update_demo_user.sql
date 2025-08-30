-- Demo kullanıcının şifre hash'ini güncelle (şifre: demo123)
UPDATE users 
SET password_hash = '$2a$10$x6zVnPN69QUPEnrBnGd13ealR9TyutakspXvcRgL7CO.P9qdTS8f6'
WHERE email = 'demo@kt.com';

-- Kontrol et
SELECT id, email, first_name, last_name, is_admin FROM users WHERE email = 'demo@kt.com';
