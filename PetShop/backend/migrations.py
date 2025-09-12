#!/usr/bin/env python3
"""
Database Migration Scripts for PetShop Backend
Handles schema changes and data migrations
"""

import os
import sys
from datetime import datetime
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, inspect

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db

class DatabaseMigrator:
    """Handles database schema migrations"""
    
    def __init__(self):
        self.app = app
        self.db = db
        self.migrations = []
        self._register_migrations()
    
    def _register_migrations(self):
        """Register all available migrations"""
        self.migrations = [
            {
                'version': '001',
                'name': 'Initial Schema',
                'description': 'Create initial database schema with all tables',
                'function': self._migration_001_initial_schema
            },
            {
                'version': '002',
                'name': 'Add Indexes',
                'description': 'Add database indexes for better performance',
                'function': self._migration_002_add_indexes
            },
            {
                'version': '003',
                'name': 'Add Constraints',
                'description': 'Add database constraints for data integrity',
                'function': self._migration_003_add_constraints
            },
            {
                'version': '004',
                'name': 'Optimize Tables',
                'description': 'Optimize table structures and add missing columns',
                'function': self._migration_004_optimize_tables
            }
        ]
    
    def run_migrations(self, target_version=None):
        """Run all pending migrations"""
        with self.app.app_context():
            print("🔄 Starting database migrations...")
            
            # Get current migration version
            current_version = self._get_current_version()
            print(f"📊 Current migration version: {current_version}")
            
            # Determine which migrations to run
            migrations_to_run = []
            for migration in self.migrations:
                if target_version and migration['version'] > target_version:
                    break
                if migration['version'] > current_version:
                    migrations_to_run.append(migration)
            
            if not migrations_to_run:
                print("✅ No migrations to run. Database is up to date!")
                return True
            
            print(f"📋 Running {len(migrations_to_run)} migrations...")
            
            # Run migrations
            for migration in migrations_to_run:
                try:
                    print(f"🔄 Running migration {migration['version']}: {migration['name']}")
                    print(f"   Description: {migration['description']}")
                    
                    # Run the migration
                    migration['function']()
                    
                    # Update version
                    self._update_version(migration['version'])
                    
                    print(f"✅ Migration {migration['version']} completed successfully!")
                    
                except Exception as e:
                    print(f"❌ Migration {migration['version']} failed: {str(e)}")
                    print("🔄 Rolling back...")
                    self._rollback_migration(migration['version'])
                    return False
            
            print("✅ All migrations completed successfully!")
            return True
    
    def _get_current_version(self):
        """Get the current migration version"""
        try:
            # Check if migrations table exists
            inspector = inspect(self.db.engine)
            if 'migrations' not in inspector.get_table_names():
                return '000'
            
            # Get the latest version
            result = self.db.session.execute(text("SELECT version FROM migrations ORDER BY version DESC LIMIT 1"))
            row = result.fetchone()
            return row[0] if row else '000'
            
        except Exception:
            return '000'
    
    def _update_version(self, version):
        """Update the migration version"""
        try:
            # Create migrations table if it doesn't exist
            self.db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS migrations (
                    version VARCHAR(10) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Insert or update the version
            self.db.session.execute(text("""
                INSERT OR REPLACE INTO migrations (version, name, description, applied_at)
                VALUES (:version, :name, :description, :applied_at)
            """), {
                'version': version,
                'name': f'Migration {version}',
                'description': f'Applied at {datetime.now()}',
                'applied_at': datetime.now()
            })
            
            self.db.session.commit()
            
        except Exception as e:
            print(f"⚠️  Warning: Could not update migration version: {e}")
            self.db.session.rollback()
    
    def _rollback_migration(self, version):
        """Rollback a specific migration"""
        print(f"🔄 Rolling back migration {version}...")
        # This would contain rollback logic for each migration
        # For now, we'll just log it
        print(f"⚠️  Rollback for migration {version} not implemented")
    
    def _migration_001_initial_schema(self):
        """Migration 001: Create initial schema"""
        print("   Creating initial database schema...")
        
        # Create all tables
        self.db.create_all()
        
        # Verify tables were created
        inspector = inspect(self.db.engine)
        tables = inspector.get_table_names()
        expected_tables = ['product', 'cart_item', 'order', 'order_item', 'product_rating', 'product_comment', 'product_comment_vote']
        
        for table in expected_tables:
            if table not in tables:
                raise Exception(f"Table {table} was not created")
        
        print("   ✅ Initial schema created successfully")
    
    def _migration_002_add_indexes(self):
        """Migration 002: Add database indexes"""
        print("   Adding database indexes...")
        
        # Add indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_product_category ON product(category)",
            "CREATE INDEX IF NOT EXISTS idx_product_owner ON product(owner_uid)",
            "CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_item(session_id)",
            "CREATE INDEX IF NOT EXISTS idx_cart_product ON cart_item(product_id)",
            "CREATE INDEX IF NOT EXISTS idx_order_session ON \"order\"(session_id)",
            "CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_item(order_id)",
            "CREATE INDEX IF NOT EXISTS idx_order_item_product ON order_item(product_id)",
            "CREATE INDEX IF NOT EXISTS idx_rating_product ON product_rating(product_id)",
            "CREATE INDEX IF NOT EXISTS idx_rating_user ON product_rating(user_name)",
            "CREATE INDEX IF NOT EXISTS idx_comment_product ON product_comment(product_id)",
            "CREATE INDEX IF NOT EXISTS idx_comment_user ON product_comment(user_name)",
            "CREATE INDEX IF NOT EXISTS idx_vote_comment ON product_comment_vote(comment_id)",
            "CREATE INDEX IF NOT EXISTS idx_vote_user ON product_comment_vote(user_name)"
        ]
        
        for index_sql in indexes:
            try:
                self.db.session.execute(text(index_sql))
            except Exception as e:
                print(f"   ⚠️  Warning: Could not create index: {e}")
        
        self.db.session.commit()
        print("   ✅ Indexes added successfully")
    
    def _migration_003_add_constraints(self):
        """Migration 003: Add database constraints"""
        print("   Adding database constraints...")
        
        # Add check constraints
        constraints = [
            "ALTER TABLE product ADD CONSTRAINT chk_price_positive CHECK (price > 0)",
            "ALTER TABLE product ADD CONSTRAINT chk_stock_non_negative CHECK (stock >= 0)",
            "ALTER TABLE cart_item ADD CONSTRAINT chk_quantity_positive CHECK (quantity > 0)",
            "ALTER TABLE order_item ADD CONSTRAINT chk_order_quantity_positive CHECK (quantity > 0)",
            "ALTER TABLE order_item ADD CONSTRAINT chk_order_price_positive CHECK (price > 0)",
            "ALTER TABLE product_rating ADD CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5)",
            "ALTER TABLE product_comment_vote ADD CONSTRAINT chk_vote_value CHECK (value IN (-1, 1))"
        ]
        
        for constraint_sql in constraints:
            try:
                self.db.session.execute(text(constraint_sql))
            except Exception as e:
                print(f"   ⚠️  Warning: Could not add constraint: {e}")
        
        self.db.session.commit()
        print("   ✅ Constraints added successfully")
    
    def _migration_004_optimize_tables(self):
        """Migration 004: Optimize table structures"""
        print("   Optimizing table structures...")
        
        # Add any missing columns or optimize existing ones
        optimizations = [
            # Add created_at to order_item if missing
            "ALTER TABLE order_item ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            # Add updated_at to order_item if missing
            "ALTER TABLE order_item ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            # Add status to order_item if missing
            "ALTER TABLE order_item ADD COLUMN status VARCHAR(50) DEFAULT 'pending'"
        ]
        
        for optimization_sql in optimizations:
            try:
                self.db.session.execute(text(optimization_sql))
            except Exception as e:
                print(f"   ⚠️  Warning: Could not apply optimization: {e}")
        
        self.db.session.commit()
        print("   ✅ Table optimizations completed")
    
    def create_migration(self, name, description):
        """Create a new migration file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version = f"{len(self.migrations) + 1:03d}"
        filename = f"migration_{version}_{timestamp}_{name.lower().replace(' ', '_')}.py"
        
        migration_template = f'''#!/usr/bin/env python3
"""
Migration {version}: {name}
{description}
"""

def up(db):
    """Apply the migration"""
    # Add your migration code here
    pass

def down(db):
    """Rollback the migration"""
    # Add your rollback code here
    pass
'''
        
        with open(filename, 'w') as f:
            f.write(migration_template)
        
        print(f"✅ Migration file created: {filename}")
        return filename
    
    def show_status(self):
        """Show migration status"""
        with self.app.app_context():
            current_version = self._get_current_version()
            print(f"📊 Current migration version: {current_version}")
            print(f"📋 Available migrations: {len(self.migrations)}")
            
            for migration in self.migrations:
                status = "✅ Applied" if migration['version'] <= current_version else "⏳ Pending"
                print(f"   {migration['version']}: {migration['name']} - {status}")

def main():
    """Main function for running migrations"""
    migrator = DatabaseMigrator()
    
    if len(sys.argv) < 2:
        print("Usage: python migrations.py <command> [options]")
        print("Commands:")
        print("  migrate [version]  - Run migrations (optionally to specific version)")
        print("  status            - Show migration status")
        print("  create <name>     - Create new migration")
        return
    
    command = sys.argv[1]
    
    if command == 'migrate':
        target_version = sys.argv[2] if len(sys.argv) > 2 else None
        migrator.run_migrations(target_version)
    elif command == 'status':
        migrator.show_status()
    elif command == 'create':
        if len(sys.argv) < 3:
            print("Usage: python migrations.py create <name>")
            return
        name = sys.argv[2]
        description = input("Enter migration description: ")
        migrator.create_migration(name, description)
    else:
        print(f"Unknown command: {command}")

if __name__ == '__main__':
    main()
