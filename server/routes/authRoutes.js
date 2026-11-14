const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET_KEY = 'brightstage_secret_key_123';

// Date utility for Points History
const addPoints = async (userId, amount, reason) => {
    try {
        await User.findByIdAndUpdate(userId, {
            $inc: { points: amount },
            $push: { pointsHistory: { reason, points: amount } }
        });
    } catch (err) { console.error("Error adding points:", err); }
};

// REGISTER (Admin or Setup)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'Worker'
        });

        const savedUser = await newUser.save();
        res.status(201).json({ message: "User created", userId: savedUser._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DEV FALLBACK: Mock users for offline development (when Atlas DB is unreachable)
const DEV_USERS = [
    {
        _id: '000000000000000000000001',
        name: 'Jilani Wahi',
        email: 'jilani.wahi@gmail.com',
        password: 'brightstage123', // plain text for dev fallback comparison
        role: 'Founder',
        isActive: true,
        points: 0,
        pointsHistory: [],
        phone: '',
        address: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

// LOGIN
router.post('/login', async (req, res) => {
    const connectDB = require('../config/db');
    const { email, password } = req.body;

    // Helper: sign token and send response
    const respondWithUser = (user) => {
        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            SECRET_KEY,
            { expiresIn: '365d' }
        );
        const { password: _, ...userInfo } = user;
        return res.json({ token, user: userInfo });
    };

    try {
        // Attempt DB connection with timeout
        const connectPromise = connectDB();
        const connectTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('DB_CONNECT_TIMEOUT')), 6000)
        );
        await Promise.race([connectPromise, connectTimeout]);

        // Timeout protection for user query
        const userPromise = User.findOne({ email });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 6000));

        const user = await Promise.race([userPromise, timeoutPromise]);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(400).json({ error: "Invalid password" });
        }

        if (!user.isActive) return res.status(403).json({ error: "Account disabled" });

        return respondWithUser(user._doc, 'DB');

    } catch (err) {
        const isDbError = err.message.includes('DB_TIMEOUT') ||
            err.message.includes('DB_CONNECT_TIMEOUT') ||
            err.name === 'MongooseServerSelectionError' ||
            err.name === 'MongooseError';

        if (isDbError) {
            // --- DEV FALLBACK: Try local mock users when DB is unreachable ---
            console.warn(`[AUTH] DB unreachable, trying dev fallback for: ${email}`);
            const devUser = DEV_USERS.find(u => u.email === email);

            if (!devUser) {
                return res.status(404).json({
                    error: "User not found",
                    details: "[DEV] DB is offline and no fallback user matches this email."
                });
            }

            if (devUser.password !== password) {
                return res.status(400).json({ error: "Invalid password" });
            }

            return respondWithUser(devUser, 'DEV-FALLBACK');
        }

        console.error(`[AUTH] Login error for ${email}:`, err);
        res.status(500).json({
            error: "Internal Server Error during login",
            details: err.message
        });
    }
});

const { protect } = require('../middleware/authMiddleware');

/**
 * @typedef {import('express').Request & { user: { _id: any, role: string, [key: string]: any } }} AuthRequest
 */

// Helper to get user from token without DB (dev fallback)
const getUserFromToken = (token) => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        // Try to find in dev users first
        const devUser = DEV_USERS.find(u => u._id === decoded.id || u.email === decoded.email);
        if (devUser) {
            const { password: _, ...userInfo } = devUser;
            return userInfo;
        }
        // Return decoded JWT payload as user info
        return { _id: decoded.id, name: decoded.name, role: decoded.role };
    } catch { return null; }
};

// GET ME (Validate Token)
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        // Try DB first
        try {
            const user = await User.findById(decoded.id).select('-password');
            if (user) return res.json(user);
        } catch (_dbErr) { /* DB offline, fall through */ }

        // DB offline fallback
        const fallback = getUserFromToken(token);
        if (fallback) return res.json(fallback);
        return res.status(401).json({ message: 'Not authorized' });
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
});

// Profile alias for mobile app
router.get('/profile', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        try {
            const user = await User.findById(decoded.id).select('-password');
            if (user) return res.json(user);
        } catch (_dbErr) { /* DB offline */ }
        const fallback = getUserFromToken(token);
        if (fallback) return res.json(fallback);
        return res.status(401).json({ message: 'Not authorized' });
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
});

module.exports = router;
