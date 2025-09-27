<?php
// api/auth/test.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:4200');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

try {
    $database = Database::getInstance();
    $dbConnection = $database->testConnection();
    
    $response = [
        'success' => true,
        'message' => 'FindBook API is running',
        'timestamp' => date('Y-m-d H:i:s'),
        'database' => $dbConnection ? 'connected' : 'disconnected',
        'version' => '1.0.0'
    ];
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'API test failed',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    http_response_code(500);
    echo json_encode($response);
}