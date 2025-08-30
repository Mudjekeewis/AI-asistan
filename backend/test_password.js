import bcrypt from 'bcryptjs';

const storedHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
const password = 'demo123';

console.log('🔐 Testing password hash...');
console.log('📝 Password:', password);
console.log('🔑 Stored hash:', storedHash);

const isValid = bcrypt.compareSync(password, storedHash);
console.log('✅ Password valid:', isValid);

// Yeni hash oluştur
const newHash = bcrypt.hashSync(password, 10);
console.log('🆕 New hash:', newHash);

// Yeni hash'i test et
const isValidNew = bcrypt.compareSync(password, newHash);
console.log('✅ New hash valid:', isValidNew);
