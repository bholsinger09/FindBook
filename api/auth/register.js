const { getDbConnection, generateToken, hashPassword, handleCors, apiResponse, JWT_REFRESH_EXPIRE_TIME } = require('./utils');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle CORS preflight
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json(apiResponse(false, 'Method not allowed'));
    }

    try {
        const { username, email, password, confirmPassword, full_name, acceptTerms } = req.body;

        // Validation
        if (!username || !email || !password || !confirmPassword || !acceptTerms) {
            return res.status(400).json(apiResponse(false, 'All fields are required'));
        }

        if (password !== confirmPassword) {
            return res.status(400).json(apiResponse(false, 'Passwords do not match'));
        }

        if (password.length < 8) {
            return res.status(400).json(apiResponse(false, 'Password must be at least 8 characters long'));
        }

        if (!acceptTerms) {
            return res.status(400).json(apiResponse(false, 'You must accept the terms and conditions'));
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json(apiResponse(false, 'Please enter a valid email address'));
        }

        // Database connection
        const connection = await getDbConnection();

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            await connection.end();
            return res.status(400).json(apiResponse(false, 'User with this email or username already exists'));
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const [result] = await connection.execute(
            `INSERT INTO users (username, email, password_hash, full_name, created_at, updated_at, is_active) 
       VALUES (?, ?, ?, ?, NOW(), NOW(), 1)`,
            [username, email, hashedPassword, full_name || username]
        );

        const userId = result.insertId;

        // Assign default user role
        const [roleResult] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['user']);
        if (roleResult.length > 0) {
            await connection.execute(
                'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
                [userId, roleResult[0].id]
            );
        }

        // Create default user preferences
        await connection.execute(
            `INSERT INTO user_preferences (user_id, theme, language, books_per_page, default_sort_by, 
                                    email_notifications, favorite_genres, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [userId, 'auto', 'en', 20, 'relevance', 1, JSON.stringify([])]
        );

        await connection.end();

        // Generate tokens
        const tokenPayload = {
            sub: userId,
            email: email,
            username: username,
            roles: ['user']
        };

        const token = generateToken(tokenPayload);
        const refreshToken = generateToken({ sub: userId, type: 'refresh' }, JWT_REFRESH_EXPIRE_TIME);

        // Prepare user data
        const userData = {
            id: userId,
            email: email,
            username: username,
            firstName: null,
            lastName: null,
            fullName: full_name || username,
            avatar: null,
            roles: ['user'],
            preferences: {
                theme: 'auto',
                language: 'en',
                booksPerPage: 20,
                defaultSortBy: 'relevance',
                emailNotifications: true,
                favoriteGenres: []
            },
            createdAt: new Date().toISOString(),
            lastLoginAt: null
        };

        const response = apiResponse(
            true,
            'Account created successfully',
            {
                user: userData,
                token,
                refreshToken,
                expiresIn: 3600 // 1 hour
            }
        );

        res.status(200).json(response);

    } catch (error) {
        console.error('Registration error:', error);
        const response = apiResponse(
            false,
            'Registration failed',
            null,
            error.message
        );

        res.status(500).json(response);
    }
};