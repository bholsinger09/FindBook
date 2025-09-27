<?php
/**
 * JWT Configuration and utilities
 */
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTConfig {
    private static $secret_key = 'your-super-secret-jwt-key-change-this-in-production';
    private static $issuer = 'findbook-app';
    private static $audience = 'findbook-users';
    private static $expiry_time = 3600; // 1 hour
    private static $refresh_expiry_time = 604800; // 1 week

    /**
     * Generate JWT token
     */
    public static function generateToken($user_data) {
        $issued_at = time();
        $expiry = $issued_at + self::$expiry_time;
        
        $token_data = [
            'iss' => self::$issuer,
            'aud' => self::$audience,
            'iat' => $issued_at,
            'exp' => $expiry,
            'sub' => $user_data['id'],
            'email' => $user_data['email'],
            'username' => $user_data['username'],
            'roles' => $user_data['roles'] ?? ['user']
        ];

        return JWT::encode($token_data, self::$secret_key, 'HS256');
    }

    /**
     * Generate refresh token
     */
    public static function generateRefreshToken($user_id) {
        $issued_at = time();
        $expiry = $issued_at + self::$refresh_expiry_time;
        
        $token_data = [
            'iss' => self::$issuer,
            'aud' => self::$audience,
            'iat' => $issued_at,
            'exp' => $expiry,
            'sub' => $user_id,
            'type' => 'refresh'
        ];

        return JWT::encode($token_data, self::$secret_key, 'HS256');
    }

    /**
     * Validate and decode JWT token
     */
    public static function validateToken($token) {
        try {
            $decoded = JWT::decode($token, new Key(self::$secret_key, 'HS256'));
            return (array) $decoded;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Check if token is expired
     */
    public static function isTokenExpired($token) {
        try {
            $decoded = JWT::decode($token, new Key(self::$secret_key, 'HS256'));
            return $decoded->exp < time();
        } catch (Exception $e) {
            return true;
        }
    }

    /**
     * Get user ID from token
     */
    public static function getUserIdFromToken($token) {
        $decoded = self::validateToken($token);
        return $decoded ? $decoded['sub'] : null;
    }

    /**
     * Extract token from Authorization header
     */
    public static function extractTokenFromHeader() {
        $headers = getallheaders();
        $auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            return null;
        }
        
        return $matches[1];
    }
}