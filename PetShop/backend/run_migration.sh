#!/bin/bash

# PetShop Migration Runner
# Simple script to run common migration operations

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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
source venv/bin/activate

# Function to show help
show_help() {
    echo "PetShop Migration Runner"
    echo "======================="
    echo ""
    echo "Usage: ./run_migration.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  init              - Initialize database and run migrations"
    echo "  seed              - Seed database with sample data"
    echo "  reset             - Reset database (WARNING: Deletes all data)"
    echo "  backup            - Create database backup"
    echo "  restore <file>    - Restore from backup file"
    echo "  export            - Export all data to JSON"
    echo "  import <file>     - Import data from JSON file"
    echo "  migrate           - Run schema migrations"
    echo "  status            - Show migration status"
    echo "  help              - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run_migration.sh init"
    echo "  ./run_migration.sh seed"
    echo "  ./run_migration.sh backup"
    echo "  ./run_migration.sh restore backup_20241212_143022.db"
}

# Main script logic
case "${1:-help}" in
    "init")
        print_status "Initializing database..."
        python migrate.py init
        print_success "Database initialized!"
        ;;
    
    "seed")
        print_status "Seeding database..."
        python migrate.py seed
        print_success "Database seeded!"
        ;;
    
    "reset")
        print_warning "This will delete all data!"
        read -p "Are you sure? (yes/no): " -r
        if [[ $REPLY =~ ^[Yy]es$ ]]; then
            print_status "Resetting database..."
            python migrate.py reset
            print_success "Database reset!"
        else
            print_status "Reset cancelled."
        fi
        ;;
    
    "backup")
        print_status "Creating backup..."
        python migrate.py backup
        print_success "Backup created!"
        ;;
    
    "restore")
        if [ -z "$2" ]; then
            print_error "Please specify backup file"
            echo "Usage: ./run_migration.sh restore <backup_file>"
            exit 1
        fi
        print_status "Restoring from $2..."
        python migrate.py restore "$2"
        print_success "Database restored!"
        ;;
    
    "export")
        print_status "Exporting data..."
        python migrate.py export
        print_success "Data exported!"
        ;;
    
    "import")
        if [ -z "$2" ]; then
            print_error "Please specify import file"
            echo "Usage: ./run_migration.sh import <json_file>"
            exit 1
        fi
        print_status "Importing data from $2..."
        python migrate.py import_data "$2"
        print_success "Data imported!"
        ;;
    
    "migrate")
        print_status "Running migrations..."
        python migrations.py migrate
        print_success "Migrations completed!"
        ;;
    
    "status")
        print_status "Migration status:"
        python migrations.py status
        ;;
    
    "help"|*)
        show_help
        ;;
esac
