const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET_KEY = 'brightstage_secret_key_123';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        try {
            // Try to get full user from DB
            const dbUser = await User.findById(decoded.id).select('-password');
            if (dbUser) {
                req.user = dbUser;
                return next();
            }
        } catch (dbErr) {
            // DB is offline — fall back to JWT payload so requests still work
            console.warn('[AuthMiddleware] DB unavailable, using JWT fallback:', dbErr.message);
        }

        // Fallback: use decoded JWT as the user (works when DB is offline)
        req.user = {
            _id: decoded.id,
            id: decoded.id,
            name: decoded.name,
            role: decoded.role,
        };
        return next();

    } catch (error) {
        console.error('[AuthMiddleware] Token verification failed:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
