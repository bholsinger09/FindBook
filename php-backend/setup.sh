#!/bin/bash

echo "🚀 Setting up FindBook PHP Backend..."

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed. Please install PHP 7.4 or higher."
    exit 1
fi

echo "✅ PHP found: $(php --version | head -n1)"

# Check if Composer is installed
if ! command -v composer &> /dev/null; then
    echo "❌ Composer is not installed. Please install Composer first."
    echo "Visit: https://getcomposer.org/download/"
    exit 1
fi

echo "✅ Composer found: $(composer --version)"

# Install PHP dependencies
echo "📦 Installing PHP dependencies..."
composer install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating environment configuration..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database credentials"
fi

# Check if MySQL is running (optional)
if command -v mysql &> /dev/null; then
    echo "✅ MySQL client found"
    echo "📝 To create the database, run:"
    echo "   mysql -u root -p < database/schema.sql"
else
    echo "⚠️  MySQL client not found. Make sure you have MySQL/MariaDB installed."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Create the database: mysql -u root -p < database/schema.sql"
echo "3. Start the server: composer run start"
echo "4. Test the API: curl http://localhost:8080/api/auth/test"
echo ""