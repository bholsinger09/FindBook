const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRE_TIME = process.env.JWT_EXPIRE_TIME || '1h';
const JWT_REFRESH_EXPIRE_TIME = process.env.JWT_REFRESH_EXPIRE_TIME || '7d';

// Database Configuration
const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'findbook',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create database connection
async function getDbConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Database connection error:', error);
        throw new Error('Database connection failed');
    }
}

// CORS headers for all responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Content-Type': 'application/json'
};

// Generate JWT token
function generateToken(payload, expiresIn = JWT_EXPIRE_TIME) {
    return jwt.sign({
        iss: 'findbook-app',
        aud: 'findbook-users',
        iat: Math.floor(Date.now() / 1000),
        ...payload
    }, JWT_SECRET, { expiresIn });
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
}

// Hash password
async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

// Verify password
async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

// Handle CORS preflight requests
function handleCors(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({});
        return true;
    }
    return false;
}

// Standard API response
function apiResponse(success, message, data = null, error = null) {
    const response = {
        success,
        message,
        timestamp: new Date().toISOString()
    };

    if (data) response.data = data;
    if (error) response.error = error;

    return response;
}

module.exports = {
    getDbConnection,
    corsHeaders,
    generateToken,
    verifyToken,
    hashPassword,
    verifyPassword,
    handleCors,
    apiResponse,
    JWT_REFRESH_EXPIRE_TIME
};