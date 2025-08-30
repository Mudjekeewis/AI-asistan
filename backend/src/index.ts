import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authenticateUser, generateToken, verifyToken, getUserById } from './auth.js';
import pool from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'AI Asistan Backend API çalışıyor',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email ve şifre gerekli' 
      });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz email veya şifre' 
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        occupation: user.occupation,
        company_name: user.company_name,
        phone: user.phone,
        pic: user.pic,
        language: user.language,
        is_admin: user.is_admin,
        roles: user.roles
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Verify token endpoint
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token gerekli' 
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token' 
      });
    }

    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        occupation: user.occupation,
        company_name: user.company_name,
        phone: user.phone,
        pic: user.pic,
        language: user.language,
        is_admin: user.is_admin,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Profile update endpoint
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { token, ...userData } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token gerekli' 
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token' 
      });
    }

    // Update user profile in database
    const { rows } = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           username = COALESCE($3, username),
           occupation = COALESCE($4, occupation),
           company_name = COALESCE($5, company_name),
           phone = COALESCE($6, phone),
           pic = COALESCE($7, pic),
           language = COALESCE($8, language),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        userData.first_name,
        userData.last_name,
        userData.username,
        userData.occupation,
        userData.company_name,
        userData.phone,
        userData.pic,
        userData.language,
        decoded.id
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    const updatedUser = rows[0];

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        username: updatedUser.username,
        occupation: updatedUser.occupation,
        company_name: updatedUser.company_name,
        phone: updatedUser.phone,
        pic: updatedUser.pic,
        language: updatedUser.language,
        is_admin: updatedUser.is_admin,
        roles: updatedUser.roles
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Profil güncellenirken hata oluştu' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Asistan Backend API http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
