import os

class Config:
    """Configuration class for the Pet Shop backend"""
    
    # Database configuration
    # For Docker SQLite database - use absolute path
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL', 
        'sqlite:////Users/santosharawn7/InventoryForPetApp/PetShop/docker/db/data/petshop.db'
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Flask configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # CORS configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
