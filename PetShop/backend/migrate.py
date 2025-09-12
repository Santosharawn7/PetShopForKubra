#!/usr/bin/env python3
"""
Migration Manager for PetShop Backend
Handles database schema changes and seed data management
"""

import os
import sys
import json
from datetime import datetime
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy import text

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Product, CartItem, Order, OrderItem, ProductRating, ProductComment, ProductCommentVote

# Initialize Flask-Migrate
migrate = Migrate(app, db)

class MigrationManager:
    """Handles database migrations and seed data"""
    
    def __init__(self):
        self.app = app
        self.db = db
        
    def init_database(self):
        """Initialize the database with all tables"""
        with self.app.app_context():
            print("🔄 Initializing database...")
            self.db.create_all()
            print("✅ Database initialized successfully!")
            
    def seed_data(self):
        """Seed the database with initial data"""
        with self.app.app_context():
            print("🌱 Seeding database with initial data...")
            
            # Check if data already exists
            if Product.query.first():
                print("⚠️  Database already has data. Skipping seed.")
                return
                
            # Sample products
            products_data = [
                {
                    'name': 'Premium Dog Food',
                    'description': 'High-quality, nutritious dog food made with real meat and vegetables. Perfect for all dog breeds and sizes.',
                    'price': 29.99,
                    'image_url': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
                    'category': 'Food',
                    'stock': 50,
                    'owner_uid': None
                },
                {
                    'name': 'Interactive Cat Toy',
                    'description': 'Engaging cat toy with feathers and bells to keep your feline friend entertained for hours.',
                    'price': 15.99,
                    'image_url': 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400',
                    'category': 'Toys',
                    'stock': 25,
                    'owner_uid': None
                },
                {
                    'name': 'Dog Leash Set',
                    'description': 'Durable, adjustable dog leash with matching collar. Available in multiple colors and sizes.',
                    'price': 24.99,
                    'image_url': 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400',
                    'category': 'Accessories',
                    'stock': 30,
                    'owner_uid': None
                },
                {
                    'name': 'Cat Scratching Post',
                    'description': 'Tall, sturdy scratching post with sisal rope and comfortable platform for your cat to rest.',
                    'price': 45.99,
                    'image_url': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
                    'category': 'Furniture',
                    'stock': 15,
                    'owner_uid': None
                },
                {
                    'name': 'Fish Tank Starter Kit',
                    'description': 'Complete aquarium setup including tank, filter, heater, and decorations. Perfect for beginners.',
                    'price': 89.99,
                    'image_url': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
                    'category': 'Aquarium',
                    'stock': 10,
                    'owner_uid': None
                },
                {
                    'name': 'Bird Seed Mix',
                    'description': 'Nutritious seed blend for all types of birds. Contains sunflower seeds, millet, and other healthy grains.',
                    'price': 12.99,
                    'image_url': 'https://images.unsplash.com/photo-1559827260-dc66d52bef11?w=400',
                    'category': 'Food',
                    'stock': 40,
                    'owner_uid': None
                }
            ]
            
            # Create products
            for product_data in products_data:
                product = Product(**product_data)
                self.db.session.add(product)
            
            self.db.session.commit()
            print(f"✅ Created {len(products_data)} products")
            
            # Add some sample ratings and comments
            self._add_sample_ratings_and_comments()
            
            print("✅ Database seeded successfully!")
    
    def _add_sample_ratings_and_comments(self):
        """Add sample ratings and comments for products"""
        products = Product.query.all()
        
        # Sample ratings and comments
        sample_data = [
            {
                'ratings': [
                    {'user_name': 'John D.', 'rating': 5, 'comment': 'Excellent quality! My dog loves this food.'},
                    {'user_name': 'Sarah M.', 'rating': 4, 'comment': 'Great value for money. Highly recommend!'},
                    {'user_name': 'Mike R.', 'rating': 5, 'comment': 'Perfect nutrition for my puppy. Will buy again!'}
                ]
            },
            {
                'ratings': [
                    {'user_name': 'Lisa K.', 'rating': 4, 'comment': 'My cat is obsessed with this toy!'},
                    {'user_name': 'Tom W.', 'rating': 5, 'comment': 'Best cat toy I\'ve ever bought. Very durable.'},
                    {'user_name': 'Emma S.', 'rating': 3, 'comment': 'Good toy but could be more interactive.'}
                ]
            },
            {
                'ratings': [
                    {'user_name': 'David L.', 'rating': 5, 'comment': 'High quality leash set. Very comfortable.'},
                    {'user_name': 'Anna P.', 'rating': 4, 'comment': 'Great design and sturdy construction.'}
                ]
            },
            {
                'ratings': [
                    {'user_name': 'Chris T.', 'rating': 5, 'comment': 'My cats love this scratching post!'},
                    {'user_name': 'Maria G.', 'rating': 4, 'comment': 'Well made and stable. Good value.'}
                ]
            },
            {
                'ratings': [
                    {'user_name': 'Alex B.', 'rating': 5, 'comment': 'Perfect starter kit for beginners!'},
                    {'user_name': 'Rachel H.', 'rating': 4, 'comment': 'Everything you need to start an aquarium.'}
                ]
            },
            {
                'ratings': [
                    {'user_name': 'Kevin M.', 'rating': 4, 'comment': 'Great seed mix. Birds love it!'},
                    {'user_name': 'Sophie L.', 'rating': 5, 'comment': 'Excellent quality and good price.'}
                ]
            }
        ]
        
        for i, product in enumerate(products):
            if i < len(sample_data):
                for rating_data in sample_data[i]['ratings']:
                    # Add rating
                    rating = ProductRating(
                        product_id=product.id,
                        user_name=rating_data['user_name'],
                        rating=rating_data['rating']
                    )
                    self.db.session.add(rating)
                    
                    # Add comment with sentiment analysis
                    from app import analyze_sentiment
                    comment = ProductComment(
                        product_id=product.id,
                        user_name=rating_data['user_name'],
                        comment=rating_data['comment'],
                        sentiment_score=analyze_sentiment(rating_data['comment'])
                    )
                    self.db.session.add(comment)
        
        self.db.session.commit()
        print("✅ Added sample ratings and comments")
    
    def backup_database(self, backup_path=None):
        """Create a backup of the current database"""
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"backup_{timestamp}.db"
        
        with self.app.app_context():
            print(f"💾 Creating database backup: {backup_path}")
            
            # For SQLite, we can simply copy the file
            import shutil
            db_path = self.app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
            # Handle relative paths and instance directory
            if not os.path.isabs(db_path):
                # Check if file exists in current directory
                if os.path.exists(db_path):
                    db_path = os.path.join(os.getcwd(), db_path)
                # Check if file exists in instance directory
                elif os.path.exists(os.path.join('instance', db_path)):
                    db_path = os.path.join(os.getcwd(), 'instance', db_path)
                else:
                    # Try to find the database file
                    for root, dirs, files in os.walk('.'):
                        if db_path in files:
                            db_path = os.path.join(root, db_path)
                            break
                    else:
                        raise FileNotFoundError(f"Database file {db_path} not found")
            shutil.copy2(db_path, backup_path)
            print(f"✅ Backup created: {backup_path}")
    
    def restore_database(self, backup_path):
        """Restore database from backup"""
        with self.app.app_context():
            print(f"🔄 Restoring database from: {backup_path}")
            
            if not os.path.exists(backup_path):
                print(f"❌ Backup file not found: {backup_path}")
                return False
            
            # For SQLite, we can simply copy the file back
            import shutil
            db_path = self.app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
            # Handle relative paths and instance directory
            if not os.path.isabs(db_path):
                # Check if file exists in current directory
                if os.path.exists(db_path):
                    db_path = os.path.join(os.getcwd(), db_path)
                # Check if file exists in instance directory
                elif os.path.exists(os.path.join('instance', db_path)):
                    db_path = os.path.join(os.getcwd(), 'instance', db_path)
                else:
                    # Try to find the database file
                    for root, dirs, files in os.walk('.'):
                        if db_path in files:
                            db_path = os.path.join(root, db_path)
                            break
                    else:
                        raise FileNotFoundError(f"Database file {db_path} not found")
            shutil.copy2(backup_path, db_path)
            print(f"✅ Database restored from: {backup_path}")
            return True
    
    def reset_database(self):
        """Reset the database (WARNING: This will delete all data)"""
        with self.app.app_context():
            print("⚠️  WARNING: This will delete all data!")
            response = input("Are you sure you want to reset the database? (yes/no): ")
            
            if response.lower() != 'yes':
                print("❌ Database reset cancelled")
                return False
            
            print("🔄 Resetting database...")
            self.db.drop_all()
            self.db.create_all()
            print("✅ Database reset successfully!")
            return True
    
    def migrate_schema(self):
        """Run database migrations"""
        with self.app.app_context():
            print("🔄 Running database migrations...")
            # This would typically use Flask-Migrate commands
            # For now, we'll just ensure all tables exist
            self.db.create_all()
            print("✅ Schema migration completed!")
    
    def export_data(self, export_path=None):
        """Export all data to JSON file"""
        if not export_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            export_path = f"data_export_{timestamp}.json"
        
        with self.app.app_context():
            print(f"📤 Exporting data to: {export_path}")
            
            export_data = {
                'products': [p.to_dict() for p in Product.query.all()],
                'cart_items': [c.to_dict() for c in CartItem.query.all()],
                'orders': [o.to_dict() for o in Order.query.all()],
                'order_items': [oi.to_dict() for oi in OrderItem.query.all()],
                'ratings': [r.to_dict() for r in ProductRating.query.all()],
                'comments': [c.to_dict() for c in ProductComment.query.all()],
                'comment_votes': [
                    {
                        'id': v.id,
                        'comment_id': v.comment_id,
                        'user_name': v.user_name,
                        'value': v.value,
                        'created_at': v.created_at.isoformat(),
                        'updated_at': v.updated_at.isoformat()
                    } for v in ProductCommentVote.query.all()
                ]
            }
            
            with open(export_path, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)
            
            print(f"✅ Data exported to: {export_path}")
    
    def import_data(self, import_path):
        """Import data from JSON file"""
        with self.app.app_context():
            print(f"📥 Importing data from: {import_path}")
            
            if not os.path.exists(import_path):
                print(f"❌ Import file not found: {import_path}")
                return False
            
            with open(import_path, 'r') as f:
                data = json.load(f)
            
            # Clear existing data
            self.db.drop_all()
            self.db.create_all()
            
            # Import products
            for product_data in data.get('products', []):
                # Remove rating_stats as it's computed
                product_data.pop('rating_stats', None)
                product = Product(**product_data)
                self.db.session.add(product)
            
            self.db.session.commit()
            
            # Import other data
            for cart_data in data.get('cart_items', []):
                cart_item = CartItem(**cart_data)
                self.db.session.add(cart_item)
            
            for order_data in data.get('orders', []):
                order = Order(**order_data)
                self.db.session.add(order)
            
            for order_item_data in data.get('order_items', []):
                order_item = OrderItem(**order_item_data)
                self.db.session.add(order_item)
            
            for rating_data in data.get('ratings', []):
                rating = ProductRating(**rating_data)
                self.db.session.add(rating)
            
            for comment_data in data.get('comments', []):
                comment = ProductComment(**comment_data)
                self.db.session.add(comment)
            
            for vote_data in data.get('comment_votes', []):
                vote = ProductCommentVote(**vote_data)
                self.db.session.add(vote)
            
            self.db.session.commit()
            print(f"✅ Data imported from: {import_path}")
            return True

# CLI Commands
def main():
    """Main function for running migrations"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python migrate.py <command> [options]")
        print("Commands:")
        print("  init              - Initialize database and run migrations")
        print("  seed              - Seed database with initial data")
        print("  reset             - Reset database (WARNING: Deletes all data)")
        print("  backup            - Create database backup")
        print("  restore <file>    - Restore from backup file")
        print("  export            - Export all data to JSON")
        print("  import <file>     - Import data from JSON file")
        print("  migrate           - Run database migrations")
        return
    
    command = sys.argv[1]
    migration_manager = MigrationManager()
    
    if command == 'init':
        migration_manager.init_database()
        migration_manager.migrate_schema()
    elif command == 'seed':
        migration_manager.seed_data()
    elif command == 'reset':
        migration_manager.reset_database()
    elif command == 'backup':
        migration_manager.backup_database()
    elif command == 'restore':
        if len(sys.argv) < 3:
            print("Usage: python migrate.py restore <backup_file>")
            return
        migration_manager.restore_database(sys.argv[2])
    elif command == 'export':
        migration_manager.export_data()
    elif command == 'import':
        if len(sys.argv) < 3:
            print("Usage: python migrate.py import <json_file>")
            return
        migration_manager.import_data(sys.argv[2])
    elif command == 'migrate':
        migration_manager.migrate_schema()
    else:
        print(f"Unknown command: {command}")

if __name__ == '__main__':
    main()
