const { handleCors, apiResponse } = require('./utils');

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
    // For stateless JWT tokens, logout is handled on the client side
    // by removing tokens from storage. In a production environment,
    // you might want to implement a token blacklist in Redis or database.
    
    const response = apiResponse(
      true,
      'Logout successful',
      {
        message: 'Please clear tokens from client storage'
      }
    );

    res.status(200).json(response);

  } catch (error) {
    console.error('Logout error:', error);
    const response = apiResponse(
      false,
      'Logout failed',
      null,
      error.message
    );
    
    res.status(500).json(response);
  }
};