#!/bin/bash

echo "🚀 Setting up Advanced Pet Shop with all PetProto features..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd /Users/santosharawn7/InventoryForPetApp/PetShop
npm install react-icons

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install nltk textblob requests

# Download NLTK data
echo "📚 Downloading NLTK data..."
python -c "import nltk; nltk.download('vader_lexicon')"

echo "✅ Setup complete! All advanced features are now available:"
echo ""
echo "🎯 New Features Added:"
echo "  • ⭐ Advanced Rating System (1-5 stars)"
echo "  • 💬 Comment System with Sentiment Analysis"
echo "  • 👍 Reddit-style Comment Voting"
echo "  • 🏷️ Dynamic Product Badges"
echo "  • 📊 Advanced Analytics Dashboard"
echo "  • 🔍 Advanced Filtering (Category, Owner, Badge, Rating)"
echo "  • 📱 Beautiful Modern UI with Animations"
echo "  • 🛒 Enhanced Cart & Checkout"
echo "  • 📍 Address Validation"
echo "  • 🎨 Gradient Backgrounds & Glassmorphism"
echo ""
echo "🚀 To start the application:"
echo "  Backend: cd backend && python app.py"
echo "  Frontend: npm run dev"
echo ""
echo "🌐 Access the app at: http://localhost:5173"
