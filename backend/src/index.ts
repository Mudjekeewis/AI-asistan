import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { authenticateUser, generateToken, verifyToken, getUserById } from './auth.js';
import pool from './database.js';
import { ProjectsService } from './services/projects.js';
import { LeadsService } from './services/leads.js';
import { CallsService } from './services/calls.js';
import { WebRTCGateway } from './services/webrtc-gateway.js';

const app = express();
const PORT = process.env.PORT || 3001;
const WEBRTC_PORT = process.env.WEBRTC_PORT || 8080;

// Initialize services
const projectsService = new ProjectsService(pool);
const leadsService = new LeadsService(pool);
const callsService = new CallsService(pool);
const webrtcGateway = new WebRTCGateway(callsService, leadsService, projectsService);

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

// ===== CRM API ENDPOINTS =====

// Projects endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const { query, page = 1, size = 10 } = req.query;
    const result = await projectsService.findAll(
      query as string,
      parseInt(page as string),
      parseInt(size as string)
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Projects fetch error:', error);
    res.status(500).json({ success: false, message: 'Projeler yüklenirken hata oluştu' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = await projectsService.create(req.body);
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Project create error:', error);
    res.status(500).json({ success: false, message: 'Proje oluşturulurken hata oluştu' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await projectsService.findById(parseInt(req.params.id));
    if (!project) {
      return res.status(404).json({ success: false, message: 'Proje bulunamadı' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Project fetch error:', error);
    res.status(500).json({ success: false, message: 'Proje yüklenirken hata oluştu' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const project = await projectsService.update(parseInt(req.params.id), req.body);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Proje bulunamadı' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Project update error:', error);
    res.status(500).json({ success: false, message: 'Proje güncellenirken hata oluştu' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const deleted = await projectsService.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Proje bulunamadı' });
    }
    res.json({ success: true, message: 'Proje başarıyla silindi' });
  } catch (error) {
    console.error('Project delete error:', error);
    res.status(500).json({ success: false, message: 'Proje silinirken hata oluştu' });
  }
});

// Leads endpoints
app.get('/api/leads', async (req, res) => {
  try {
    const { query, page = 1, size = 10 } = req.query;
    const result = await leadsService.findAll(
      query as string,
      parseInt(page as string),
      parseInt(size as string)
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Leads fetch error:', error);
    res.status(500).json({ success: false, message: 'Lead\'ler yüklenirken hata oluştu' });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const lead = await leadsService.create(req.body);
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Lead create error:', error);
    res.status(500).json({ success: false, message: 'Lead oluşturulurken hata oluştu' });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    const lead = await leadsService.findById(parseInt(req.params.id));
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead bulunamadı' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Lead fetch error:', error);
    res.status(500).json({ success: false, message: 'Lead yüklenirken hata oluştu' });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  try {
    const lead = await leadsService.update(parseInt(req.params.id), req.body);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead bulunamadı' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Lead update error:', error);
    res.status(500).json({ success: false, message: 'Lead güncellenirken hata oluştu' });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    const deleted = await leadsService.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Lead bulunamadı' });
    }
    res.json({ success: true, message: 'Lead başarıyla silindi' });
  } catch (error) {
    console.error('Lead delete error:', error);
    res.status(500).json({ success: false, message: 'Lead silinirken hata oluştu' });
  }
});

// Calls endpoints
app.get('/api/calls', async (req, res) => {
  try {
    const { lead_id, status, page = 1, size = 10 } = req.query;
    const result = await callsService.findAll(
      { 
        lead_id: lead_id ? parseInt(lead_id as string) : undefined,
        status: status as string
      },
      parseInt(page as string),
      parseInt(size as string)
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Calls fetch error:', error);
    res.status(500).json({ success: false, message: 'Görüşmeler yüklenirken hata oluştu' });
  }
});

app.post('/api/calls/outbound', async (req, res) => {
  try {
    const { lead_id } = req.body;
    
    if (!lead_id) {
      return res.status(400).json({ success: false, message: 'Lead ID gerekli' });
    }

    const session = await callsService.create(lead_id);
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Call create error:', error);
    res.status(500).json({ success: false, message: 'Görüşme oluşturulurken hata oluştu' });
  }
});

app.get('/api/calls/:id', async (req, res) => {
  try {
    const call = await callsService.findById(parseInt(req.params.id));
    if (!call) {
      return res.status(404).json({ success: false, message: 'Görüşme bulunamadı' });
    }
    res.json({ success: true, data: call });
  } catch (error) {
    console.error('Call fetch error:', error);
    res.status(500).json({ success: false, message: 'Görüşme yüklenirken hata oluştu' });
  }
});

// WebRTC token endpoint
app.get('/api/rtc/token', async (req, res) => {
  try {
    const { call_id } = req.query;
    
    if (!call_id) {
      return res.status(400).json({ success: false, message: 'Call ID gerekli' });
    }

    // Verify call exists
    const call = await callsService.findById(parseInt(call_id as string));
    if (!call) {
      return res.status(404).json({ success: false, message: 'Görüşme bulunamadı' });
    }

    // Generate JWT token for WebRTC session
    const token = generateToken({ id: call.id, type: 'webrtc' });
    
    res.json({ 
      success: true, 
      data: { 
        token, 
        expires_in: 300 
      } 
    });
  } catch (error) {
    console.error('WebRTC token error:', error);
    res.status(500).json({ success: false, message: 'Token oluşturulurken hata oluştu' });
  }
});

// ===== AUTH ENDPOINTS =====

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

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 AI Asistan Backend API http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Start WebSocket server for WebRTC
const wss = new WebSocketServer({ 
  server,
  path: '/ws/rtc'
});

wss.on('connection', (ws, req) => {
  try {
    // Extract call_id from query parameters
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const call_id = url.searchParams.get('call_id');
    
    if (!call_id) {
      ws.close(1008, 'Call ID required');
      return;
    }

    // Handle WebRTC connection
    webrtcGateway.handleConnection(ws, call_id);
    
  } catch (error) {
    console.error('WebSocket connection error:', error);
    ws.close(1011, 'Internal server error');
  }
});

console.log(`🔗 WebRTC WebSocket server ready on /ws/rtc`);
console.log(`📈 Active sessions: ${webrtcGateway.getSessionCount()}`);
