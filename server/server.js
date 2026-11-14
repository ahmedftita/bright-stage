const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), quiet: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const { protect } = require('./middleware/authMiddleware');

// Models
const Message = require('./models/Message');

// Config & DB
const connectDB = require('./config/db');

// Root App Setup
const app = express();
const server = http.createServer(app);

// isVercel check
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

// CORS Configuration
const ALLOWED_ORIGINS = [
    "https://bright-stage-pc-app.vercel.app",
    "https://bright-stage-mobile-app.vercel.app",
    "https://bright-stage-2026.vercel.app"
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        // Allow all localhost / 127.0.0.1 origins (any port) for local development
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        // Allow LAN IPs used in the project (192.168.x.x)
        if (/^http:\/\/192\.168\./.test(origin)) {
            return callback(null, true);
        }
        // Allow any Vercel deployment (preview, staging, production)
        if (/\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        // Allow explicitly listed production origins
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
// Ensure CORS preflight OPTIONS requests are handled for all routes (Express 5 compatible)
app.options(/(.*)/, cors(corsOptions));
app.use(express.json());

// Health Checks
app.get('/', (req, res) => {
    res.status(200).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #000; color: #fff; height: 100vh; display: flex; flex-direction: column; justify-content: center;">
            <h1 style="color: #ffa500; font-size: 3rem; margin-bottom: 10px;">BRIGHT STAGE</h1>
            <p style="font-size: 1.2rem;">The Production Backend is <strong>ONLINE</strong>.</p>
            <p style="color: #888;">API Endpoint: <code>/api</code></p>
            <div style="margin: 30px auto; width: 50px; height: 2px; background: #ffa500;"></div>
            <p><small style="color: #555;">v1.1.0 - Professional Clean Version</small></p>
        </div>
    `);
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'production',
        dbConnected: mongoose.connection.readyState === 1
    });
});

// Socket.io (Only for non-Vercel)
if (!isVercel) {
    const io = new Server(server, {
        cors: corsOptions
    });

    io.on('connection', (socket) => {
        socket.on('join_chat', () => {
            socket.join('general');
        });

        socket.on('send_message', async (data) => {
            try {
                const newMessage = new Message(data);
                await newMessage.save();
                io.to(data.room || 'general').emit('receive_message', data);
            } catch (err) {
                console.error("Error saving message:", err);
            }
        });
    });
}

// Database Connection
connectDB().catch(() => {
    console.warn("⚠️ Server running in limited mode (No Database)");
});

// Route Definitions
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const bankRoutes = require('./routes/bankRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const clientRoutes = require('./routes/clientRoutes');
const driverRoutes = require('./routes/driverRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
const hrRoutes = require('./routes/hrRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const subcontractedRoutes = require('./routes/subcontractedRoutes');
const flycaseRoutes = require('./routes/flycaseRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const carrierRoutes = require('./routes/carrierRoutes');
const deliveryNoteRoutes = require('./routes/deliveryNoteRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const auditRoutes = require('./routes/auditRoutes');
const transferRoutes = require('./routes/transferRoutes');
const lossReportRoutes = require('./routes/lossReportRoutes');
const ledProjectRoutes = require('./routes/ledProjectRoutes');
const stageModelRoutes = require('./routes/stageModelRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subcontracted', subcontractedRoutes);
app.use('/api/flycases', flycaseRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/carriers', carrierRoutes);
app.use('/api/delivery-notes', deliveryNoteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/loss-reports', lossReportRoutes);
app.use('/api/led-projects', ledProjectRoutes);
app.use('/api/stage-models', stageModelRoutes);

// Catch-all 404
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Global error handler — always sends CORS headers so browser sees the real error
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    console.error('[GlobalError]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
if (require.main === module) {
    const SERVER_PORT = process.env.PORT || 5000;
    server.listen(SERVER_PORT, () => {
        console.log(`Bright Stage Server running on port ${SERVER_PORT}`);
    });
}

module.exports = app;
