<?php
/**
 * Login endpoint
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:4200');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../models/User.php';

try {
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Email and password are required'
        ]);
        exit;
    }

    // Validate input
    $email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
    if (!$email) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email format'
        ]);
        exit;
    }

    // Initialize database and user model
    $database = Database::getInstance();
    $userModel = new User($database);

    // Verify user credentials
    $user = $userModel->verifyPassword($email, $input['password']);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid credentials'
        ]);
        exit;
    }

    // Generate tokens
    $accessToken = JWTConfig::generateToken($user);
    $refreshToken = JWTConfig::generateRefreshToken($user['id']);

    // Update last login
    $userModel->updateLastLogin($user['id']);

    // Prepare user data for response
    $userData = [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'username' => $user['username'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'avatar' => $user['avatar'],
        'roles' => $user['roles'],
        'preferences' => [
            'theme' => 'auto',
            'language' => 'en',
            'booksPerPage' => 20,
            'defaultSortBy' => 'relevance',
            'emailNotifications' => true,
            'favoriteGenres' => []
        ],
        'createdAt' => $user['created_at'],
        'lastLoginAt' => $user['last_login_at']
    ];

    // Store refresh token in database (optional - for token revocation)
    // You might want to implement a refresh_tokens table

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'user' => $userData,
            'token' => $accessToken,
            'refreshToken' => $refreshToken,
            'expiresIn' => 3600 // 1 hour
        ]
    ]);

} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}