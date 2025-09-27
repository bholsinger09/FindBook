<?php
/**
 * Register endpoint
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
    
    // Validate required fields
    $required_fields = ['email', 'username', 'password', 'confirmPassword', 'acceptTerms'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => ucfirst($field) . ' is required'
            ]);
            exit;
        }
    }

    // Validate email
    $email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
    if (!$email) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email format'
        ]);
        exit;
    }

    // Validate password
    if (strlen($input['password']) < 8) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Password must be at least 8 characters long'
        ]);
        exit;
    }

    // Check password match
    if ($input['password'] !== $input['confirmPassword']) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Passwords do not match'
        ]);
        exit;
    }

    // Validate username
    if (strlen($input['username']) < 3 || strlen($input['username']) > 20) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Username must be between 3 and 20 characters'
        ]);
        exit;
    }

    if (!preg_match('/^[a-zA-Z0-9_]+$/', $input['username'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Username can only contain letters, numbers, and underscores'
        ]);
        exit;
    }

    // Check terms acceptance
    if (!$input['acceptTerms']) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'You must accept the terms and conditions'
        ]);
        exit;
    }

    // Initialize database and user model
    $database = Database::getInstance();
    $userModel = new User($database);

    // Check if email already exists
    if ($userModel->emailExists($email)) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'error' => 'Email already exists'
        ]);
        exit;
    }

    // Check if username already exists
    if ($userModel->usernameExists($input['username'])) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'error' => 'Username already exists'
        ]);
        exit;
    }

    // Create new user
    $userData = [
        'email' => $email,
        'username' => $input['username'],
        'password' => $input['password'],
        'firstName' => $input['firstName'] ?? null,
        'lastName' => $input['lastName'] ?? null
    ];

    $user = $userModel->create($userData);

    if (!$user) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to create user account'
        ]);
        exit;
    }

    // Generate tokens
    $accessToken = JWTConfig::generateToken($user);
    $refreshToken = JWTConfig::generateRefreshToken($user['id']);

    // Update last login
    $userModel->updateLastLogin($user['id']);

    // Prepare user data for response
    $responseUserData = [
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

    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully',
        'data' => [
            'user' => $responseUserData,
            'token' => $accessToken,
            'refreshToken' => $refreshToken,
            'expiresIn' => 3600 // 1 hour
        ]
    ]);

} catch (Exception $e) {
    error_log('Registration error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}