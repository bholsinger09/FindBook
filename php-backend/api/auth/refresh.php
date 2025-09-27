<?php
/**
 * Token refresh endpoint
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
    
    if (!$input || !isset($input['refreshToken'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Refresh token is required'
        ]);
        exit;
    }

    // Validate refresh token
    $tokenData = JWTConfig::validateToken($input['refreshToken']);
    
    if (!$tokenData || !isset($tokenData['type']) || $tokenData['type'] !== 'refresh') {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid refresh token'
        ]);
        exit;
    }

    // Check if token is expired
    if (JWTConfig::isTokenExpired($input['refreshToken'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Refresh token expired'
        ]);
        exit;
    }

    // Get user data
    $database = Database::getInstance();
    $userModel = new User($database);
    $user = $userModel->findById($tokenData['sub']);

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'User not found'
        ]);
        exit;
    }

    // Generate new tokens
    $newAccessToken = JWTConfig::generateToken($user);
    $newRefreshToken = JWTConfig::generateRefreshToken($user['id']);

    echo json_encode([
        'success' => true,
        'data' => [
            'token' => $newAccessToken,
            'refreshToken' => $newRefreshToken,
            'expiresIn' => 3600 // 1 hour
        ]
    ]);

} catch (Exception $e) {
    error_log('Token refresh error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}