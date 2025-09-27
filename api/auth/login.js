const { getDbConnection, corsHeaders, generateToken, verifyPassword, handleCors, apiResponse, JWT_REFRESH_EXPIRE_TIME } = require('./utils');

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
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json(apiResponse(false, 'Email and password are required'));
        }

        // Database connection
        const connection = await getDbConnection();

        // Find user by email
        const [users] = await connection.execute(
            `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.avatar, 
              u.created_at, u.last_login_at, u.first_name, u.last_name,
              GROUP_CONCAT(r.name) as roles
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.email = ? AND u.is_active = 1
       GROUP BY u.id`,
            [email]
        );

        if (users.length === 0) {
            await connection.end();
            return res.status(401).json(apiResponse(false, 'Invalid credentials'));
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            await connection.end();
            return res.status(401).json(apiResponse(false, 'Invalid credentials'));
        }

        // Update last login
        await connection.execute(
            'UPDATE users SET last_login_at = NOW() WHERE id = ?',
            [user.id]
        );

        // Get user preferences
        const [preferences] = await connection.execute(
            'SELECT * FROM user_preferences WHERE user_id = ?',
            [user.id]
        );

        await connection.end();

        // Generate tokens
        const tokenPayload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            roles: user.roles ? user.roles.split(',') : ['user']
        };

        const token = generateToken(tokenPayload);
        const refreshToken = generateToken({ sub: user.id, type: 'refresh' }, JWT_REFRESH_EXPIRE_TIME);

        // Prepare user data
        const userData = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: user.full_name,
            avatar: user.avatar,
            roles: user.roles ? user.roles.split(',') : ['user'],
            preferences: preferences.length > 0 ? {
                theme: preferences[0].theme,
                language: preferences[0].language,
                booksPerPage: preferences[0].books_per_page,
                defaultSortBy: preferences[0].default_sort_by,
                emailNotifications: Boolean(preferences[0].email_notifications),
                favoriteGenres: preferences[0].favorite_genres ? JSON.parse(preferences[0].favorite_genres) : []
            } : {
                theme: 'auto',
                language: 'en',
                booksPerPage: 20,
                defaultSortBy: 'relevance',
                emailNotifications: true,
                favoriteGenres: []
            },
            createdAt: user.created_at,
            lastLoginAt: user.last_login_at
        };

        const response = apiResponse(
            true,
            'Login successful',
            {
                user: userData,
                token,
                refreshToken,
                expiresIn: 3600 // 1 hour
            }
        );

        res.status(200).json(response);

    } catch (error) {
        console.error('Login error:', error);
        const response = apiResponse(
            false,
            'Login failed',
            null,
            error.message
        );

        res.status(500).json(response);
    }
};