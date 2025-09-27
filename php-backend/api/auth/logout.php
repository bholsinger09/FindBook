<?php
/**
 * Logout endpoint
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

try {
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Optional: If you implement refresh token storage/revocation
    // You would invalidate the refresh token here
    
    // For now, just return success
    // The client will clear tokens on their end
    
    echo json_encode([
        'success' => true,
        'message' => 'Logout successful'
    ]);

} catch (Exception $e) {
    error_log('Logout error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}