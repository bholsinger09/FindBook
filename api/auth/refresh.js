const { getDbConnection, generateToken, verifyToken, handleCors, apiResponse, JWT_REFRESH_EXPIRE_TIME } = require('./utils');

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
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json(apiResponse(false, 'Refresh token is required'));
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = verifyToken(refreshToken);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
        } catch (error) {
            return res.status(401).json(apiResponse(false, 'Invalid refresh token'));
        }

        // Database connection
        const connection = await getDbConnection();

        // Get user data
        const [users] = await connection.execute(
            `SELECT u.id, u.username, u.email, u.full_name, u.avatar,
              GROUP_CONCAT(r.name) as roles
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.id = ? AND u.is_active = 1
       GROUP BY u.id`,
            [decoded.sub]
        );

        if (users.length === 0) {
            await connection.end();
            return res.status(401).json(apiResponse(false, 'User not found'));
        }

        const user = users[0];
        await connection.end();

        // Generate new tokens
        const tokenPayload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            roles: user.roles ? user.roles.split(',') : ['user']
        };

        const newToken = generateToken(tokenPayload);
        const newRefreshToken = generateToken({ sub: user.id, type: 'refresh' }, JWT_REFRESH_EXPIRE_TIME);

        const response = apiResponse(
            true,
            'Token refreshed successfully',
            {
                token: newToken,
                refreshToken: newRefreshToken,
                expiresIn: 3600 // 1 hour
            }
        );

        res.status(200).json(response);

    } catch (error) {
        console.error('Token refresh error:', error);
        const response = apiResponse(
            false,
            'Token refresh failed',
            null,
            error.message
        );

        res.status(401).json(response);
    }
};