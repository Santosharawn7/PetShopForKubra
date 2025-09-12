#!/usr/bin/env python3
"""Test script to check database connection"""

import sqlite3
import os
from config import Config

def test_database_connection():
    print("Testing database connection...")
    print(f"Database URI: {Config.SQLALCHEMY_DATABASE_URI}")
    
    # Extract the file path from the URI
    db_path = Config.SQLALCHEMY_DATABASE_URI.replace('sqlite:///', '')
    print(f"Database file path: {db_path}")
    
    # Check if file exists
    if os.path.exists(db_path):
        print("✅ Database file exists")
        print(f"File size: {os.path.getsize(db_path)} bytes")
        
        # Test connection
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print(f"✅ Database connection successful")
            print(f"Tables found: {[table[0] for table in tables]}")
            conn.close()
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    else:
        print("❌ Database file does not exist")
        return False

if __name__ == "__main__":
    test_database_connection()
