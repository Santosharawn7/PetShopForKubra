import pytest
import json
import os
import tempfile
from app import app, db, Product, CartItem, Order, OrderItem, ProductRating, ProductComment, ProductCommentVote, analyze_sentiment

@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    # Create a temporary database
    db_fd, app.config['DATABASE'] = tempfile.mkstemp()
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
        db.drop_all()
    
    os.close(db_fd)
    os.unlink(app.config['DATABASE'])

@pytest.fixture
def sample_product():
    """Create a sample product for testing."""
    product = Product(
        name="Test Pet Toy",
        description="A great toy for pets",
        price=19.99,
        image_url="https://example.com/toy.jpg",
        category="Toys",
        stock=10,
        owner_uid="test_owner"
    )
    db.session.add(product)
    db.session.commit()
    return product

@pytest.fixture
def sample_cart_item(sample_product):
    """Create a sample cart item for testing."""
    cart_item = CartItem(
        product_id=sample_product.id,
        quantity=2,
        session_id="test_session"
    )
    db.session.add(cart_item)
    db.session.commit()
    return cart_item

class TestProductEndpoints:
    """Test all product-related endpoints."""
    
    def test_get_products_empty(self, client):
        """Test getting products when none exist."""
        # Clear all products first
        with app.app_context():
            Product.query.delete()
            db.session.commit()
        
        response = client.get('/api/products')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == []
    
    def test_get_products_with_data(self, client, sample_product):
        """Test getting products with data."""
        response = client.get('/api/products')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['name'] == "Test Pet Toy"
        assert data[0]['price'] == 19.99
    
    def test_get_categories(self, client, sample_product):
        """Test getting categories."""
        response = client.get('/api/categories')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "Toys" in data
    
    def test_upload_item_success(self, client):
        """Test successful product upload."""
        product_data = {
            "name": "New Pet Food",
            "description": "Healthy pet food",
            "price": 29.99,
            "image_url": "https://example.com/food.jpg",
            "category": "Food",
            "stock": 5
        }
        response = client.post('/api/upload-item', 
                             data=json.dumps(product_data),
                             content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Product uploaded successfully!'
        assert 'product' in data
    
    def test_upload_item_missing_fields(self, client):
        """Test product upload with missing required fields."""
        product_data = {
            "name": "Incomplete Product"
            # Missing price and stock
        }
        response = client.post('/api/upload-item',
                             data=json.dumps(product_data),
                             content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_upload_item_invalid_price(self, client):
        """Test product upload with invalid price."""
        product_data = {
            "name": "Test Product",
            "price": -10.0,  # Invalid negative price
            "stock": 5
        }
        response = client.post('/api/upload-item',
                             data=json.dumps(product_data),
                             content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_get_product_by_id(self, client, sample_product):
        """Test getting a specific product by ID."""
        response = client.get(f'/api/products/{sample_product.id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['name'] == "Test Pet Toy"
    
    def test_get_product_not_found(self, client):
        """Test getting a non-existent product."""
        response = client.get('/api/products/999')
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_update_product(self, client, sample_product):
        """Test updating a product."""
        update_data = {
            "name": "Updated Pet Toy",
            "price": 25.99,
            "stock": 15
        }
        response = client.put(f'/api/products/{sample_product.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['product']['name'] == "Updated Pet Toy"
        assert data['product']['price'] == 25.99
    
    def test_update_product_success(self, client, sample_product):
        """Test successful product update."""
        update_data = {
            "name": "Updated Pet Toy",
            "description": "Updated description",
            "price": 25.99,
            "stock": 15,
            "category": "Updated Toys",
            "image_url": "https://example.com/updated.jpg"
        }
        response = client.put(f'/api/products/{sample_product.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Product updated successfully!'
        assert data['product']['name'] == 'Updated Pet Toy'
        assert data['product']['price'] == 25.99
        assert data['product']['stock'] == 15
        assert data['product']['category'] == 'Updated Toys'
    
    def test_update_product_partial(self, client, sample_product):
        """Test partial product update (only some fields)."""
        update_data = {
            "name": "Partially Updated Toy",
            "price": 30.99
        }
        response = client.put(f'/api/products/{sample_product.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['product']['name'] == 'Partially Updated Toy'
        assert data['product']['price'] == 30.99
        # Other fields should remain unchanged
        assert data['product']['description'] == 'A great toy for pets'
        assert data['product']['stock'] == 10
    
    def test_update_product_invalid_price(self, client, sample_product):
        """Test product update with invalid price."""
        update_data = {
            "price": -10.99  # Invalid: negative price
        }
        response = client.put(f'/api/products/{sample_product.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Price must be greater than 0' in data['error']
    
    def test_update_product_invalid_stock(self, client, sample_product):
        """Test product update with invalid stock."""
        update_data = {
            "stock": -5  # Invalid: negative stock
        }
        response = client.put(f'/api/products/{sample_product.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Stock cannot be negative' in data['error']
    
    def test_update_product_empty_name(self, client, sample_product):
        """Test product update with empty name."""
        update_data = {
            "name": ""  # Invalid: empty name
        }
        response = client.put(f'/api/products/{sample_product.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Product name cannot be empty' in data['error']
    
    def test_update_product_not_found(self, client):
        """Test updating non-existent product."""
        update_data = {
            "name": "Updated Product"
        }
        response = client.put('/api/products/999',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Product not found' in data['error']
    
    def test_update_product_invalid_price_format(self, client, sample_product):
        """Test product update with invalid price format."""
        update_data = {
            "price": "not_a_number"
        }
        response = client.put(f'/api/products/{sample_product.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid price format' in data['error']
    
    def test_update_product_invalid_stock_format(self, client, sample_product):
        """Test product update with invalid stock format."""
        update_data = {
            "stock": "not_a_number"
        }
        response = client.put(f'/api/products/{sample_product.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid stock format' in data['error']

    def test_delete_product(self, client, sample_product):
        """Test deleting a product."""
        response = client.delete(f'/api/products/{sample_product.id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'deleted successfully' in data['message']
        
        # Verify product is deleted
        response = client.get(f'/api/products/{sample_product.id}')
        assert response.status_code == 404

class TestCartEndpoints:
    """Test all cart-related endpoints."""
    
    def test_get_cart_empty(self, client):
        """Test getting empty cart."""
        response = client.get('/api/cart/test_session')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data == []
    
    def test_add_to_cart(self, client, sample_product):
        """Test adding item to cart."""
        cart_data = {
            "product_id": sample_product.id,
            "quantity": 3,
            "session_id": "test_session"
        }
        response = client.post('/api/cart',
                             data=json.dumps(cart_data),
                             content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Item added to cart successfully'
    
    def test_add_to_cart_existing_item(self, client, sample_cart_item):
        """Test adding existing item to cart (should update quantity)."""
        cart_data = {
            "product_id": sample_cart_item.product_id,
            "quantity": 2,
            "session_id": sample_cart_item.session_id
        }
        response = client.post('/api/cart',
                             data=json.dumps(cart_data),
                             content_type='application/json')
        assert response.status_code == 200
        
        # Check that quantity was updated
        response = client.get(f'/api/cart/{sample_cart_item.session_id}')
        data = json.loads(response.data)
        assert data[0]['quantity'] == 4  # 2 + 2
    
    def test_update_cart_item(self, client, sample_cart_item):
        """Test updating cart item quantity."""
        update_data = {"quantity": 5}
        response = client.put(f'/api/cart/{sample_cart_item.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['quantity'] == 5
    
    def test_remove_cart_item(self, client, sample_cart_item):
        """Test removing item from cart."""
        response = client.delete(f'/api/cart/{sample_cart_item.id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'removed from cart successfully' in data['message']

class TestRatingEndpoints:
    """Test all rating-related endpoints."""
    
    def test_rate_product(self, client, sample_product):
        """Test rating a product."""
        rating_data = {
            "rating": 5,
            "user_name": "Test User"
        }
        response = client.post(f'/api/products/{sample_product.id}/rate',
                             data=json.dumps(rating_data),
                             content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Rating submitted successfully!'
        assert data['rating']['rating'] == 5
    
    def test_rate_product_invalid_rating(self, client, sample_product):
        """Test rating with invalid rating value."""
        rating_data = {
            "rating": 6,  # Invalid: should be 1-5
            "user_name": "Test User"
        }
        response = client.post(f'/api/products/{sample_product.id}/rate',
                             data=json.dumps(rating_data),
                             content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_get_product_ratings(self, client, sample_product):
        """Test getting product ratings."""
        # First add a rating
        rating = ProductRating(
            product_id=sample_product.id,
            user_name="Test User",
            rating=4
        )
        db.session.add(rating)
        db.session.commit()
        
        response = client.get(f'/api/products/{sample_product.id}/ratings')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['ratings']) == 1
        assert data['ratings'][0]['rating'] == 4
    
    def test_get_rating_stats(self, client, sample_product):
        """Test getting rating statistics."""
        # Add some ratings
        ratings = [
            ProductRating(product_id=sample_product.id, user_name="User1", rating=5),
            ProductRating(product_id=sample_product.id, user_name="User2", rating=4),
            ProductRating(product_id=sample_product.id, user_name="User3", rating=3)
        ]
        for rating in ratings:
            db.session.add(rating)
        db.session.commit()
        
        response = client.get(f'/api/products/{sample_product.id}/rating-stats')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['average_rating'] == 4.0
        assert data['rating_count'] == 3

class TestCommentEndpoints:
    """Test all comment-related endpoints."""
    
    def test_add_comment(self, client, sample_product):
        """Test adding a comment."""
        comment_data = {
            "comment": "This is a great product!",
            "user_name": "Test User"
        }
        response = client.post(f'/api/products/{sample_product.id}/comments',
                             data=json.dumps(comment_data),
                             content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Comment added successfully!'
        assert data['comment']['comment'] == "This is a great product!"
    
    def test_add_comment_too_long(self, client, sample_product):
        """Test adding a comment that's too long."""
        long_comment = "x" * 1001  # Exceeds 1000 character limit
        comment_data = {
            "comment": long_comment,
            "user_name": "Test User"
        }
        response = client.post(f'/api/products/{sample_product.id}/comments',
                             data=json.dumps(comment_data),
                             content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_get_product_comments(self, client, sample_product):
        """Test getting product comments."""
        # First add a comment
        comment = ProductComment(
            product_id=sample_product.id,
            user_name="Test User",
            comment="Great product!",
            sentiment_score=8.5
        )
        db.session.add(comment)
        db.session.commit()
        
        response = client.get(f'/api/products/{sample_product.id}/comments')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['comments']) == 1
        assert data['comments'][0]['comment'] == "Great product!"
    
    def test_update_comment(self, client, sample_product):
        """Test updating a comment."""
        # First add a comment
        comment = ProductComment(
            product_id=sample_product.id,
            user_name="Test User",
            comment="Original comment",
            sentiment_score=5.5
        )
        db.session.add(comment)
        db.session.commit()
        
        update_data = {
            "comment": "Updated comment"
        }
        response = client.put(f'/api/comments/{comment.id}',
                            data=json.dumps(update_data),
                            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['comment']['comment'] == "Updated comment"
    
    def test_delete_comment(self, client, sample_product):
        """Test deleting a comment."""
        # First add a comment
        comment = ProductComment(
            product_id=sample_product.id,
            user_name="Test User",
            comment="Comment to delete",
            sentiment_score=5.5
        )
        db.session.add(comment)
        db.session.commit()
        
        response = client.delete(f'/api/comments/{comment.id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'deleted successfully' in data['message']

class TestCommentVoting:
    """Test comment voting functionality."""
    
    def test_vote_comment_up(self, client, sample_product):
        """Test upvoting a comment."""
        # First add a comment
        comment = ProductComment(
            product_id=sample_product.id,
            user_name="Test User",
            comment="Test comment",
            sentiment_score=5.5
        )
        db.session.add(comment)
        db.session.commit()
        
        vote_data = {
            "direction": "up",
            "user_name": "Voter"
        }
        response = client.post(f'/api/comments/{comment.id}/vote',
                             data=json.dumps(vote_data),
                             content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['up'] == 1
        assert data['down'] == 0
    
    def test_vote_comment_down(self, client, sample_product):
        """Test downvoting a comment."""
        # First add a comment
        comment = ProductComment(
            product_id=sample_product.id,
            user_name="Test User",
            comment="Test comment",
            sentiment_score=5.5
        )
        db.session.add(comment)
        db.session.commit()
        
        vote_data = {
            "direction": "down",
            "user_name": "Voter"
        }
        response = client.post(f'/api/comments/{comment.id}/vote',
                             data=json.dumps(vote_data),
                             content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['up'] == 0
        assert data['down'] == 1

class TestOrderEndpoints:
    """Test all order-related endpoints."""
    
    def test_create_order(self, client, sample_cart_item):
        """Test creating an order."""
        order_data = {
            "session_id": sample_cart_item.session_id,
            "shipping_address": "123 Test St\nTest City, TS 12345\nTest Country",
            "buyer_name": "Test Buyer"
        }
        response = client.post('/api/orders',
                             data=json.dumps(order_data),
                             content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['total_amount'] == sample_cart_item.product.price * sample_cart_item.quantity
    
    def test_create_order_empty_cart(self, client):
        """Test creating order with empty cart."""
        order_data = {
            "session_id": "empty_session",
            "shipping_address": "123 Test St",
            "buyer_name": "Test Buyer"
        }
        response = client.post('/api/orders',
                             data=json.dumps(order_data),
                             content_type='application/json')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

class TestDashboard:
    """Test dashboard endpoint."""
    
    def test_admin_dashboard(self, client, sample_product):
        """Test admin dashboard."""
        response = client.get('/api/admin/dashboard')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['title'] == "Test Pet Toy"

class TestSentimentAnalysis:
    """Test sentiment analysis functionality."""
    
    def test_analyze_sentiment_positive(self):
        """Test sentiment analysis with positive text."""
        text = "This is amazing! I love it so much!"
        score = analyze_sentiment(text)
        assert score > 7.0  # Should be positive
    
    def test_analyze_sentiment_negative(self):
        """Test sentiment analysis with negative text."""
        text = "This is terrible! I hate it!"
        score = analyze_sentiment(text)
        assert score < 4.0  # Should be negative
    
    def test_analyze_sentiment_neutral(self):
        """Test sentiment analysis with neutral text."""
        text = "This is okay. Nothing special."
        score = analyze_sentiment(text)
        assert 4.0 <= score <= 7.0  # Should be neutral
    
    def test_analyze_sentiment_empty(self):
        """Test sentiment analysis with empty text."""
        score = analyze_sentiment("")
        assert score == 5.5  # Should default to neutral

if __name__ == '__main__':
    pytest.main([__file__])
