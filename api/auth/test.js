const { getDbConnection, corsHeaders, handleCors, apiResponse } = require('./utils');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle CORS preflight
    if (handleCors(req, res)) return;

    try {
        // Test database connection
        let dbConnected = false;
        try {
            const connection = await getDbConnection();
            await connection.execute('SELECT 1');
            await connection.end();
            dbConnected = true;
        } catch (dbError) {
            console.error('Database test failed:', dbError);
        }

        const response = apiResponse(
            true,
            'FindBook API is running',
            {
                database: dbConnected ? 'connected' : 'disconnected',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            }
        );

        res.status(200).json(response);
    } catch (error) {
        console.error('API test error:', error);
        const response = apiResponse(
            false,
            'API test failed',
            null,
            error.message
        );

        res.status(500).json(response);
    }
};