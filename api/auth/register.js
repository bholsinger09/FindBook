const { getDbConnection, generateToken, hashPassword, handleCors, apiResponse, JWT_REFRESH_EXPIRE_TIME } = require('./utils');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json(apiResponse(false, 'Method not allowed'));
    }

    try {
        const { username, email, password, confirmPassword, firstName, lastName, acceptTerms } = req.body;

        // Log registration attempt (without sensitive data)
        console.log('Registration attempt for user:', { username, email, acceptTerms });

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

        // Try database connection
        let connection;
        try {
            connection = await getDbConnection();
            console.log('Database connection established');
        } catch (dbError) {
            console.error('Database connection failed:', dbError);
            // Return demo success for now
            return res.status(200).json(apiResponse(
                true,
                'Account created successfully (demo mode - database not configured)',
                {
                    user: {
                        id: Math.floor(Math.random() * 1000),
                        email: email,
                        username: username,
                        firstName: firstName,
                        lastName: lastName,
                        fullName: (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || lastName || username),
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
                    },
                    token: 'demo_token_' + Math.random().toString(36).substr(2, 9),
                    refreshToken: 'demo_refresh_' + Math.random().toString(36).substr(2, 9),
                    expiresIn: 3600
                }
            ));
        }

        // Create full name from first and last names
        const fullName = (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || lastName || username);

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            await connection.end();
            return res.status(409).json(apiResponse(false, 'User with this email or username already exists'));
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Insert new user
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password, full_name, first_name, last_name, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [username, email, hashedPassword, fullName, firstName, lastName]
        );

        const userId = result.insertId;

        // Get the created user
        const [newUser] = await connection.execute(
            'SELECT id, username, email, full_name, first_name, last_name, avatar, created_at FROM users WHERE id = ?',
            [userId]
        );

        await connection.end();

        if (newUser.length === 0) {
            return res.status(500).json(apiResponse(false, 'Failed to create user'));
        }

        const user = newUser[0];

        // Generate tokens
        const token = generateToken({ userId: user.id, email: user.email });
        const refreshToken = generateToken(
            { userId: user.id, email: user.email, type: 'refresh' },
            JWT_REFRESH_EXPIRE_TIME
        );

        res.status(201).json(apiResponse(
            true,
            'Account created successfully',
            {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    fullName: user.full_name,
                    avatar: user.avatar,
                    roles: ['user'],
                    preferences: {
                        theme: 'auto',
                        language: 'en',
                        booksPerPage: 20,
                        defaultSortBy: 'relevance',
                        emailNotifications: true,
                        favoriteGenres: []
                    },
                    createdAt: user.created_at,
                    lastLoginAt: null
                },
                token: token,
                refreshToken: refreshToken,
                expiresIn: 3600
            }
        ));

    } catch (error) {
        console.error('Registration error:', error);

        if (connection) {
            try {
                await connection.end();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }

        res.status(500).json(apiResponse(
            false,
            'Internal server error during registration',
            null,
            error.message
        ));
    }
};