#!/bin/bash

# PetShop Backend Migration Setup Script
# This script sets up the migration system and handles database operations

set -e  # Exit on any error

echo "🚀 PetShop Backend Migration Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_error "Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install migration dependencies
print_status "Installing migration dependencies..."
pip install Flask-Migrate==4.0.5 Flask-Script==2.0.6

# Install other dependencies if not already installed
print_status "Installing other dependencies..."
pip install -r requirements.txt

# Initialize Flask-Migrate
print_status "Initializing Flask-Migrate..."
if [ ! -d "migrations" ]; then
    flask db init
    print_success "Flask-Migrate initialized"
else
    print_warning "Flask-Migrate already initialized"
fi

# Create initial migration
print_status "Creating initial migration..."
flask db migrate -m "Initial migration"

# Apply migrations
print_status "Applying migrations..."
flask db upgrade

print_success "Migration setup completed!"

# Show available commands
echo ""
echo "📋 Available Migration Commands:"
echo "================================"
echo "1. Database Operations:"
echo "   python migrate.py init          - Initialize database"
echo "   python migrate.py seed          - Seed with sample data"
echo "   python migrate.py reset         - Reset database (WARNING: Deletes all data)"
echo "   python migrate.py backup        - Create database backup"
echo "   python migrate.py restore <file> - Restore from backup"
echo ""
echo "2. Data Operations:"
echo "   python migrate.py export        - Export all data to JSON"
echo "   python migrate.py import <file> - Import data from JSON"
echo ""
echo "3. Schema Migrations:"
echo "   python migrations.py migrate    - Run schema migrations"
echo "   python migrations.py status     - Show migration status"
echo "   python migrations.py create <name> - Create new migration"
echo ""
echo "4. Flask-Migrate Commands:"
echo "   flask db migrate -m 'message'   - Create new migration"
echo "   flask db upgrade                - Apply migrations"
echo "   flask db downgrade              - Rollback migration"
echo "   flask db current                - Show current revision"
echo "   flask db history                - Show migration history"
echo ""

# Ask if user wants to seed the database
read -p "Do you want to seed the database with sample data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database with sample data..."
    python migrate.py seed
    print_success "Database seeded successfully!"
fi

print_success "Setup completed! Your migration system is ready to use."



