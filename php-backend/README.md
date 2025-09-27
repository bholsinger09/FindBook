# FindBook PHP Backend

## Overview
JWT-based authentication API for the FindBook application, providing secure user management and authentication services.

## Features
- 🔐 JWT-based authentication with refresh tokens
- 👤 User registration and login
- 🛡️ Role-based access control
- 🔄 Automatic token refresh
- 🌐 CORS support for Angular frontend
- 📊 User preferences and reading lists
- ⭐ Book reviews and ratings

## Requirements
- PHP 7.4 or higher
- MySQL 5.7 or higher / MariaDB 10.2+
- Composer for dependency management
- PDO MySQL extension

## Quick Start

### 1. Setup
```bash
# Run the setup script
./setup.sh

# Or manual setup:
composer install
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_NAME=findbook_db
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=your-super-secret-key
```

### 3. Create Database
```bash
# Create the database and tables
mysql -u root -p < database/schema.sql
```

### 4. Start Server
```bash
# Using Composer script
composer run start

# Or direct PHP command
php -S localhost:8080 -t api/
```

### 5. Test API
```bash
curl http://localhost:8080/api/auth/test
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/test` - API health check

### User Management (Future)
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/preferences` - Get user preferences
- `PUT /api/user/preferences` - Update preferences

### Books & Reviews (Future)
- `GET /api/books/favorites` - User's favorite books
- `POST /api/books/favorites` - Add book to favorites
- `POST /api/books/review` - Submit book review
- `GET /api/books/reviews` - Get user's reviews

## Request/Response Examples

### Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure123",
    "full_name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'
```

## Database Schema

### Core Tables
- `users` - User accounts and authentication
- `roles` - User roles (admin, user, etc.)
- `user_roles` - User-role assignments
- `user_preferences` - User settings and preferences
- `book_reviews` - User book reviews and ratings

## Security Features
- Password hashing with `password_hash()` (bcrypt)
- JWT tokens with configurable expiration
- Refresh token rotation
- CORS protection
- SQL injection prevention with PDO prepared statements
- Input validation and sanitization

## Error Handling
All API endpoints return standardized JSON responses:

```json
{
  "success": boolean,
  "message": "Human readable message",
  "data": {}, // On success
  "error": "Error details" // On failure
}
```

## Development

### File Structure
```
php-backend/
├── api/
│   └── auth/
│       ├── login.php
│       ├── register.php
│       ├── refresh.php
│       ├── logout.php
│       └── test.php
├── config/
│   ├── database.php
│   └── jwt.php
├── database/
│   └── schema.sql
├── src/
│   └── models/
│       └── User.php
├── composer.json
├── .env.example
└── setup.sh
```

### Adding New Endpoints
1. Create PHP file in appropriate `api/` subdirectory
2. Include necessary configuration files
3. Implement CORS headers
4. Add authentication checks if needed
5. Return standardized JSON responses

## Deployment

### Production Checklist
- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Set `APP_DEBUG=false`
- [ ] Configure proper database credentials
- [ ] Set up SSL/HTTPS
- [ ] Configure web server (Apache/Nginx)
- [ ] Set appropriate file permissions
- [ ] Enable error logging

### Web Server Configuration
For Apache, add to `.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1.php [QSA,L]
```

## Troubleshooting

### Common Issues
1. **CORS errors**: Check `CORS_ORIGIN` in `.env`
2. **Database connection**: Verify credentials in `.env`
3. **JWT errors**: Ensure `JWT_SECRET` is set
4. **Permission errors**: Check file permissions

### Debug Mode
Enable debugging in `.env`:
```env
APP_DEBUG=true
```

## Contributing
1. Fork the repository
2. Create feature branch
3. Follow PSR-4 autoloading standards
4. Add tests for new features
5. Submit pull request

## License
MIT License