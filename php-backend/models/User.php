<?php
/**
 * User model for database operations
 */
require_once __DIR__ . '/../config/database.php';

class User {
    private $db;

    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Create a new user
     */
    public function create($userData) {
        $sql = "INSERT INTO users (email, username, password, first_name, last_name, created_at) 
                VALUES (:email, :username, :password, :first_name, :last_name, NOW())";
        
        $hashedPassword = password_hash($userData['password'], PASSWORD_BCRYPT);
        
        $params = [
            ':email' => $userData['email'],
            ':username' => $userData['username'],
            ':password' => $hashedPassword,
            ':first_name' => $userData['firstName'] ?? null,
            ':last_name' => $userData['lastName'] ?? null
        ];

        try {
            $stmt = $this->db->query($sql, $params);
            $userId = $this->db->lastInsertId();
            
            // Add default user role
            $this->addUserRole($userId, 'user');
            
            return $this->findById($userId);
        } catch (Exception $e) {
            throw new Exception('Failed to create user: ' . $e->getMessage());
        }
    }

    /**
     * Find user by ID
     */
    public function findById($id) {
        $sql = "SELECT u.*, GROUP_CONCAT(r.name) as roles
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = :id AND u.deleted_at IS NULL
                GROUP BY u.id";
        
        $stmt = $this->db->query($sql, [':id' => $id]);
        $user = $stmt->fetch();
        
        if ($user) {
            $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : ['user'];
            unset($user['password']); // Don't return password
        }
        
        return $user;
    }

    /**
     * Find user by email
     */
    public function findByEmail($email) {
        $sql = "SELECT u.*, GROUP_CONCAT(r.name) as roles
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.email = :email AND u.deleted_at IS NULL
                GROUP BY u.id";
        
        $stmt = $this->db->query($sql, [':email' => $email]);
        $user = $stmt->fetch();
        
        if ($user) {
            $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : ['user'];
        }
        
        return $user;
    }

    /**
     * Find user by username
     */
    public function findByUsername($username) {
        $sql = "SELECT u.*, GROUP_CONCAT(r.name) as roles
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.username = :username AND u.deleted_at IS NULL
                GROUP BY u.id";
        
        $stmt = $this->db->query($sql, [':username' => $username]);
        $user = $stmt->fetch();
        
        if ($user) {
            $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : ['user'];
        }
        
        return $user;
    }

    /**
     * Verify user password
     */
    public function verifyPassword($email, $password) {
        $sql = "SELECT * FROM users WHERE email = :email AND deleted_at IS NULL";
        $stmt = $this->db->query($sql, [':email' => $email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            return $this->findByEmail($email);
        }
        
        return false;
    }

    /**
     * Update user profile
     */
    public function updateProfile($userId, $userData) {
        $fields = [];
        $params = [':id' => $userId];
        
        if (isset($userData['firstName'])) {
            $fields[] = 'first_name = :first_name';
            $params[':first_name'] = $userData['firstName'];
        }
        
        if (isset($userData['lastName'])) {
            $fields[] = 'last_name = :last_name';
            $params[':last_name'] = $userData['lastName'];
        }
        
        if (isset($userData['avatar'])) {
            $fields[] = 'avatar = :avatar';
            $params[':avatar'] = $userData['avatar'];
        }
        
        if (empty($fields)) {
            return $this->findById($userId);
        }
        
        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($userId);
    }

    /**
     * Update last login time
     */
    public function updateLastLogin($userId) {
        $sql = "UPDATE users SET last_login_at = NOW() WHERE id = :id";
        $this->db->query($sql, [':id' => $userId]);
    }

    /**
     * Add role to user
     */
    private function addUserRole($userId, $roleName) {
        // Get role ID
        $roleStmt = $this->db->query("SELECT id FROM roles WHERE name = :name", [':name' => $roleName]);
        $role = $roleStmt->fetch();
        
        if ($role) {
            $sql = "INSERT INTO user_roles (user_id, role_id, created_at) VALUES (:user_id, :role_id, NOW())";
            $this->db->query($sql, [':user_id' => $userId, ':role_id' => $role['id']]);
        }
    }

    /**
     * Check if email exists
     */
    public function emailExists($email) {
        $sql = "SELECT COUNT(*) as count FROM users WHERE email = :email AND deleted_at IS NULL";
        $stmt = $this->db->query($sql, [':email' => $email]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }

    /**
     * Check if username exists
     */
    public function usernameExists($username) {
        $sql = "SELECT COUNT(*) as count FROM users WHERE username = :username AND deleted_at IS NULL";
        $stmt = $this->db->query($sql, [':username' => $username]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
}