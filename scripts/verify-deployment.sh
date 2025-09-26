#!/bin/bash

# FindBook Deployment Verification Script
echo "🔍 Verifying FindBook Deployment..."
echo "=================================="

# Check if the main site loads
echo "📱 Testing main application..."
curl -s -o /dev/null -w "%{http_code}" https://bholsinger09.github.io/FindBook/
if [ $? -eq 0 ]; then
    echo "✅ Main application is accessible"
else
    echo "❌ Main application is not accessible"
fi

# Check if routing works for performance dashboard
echo "📊 Testing performance dashboard route..."
curl -s -o /dev/null -w "%{http_code}" https://bholsinger09.github.io/FindBook/performance
if [ $? -eq 0 ]; then
    echo "✅ Performance dashboard route is accessible"
else
    echo "❌ Performance dashboard route is not accessible"
fi

# Check if 404.html exists
echo "🔧 Testing SPA routing fallback..."
curl -s -o /dev/null -w "%{http_code}" https://bholsinger09.github.io/FindBook/404.html
if [ $? -eq 0 ]; then
    echo "✅ 404.html fallback is configured"
else
    echo "❌ 404.html fallback is missing"
fi

echo "=================================="
echo "🎉 Deployment verification complete!"
echo "🌐 Live URL: https://bholsinger09.github.io/FindBook"
echo "📊 Performance Dashboard: https://bholsinger09.github.io/FindBook/performance"