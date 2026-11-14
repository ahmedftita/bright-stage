const mongoose = require('mongoose');

// Vercel Serverless Caching Pattern
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    // Return existing live connection
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    // Reset cache if connection dropped
    if (mongoose.connection.readyState === 0) {
        cached.conn = null;
        cached.promise = null;
    }

    if (!cached.promise) {
        const opts = {
            // bufferCommands=true (default) so queries queue during brief reconnection
            // instead of immediately throwing 500 errors
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((m) => m);
    }

    try {
        cached.conn = await cached.promise;
        console.log('✅ MongoDB Connected');

        // Reset cache if connection closes so next request reconnects cleanly
        mongoose.connection.once('close', () => {
            cached.conn = null;
            cached.promise = null;
        });

    } catch (e) {
        cached.promise = null;
        const shortError = e.message.includes('whitelist')
            ? 'IP not whitelisted or Atlas unreachable'
            : (e.message.split('.')[0] || e.message);
        console.error(`❌ MongoDB Failed: ${shortError}`);
        throw e;
    }

    return cached.conn;
}

module.exports = connectDB;

