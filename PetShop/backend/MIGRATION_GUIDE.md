# PetShop Backend Migration Guide

This guide explains how to use the migration system for the PetShop backend to handle database schema changes and data management.

## 🚀 Quick Start

### 1. Setup Migration System
```bash
# Make the setup script executable
chmod +x setup_migration.sh

# Run the setup script
./setup_migration.sh
```

### 2. Basic Operations
```bash
# Initialize database
python migrate.py init

# Seed with sample data
python migrate.py seed

# Create backup
python migrate.py backup

# Export data
python migrate.py export
```

## 📋 Available Commands

### Database Operations

#### Initialize Database
```bash
python migrate.py init
```
- Creates all database tables
- Runs initial schema migrations
- Sets up the database structure

#### Seed Database
```bash
python migrate.py seed
```
- Adds sample products, ratings, and comments
- Only runs if database is empty
- Includes realistic test data

#### Reset Database
```bash
python migrate.py reset
```
- **WARNING**: Deletes all data
- Prompts for confirmation
- Recreates all tables

#### Backup Database
```bash
python migrate.py backup
```
- Creates timestamped backup file
- Saves current database state
- Useful before major changes

#### Restore Database
```bash
python migrate.py restore backup_20241212_143022.db
```
- Restores from backup file
- Replaces current database
- Use with caution

### Data Operations

#### Export Data
```bash
python migrate.py export
```
- Exports all data to JSON file
- Includes products, orders, ratings, comments
- Useful for data migration

#### Import Data
```bash
python migrate.py import data_export_20241212_143022.json
```
- Imports data from JSON file
- Replaces current data
- Validates data structure

### Schema Migrations

#### Run Migrations
```bash
python migrations.py migrate
```
- Runs all pending migrations
- Updates database schema
- Safe to run multiple times

#### Check Status
```bash
python migrations.py status
```
- Shows current migration version
- Lists applied and pending migrations
- Helps track database state

#### Create New Migration
```bash
python migrations.py create "Add User Table"
```
- Creates new migration file
- Prompts for description
- Template for custom migrations

## 🔧 Advanced Usage

### Flask-Migrate Commands

The system also supports standard Flask-Migrate commands:

```bash
# Create new migration
flask db migrate -m "Add new column to products"

# Apply migrations
flask db upgrade

# Rollback migration
flask db downgrade

# Show current revision
flask db current

# Show migration history
flask db history
```

### Custom Migrations

To create custom migrations:

1. **Create Migration File**:
```bash
python migrations.py create "Add User Authentication"
```

2. **Edit the Generated File**:
```python
def up(db):
    """Apply the migration"""
    # Add your migration code here
    db.session.execute(text("ALTER TABLE product ADD COLUMN user_id INTEGER"))
    db.session.commit()

def down(db):
    """Rollback the migration"""
    # Add your rollback code here
    db.session.execute(text("ALTER TABLE product DROP COLUMN user_id"))
    db.session.commit()
```

3. **Run the Migration**:
```bash
python migrations.py migrate
```

## 📊 Database Schema

### Current Tables

1. **product** - Product information
   - id, name, description, price, image_url, category, stock, owner_uid, created_at

2. **cart_item** - Shopping cart items
   - id, product_id, quantity, session_id, created_at

3. **order** - Customer orders
   - id, session_id, total_amount, status, shipping_address, buyer_name, created_at

4. **order_item** - Order line items
   - id, order_id, product_id, quantity, price

5. **product_rating** - Product star ratings
   - id, product_id, user_name, rating, created_at, updated_at

6. **product_comment** - Product comments with sentiment
   - id, product_id, user_name, comment, sentiment_score, created_at, updated_at

7. **product_comment_vote** - Comment voting system
   - id, comment_id, user_name, value, created_at, updated_at

### Indexes

The system automatically creates indexes for:
- Product category and owner
- Cart session and product
- Order session
- Rating and comment lookups
- Vote tracking

## 🛠️ Troubleshooting

### Common Issues

#### 1. Migration Fails
```bash
# Check migration status
python migrations.py status

# Check database connection
python -c "from app import app, db; print('Database connected')"
```

#### 2. Data Loss Prevention
```bash
# Always backup before major changes
python migrate.py backup

# Export data before reset
python migrate.py export
```

#### 3. Schema Conflicts
```bash
# Check current schema
flask db current

# View migration history
flask db history

# Rollback if needed
flask db downgrade
```

### Recovery Procedures

#### 1. Restore from Backup
```bash
# Stop the application
# Restore from backup
python migrate.py restore backup_20241212_143022.db
# Restart application
```

#### 2. Recreate Database
```bash
# Export current data
python migrate.py export

# Reset database
python migrate.py reset

# Import data back
python migrate.py import data_export_20241212_143022.json
```

## 🔄 Workflow Examples

### Adding a New Feature

1. **Backup Current State**:
```bash
python migrate.py backup
python migrate.py export
```

2. **Create Migration**:
```bash
python migrations.py create "Add User Authentication"
```

3. **Edit Migration File**:
```python
def up(db):
    db.session.execute(text("""
        CREATE TABLE user (
            id INTEGER PRIMARY KEY,
            username VARCHAR(80) UNIQUE NOT NULL,
            email VARCHAR(120) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    db.session.commit()
```

4. **Run Migration**:
```bash
python migrations.py migrate
```

5. **Test and Verify**:
```bash
python -c "from app import app, db; print('Migration successful')"
```

### Updating Existing Data

1. **Create Data Migration**:
```bash
python migrations.py create "Update Product Categories"
```

2. **Add Data Update Logic**:
```python
def up(db):
    # Update existing products
    db.session.execute(text("""
        UPDATE product 
        SET category = 'Premium ' || category 
        WHERE price > 50
    """))
    db.session.commit()
```

3. **Run Migration**:
```bash
python migrations.py migrate
```

## 📝 Best Practices

### 1. Always Backup
- Create backups before major changes
- Export data before schema changes
- Test migrations on copy first

### 2. Version Control
- Commit migration files to git
- Document migration purposes
- Test rollback procedures

### 3. Production Deployment
- Run migrations during maintenance windows
- Monitor migration progress
- Have rollback plan ready

### 4. Data Integrity
- Validate data before migration
- Test with production-like data
- Verify constraints and indexes

## 🆘 Support

If you encounter issues:

1. Check the migration status
2. Review error logs
3. Restore from backup if needed
4. Contact the development team

## 📚 Additional Resources

- [Flask-Migrate Documentation](https://flask-migrate.readthedocs.io/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/what-are-database-migrations)
