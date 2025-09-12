from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
import json
import base64
import re
import requests
from math import isfinite
from config import Config

app = Flask(__name__)
# Enable CORS for all domains on all routes (best for open MVP/dev)
CORS(app)  # You can also do: CORS(app, resources={r"/*": {"origins": "*"}})

# Use configuration class
app.config.from_object(Config)

db = SQLAlchemy(app)

# ---------------- Sentiment Analysis Setup ----------------

try:
    import nltk
    from nltk.sentiment import SentimentIntensityAnalyzer
    try:
        nltk.data.find("sentiment/vader_lexicon.zip")
    except LookupError:
        nltk.download("vader_lexicon")
    _SIA = SentimentIntensityAnalyzer()
    _VADER_AVAILABLE = True
except Exception:
    _VADER_AVAILABLE = False

try:
    from textblob import TextBlob
    _TEXTBLOB_AVAILABLE = True
except Exception:
    _TEXTBLOB_AVAILABLE = False

def _clamp(v, lo, hi):
    return max(lo, min(hi, v))

def _map_polarity_to_1_10(polarity: float) -> float:
    """Map [-1.0, 1.0] linearly to [1.0, 10.0] with better scaling."""
    if polarity is None or not isfinite(polarity):
        polarity = 0.0
    # More aggressive mapping: -1 to 1 becomes 1 to 10
    # This ensures positive comments get higher scores
    return _clamp(5.5 + 4.5 * _clamp(polarity, -1.0, 1.0), 1.0, 10.0)

def analyze_sentiment(text: str) -> float:
    """Return a sentiment score on a 1–10 scale."""
    txt = (text or "").strip()
    if not txt:
        return 5.5  # neutral middle on 1–10

    try:
        if _VADER_AVAILABLE:
            vs = _SIA.polarity_scores(txt)
            polarity = vs.get("compound", 0.0)
        elif _TEXTBLOB_AVAILABLE:
            polarity = TextBlob(txt).sentiment.polarity
        else:
            polarity = 0.0
    except Exception as e:
        polarity = 0.0

    return _map_polarity_to_1_10(polarity)

def _normalize_to_1_10(score):
    try:
        s = float(score)
    except (TypeError, ValueError):
        return None
    if -1.0 <= s <= 1.0:
        return _map_polarity_to_1_10(s)
    if s == 0:
        return 5.5
    return _clamp(s, 1.0, 10.0)

# ---------------- Models ----------------

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(500))
    category = db.Column(db.String(100))
    stock = db.Column(db.Integer, default=0)
    owner_uid = db.Column(db.String(128), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        # Star ratings
        try:
            ratings_list = [r.rating for r in (self.ratings or []) if r and r.rating is not None]
            avg_rating = (sum(ratings_list) / len(ratings_list)) if ratings_list else 0
            rating_count = len(ratings_list)
        except Exception:
            avg_rating = 0
            rating_count = 0

        # Comments sentiment
        try:
            sentiments = [c.sentiment_score for c in (self.comments or []) if c and c.sentiment_score is not None]
            avg_sentiment = (sum(sentiments) / len(sentiments)) if sentiments else 0
            comment_count = len(sentiments)
        except Exception:
            avg_sentiment = 0
            comment_count = 0

        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image_url': self.image_url,
            'category': self.category,
            'stock': self.stock,
            'owner_uid': self.owner_uid,
            'created_at': self.created_at.isoformat(),
            'rating_stats': {
                'average_rating': round(avg_rating, 2),
                'rating_count': rating_count,
                'average_sentiment': round(avg_sentiment, 3),
                'comment_count': comment_count,
            },
        }

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    session_id = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship('Product', backref='cart_items')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'session_id': self.session_id,
            'product': self.product.to_dict() if self.product else None,
            'created_at': self.created_at.isoformat()
        }

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')
    shipping_address = db.Column(db.Text)
    buyer_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'total_amount': self.total_amount,
            'status': self.status,
            'shipping_address': self.shipping_address,
            'buyer_name': self.buyer_name,
            'created_at': self.created_at.isoformat()
        }

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    order = db.relationship('Order', backref='items')
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'price': self.price,
            'product': self.product.to_dict() if self.product else None
        }

class ProductRating(db.Model):
    """Star rating model for products (1-5 stars)"""
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    user_name = db.Column(db.String(150), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = db.relationship('Product', backref='ratings')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'user_name': self.user_name,
            'rating': self.rating,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

class ProductComment(db.Model):
    """Comment model for products with sentiment analysis"""
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    user_name = db.Column(db.String(150), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    sentiment_score = db.Column(db.Float)  # normalized 1.0..10.0
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = db.relationship('Product', backref='comments')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'user_name': self.user_name,
            'comment': self.comment,
            'sentiment_score': self.sentiment_score,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

class ProductCommentVote(db.Model):
    """Reddit-like voting on comments"""
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, nullable=False, index=True)
    user_name = db.Column(db.String(150), nullable=False, index=True)
    value = db.Column(db.Integer, nullable=False, default=1)  # +1 = up, -1 = down
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __table_args__ = (db.UniqueConstraint('comment_id', 'user_name', name='uq_comment_vote'),)

# ---------------- Helpers ----------------

def parse_address(raw_address):
    lines = raw_address.strip().split('\n')
    phone = lines[0] if len(lines) > 0 else ''
    location = "\n".join(lines[1:]) if len(lines) > 1 else ''
    return phone.strip(), location.strip()

def _comment_vote_counts(comment_id: int):
    up = db.session.query(ProductCommentVote).filter_by(comment_id=comment_id, value=1).count()
    down = db.session.query(ProductCommentVote).filter_by(comment_id=comment_id, value=-1).count()
    return up, down

# ---------------- Routes ----------------

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products with rating stats"""
    try:
        products = Product.query.all()
        out = []
        for p in products:
            try:
                out.append(p.to_dict())
            except Exception as row_err:
                print(f"[products] to_dict failed id={getattr(p, 'id', None)}: {row_err}")
                row = {
                    'id': p.id,
                    'name': p.name,
                    'description': p.description,
                    'price': p.price,
                    'image_url': p.image_url,
                    'category': p.category,
                    'stock': p.stock,
                    'owner_uid': p.owner_uid,
                    'created_at': p.created_at.isoformat() if p.created_at else None,
                    'rating_stats': {
                        'average_rating': 0,
                        'rating_count': 0,
                        'average_sentiment': 5.5,
                        'comment_count': 0,
                    },
                }
                out.append(row)
        return jsonify(out)
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({'error': 'Failed to fetch products'}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = db.session.query(Product.category).distinct().all()
        return jsonify([c[0] for c in categories if c[0]])
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify({'error': 'Failed to fetch categories'}), 500

@app.route('/api/cart/<session_id>', methods=['GET'])
def get_cart(session_id):
    items = CartItem.query.filter_by(session_id=session_id).all()
    return jsonify([i.to_dict() for i in items])

@app.route('/api/cart', methods=['POST', 'OPTIONS'])
def add_to_cart():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    session_id = data.get('session_id')
    if not all([product_id, session_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    existing_item = CartItem.query.filter_by(product_id=product_id, session_id=session_id).first()
    if existing_item:
        existing_item.quantity += quantity
    else:
        cart_item = CartItem(product_id=product_id, quantity=quantity, session_id=session_id)
        db.session.add(cart_item)
    db.session.commit()
    return jsonify({'message': 'Item added to cart successfully'})

@app.route('/api/cart/<int:item_id>', methods=['PUT', 'OPTIONS'])
def update_cart_item(item_id):
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    quantity = data.get('quantity')
    if quantity is None:
        return jsonify({'error': 'Quantity is required'}), 400
    cart_item = CartItem.query.get_or_404(item_id)
    cart_item.quantity = quantity
    db.session.commit()
    return jsonify(cart_item.to_dict())

@app.route('/api/cart/<int:item_id>', methods=['DELETE', 'OPTIONS'])
def remove_cart_item(item_id):
    if request.method == 'OPTIONS':
        return '', 200
    cart_item = CartItem.query.get_or_404(item_id)
    db.session.delete(cart_item)
    db.session.commit()
    return jsonify({'message': 'Item removed from cart successfully'})

@app.route('/api/upload-item', methods=['POST', 'OPTIONS'])
def upload_item():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    required_fields = ['name', 'price', 'stock']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        price = float(data['price'])
        if price <= 0:
            return jsonify({'error': 'Price must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid price format'}), 400

    try:
        stock = int(data['stock'])
        if stock < 0:
            return jsonify({'error': 'Stock cannot be negative'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid stock format'}), 400

    new_product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=price,
        image_url=data.get('image_url', ''),
        category=data.get('category', ''),
        stock=stock,
        owner_uid=None
    )
    db.session.add(new_product)
    db.session.commit()
    return jsonify({'message': 'Product uploaded successfully!', 'product': new_product.to_dict()}), 201

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify(product.to_dict())
    except Exception as e:
        print(f"Error fetching product {product_id}: {e}")
        return jsonify({'error': 'Failed to fetch product'}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT', 'OPTIONS'])
def update_product(product_id):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        data = request.get_json() or {}

        if 'name' in data:
            name = (data['name'] or '').strip()
            if not name:
                return jsonify({'error': 'Product name cannot be empty'}), 400
            product.name = name

        if 'description' in data:
            product.description = (data['description'] or '').strip()

        if 'price' in data:
            try:
                price = float(data['price'])
                if price <= 0:
                    return jsonify({'error': 'Price must be greater than 0'}), 400
                product.price = price
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid price format'}), 400

        if 'stock' in data:
            try:
                stock = int(data['stock'])
                if stock < 0:
                    return jsonify({'error': 'Stock cannot be negative'}), 400
                product.stock = stock
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid stock format'}), 400

        if 'category' in data:
            product.category = (data['category'] or '').strip() or None

        if 'image_url' in data:
            product.image_url = (data['image_url'] or '').strip() or None

        db.session.commit()
        return jsonify({'message': 'Product updated successfully!', 'product': product.to_dict()})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating product {product_id}: {e}")
        return jsonify({'error': 'Failed to update product.'}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE', 'OPTIONS'])
def delete_product(product_id):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        name = product.name
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': f'Product "{name}" deleted successfully!'})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting product {product_id}: {e}")
        return jsonify({'error': 'Failed to delete product.'}), 500

# ==================== RATING & COMMENT ENDPOINTS ====================

@app.route('/api/products/<int:product_id>/rate', methods=['POST', 'OPTIONS'])
def rate_product(product_id):
    """1 rating per (product, user). Updates existing on duplicates."""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        data = request.get_json() or {}
        if 'rating' not in data:
            return jsonify({'error': 'Rating is required'}), 400

        try:
            rating = int(data['rating'])
            if not (1 <= rating <= 5):
                return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid rating format'}), 400

        user_name = (data.get('user_name') or '').strip() or 'Anonymous'

        existing = ProductRating.query.filter_by(product_id=product_id, user_name=user_name).first()
        if existing:
            existing.rating = rating
            existing.updated_at = datetime.utcnow()
            db.session.commit()
            return jsonify({'message': 'Rating updated successfully!', 'rating': existing.to_dict()})
        else:
            new_rating = ProductRating(
                product_id=product_id,
                user_name=user_name,
                rating=rating,
            )
            db.session.add(new_rating)
            db.session.commit()
            return jsonify({'message': 'Rating submitted successfully!', 'rating': new_rating.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error rating product {product_id}: {e}")
        return jsonify({'error': 'Failed to submit rating.'}), 500

@app.route('/api/products/<int:product_id>/comments', methods=['GET'])
def get_product_comments(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        comments = (
            ProductComment.query.filter_by(product_id=product_id)
            .order_by(ProductComment.created_at.desc())
            .all()
        )

        comments_with_votes = []
        for c in comments:
            comment_dict = c.to_dict()
            comment_dict['sentiment_score'] = _normalize_to_1_10(comment_dict.get('sentiment_score'))
            
            # Get vote counts
            up, down = _comment_vote_counts(c.id)
            comment_dict['votes'] = {'up': up, 'down': down}
            
            comments_with_votes.append(comment_dict)

        return jsonify({'comments': comments_with_votes, 'count': len(comments_with_votes)})
    except Exception as e:
        print(f"Error fetching comments for product {product_id}: {e}")
        return jsonify({'error': 'Failed to fetch comments'}), 500

@app.route('/api/products/<int:product_id>/comments', methods=['POST', 'OPTIONS'])
def add_product_comment(product_id):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        body = request.get_json() or {}
        comment_text = (body.get('comment') or '').strip()
        if not comment_text:
            return jsonify({'error': 'Comment is required'}), 400
        if len(comment_text) > 1000:
            return jsonify({'error': 'Comment too long (max 1000)'}), 400

        user_name = (body.get('user_name') or '').strip() or 'Anonymous'
        sentiment_score = analyze_sentiment(comment_text)  # 1–10

        new_comment = ProductComment(
            product_id=product_id,
            user_name=user_name,
            comment=comment_text,
            sentiment_score=sentiment_score,
        )
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({'message': 'Comment added successfully!', 'comment': new_comment.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding comment to product {product_id}: {e}")
        return jsonify({'error': 'Failed to add comment.'}), 500

@app.route('/api/comments/<int:comment_id>', methods=['PUT', 'OPTIONS'])
def update_comment(comment_id):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        comment = ProductComment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        data = request.get_json() or {}
        comment_text = (data.get('comment') or '').strip()
        if not comment_text:
            return jsonify({'error': 'Comment is required'}), 400
        if len(comment_text) > 1000:
            return jsonify({'error': 'Comment too long (max 1000)'}), 400

        comment.comment = comment_text
        comment.sentiment_score = analyze_sentiment(comment_text)  # 1–10
        comment.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': 'Comment updated successfully!', 'comment': comment.to_dict()})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating comment {comment_id}: {e}")
        return jsonify({'error': 'Failed to update comment.'}), 500

@app.route('/api/comments/<int:comment_id>', methods=['DELETE', 'OPTIONS'])
def delete_comment(comment_id):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        comment = ProductComment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        db.session.delete(comment)
        db.session.commit()
        return jsonify({'message': 'Comment deleted successfully!'})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting comment {comment_id}: {e}")
        return jsonify({'error': 'Failed to delete comment.'}), 500

@app.route('/api/products/<int:product_id>/ratings', methods=['GET'])
def get_product_ratings(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        ratings = (
            ProductRating.query.filter_by(product_id=product_id)
            .order_by(ProductRating.created_at.desc())
            .all()
        )

        ratings_list = [r.to_dict() for r in ratings]
        return jsonify({'ratings': ratings_list, 'count': len(ratings_list)})
    except Exception as e:
        print(f"Error fetching ratings for product {product_id}: {e}")
        return jsonify({'error': 'Failed to fetch ratings'}), 500

@app.route('/api/products/<int:product_id>/rating-stats', methods=['GET'])
def get_product_rating_stats(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        ratings = ProductRating.query.filter_by(product_id=product_id).all()
        comments = ProductComment.query.filter_by(product_id=product_id).all()

        # Compute rating stats
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        avg_rating = 0.0
        if ratings:
            total = 0
            for r in ratings:
                distribution[r.rating] += 1
                total += r.rating
            avg_rating = total / len(ratings)

        # Normalize per-comment sentiment to 1–10 before averaging
        scores = []
        for c in comments:
            s = _normalize_to_1_10(c.sentiment_score)
            if s is not None:
                scores.append(s)
        avg_sentiment = (sum(scores) / len(scores)) if scores else 5.5  # neutral if no comments

        # Dynamic Badge label
        rating_count = len(ratings)
        created_at = product.created_at or datetime.utcnow()
        two_weeks_ago = datetime.utcnow() - timedelta(days=14)

        def _badge_label():
            avg = avg_sentiment
            if avg >= 8.0:
                return "Most Favourite"
            if avg >= 6.5:
                return f"Popular among {product.category}" if product.category else "Popular"
            if avg >= 4.5:
                return "Try Me"
            if rating_count == 0 and created_at > two_weeks_ago:
                return "Not rated / Recently added"
            return "Pet Favorite"

        return jsonify({
            'average_rating': round(avg_rating, 2) if ratings else 0,
            'rating_count': rating_count,
            'rating_distribution': distribution,
            'average_sentiment': round(avg_sentiment, 3),  # 1–10
            'comment_count': len(comments),
            'badge_label': _badge_label(),
        })
    except Exception as e:
        print(f"Error fetching rating stats for product {product_id}: {e}")
        return jsonify({'error': 'Failed to fetch rating statistics'}), 500

# ==================== COMMENT VOTES ====================

@app.route('/api/comments/<int:comment_id>/votes', methods=['GET'])
def get_comment_votes(comment_id):
    """Returns { up, down, user_vote }"""
    try:
        comment = ProductComment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        up, down = _comment_vote_counts(comment_id)
        return jsonify({'up': up, 'down': down, 'user_vote': None})  # No auth, so no user vote
    except Exception as e:
        print(f"Error fetching votes for comment {comment_id}: {e}")
        return jsonify({'error': 'Failed to fetch votes'}), 500

@app.route('/api/comments/<int:comment_id>/vote', methods=['POST', 'OPTIONS'])
def vote_comment(comment_id):
    """Body: { "direction": "up" | "down" | "clear", "user_name": "string" }"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        comment = ProductComment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        body = request.get_json() or {}
        direction = (body.get('direction') or '').strip().lower()
        if direction not in ('up', 'down', 'clear'):
            return jsonify({'error': "Invalid direction. Use 'up', 'down', or 'clear'."}), 400

        user_name = (body.get('user_name') or '').strip() or 'Anonymous'

        row = ProductCommentVote.query.filter_by(comment_id=comment_id, user_name=user_name).first()

        if direction == 'clear':
            if row:
                db.session.delete(row)
                db.session.commit()
            up, down = _comment_vote_counts(comment_id)
            return jsonify({'up': up, 'down': down, 'user_vote': None})

        new_value = 1 if direction == 'up' else -1
        if row:
            if row.value != new_value:
                row.value = new_value
                row.updated_at = datetime.utcnow()
                db.session.commit()
        else:
            row = ProductCommentVote(comment_id=comment_id, user_name=user_name, value=new_value)
            db.session.add(row)
            db.session.commit()

        up, down = _comment_vote_counts(comment_id)
        return jsonify({'up': up, 'down': down, 'user_vote': direction})
    except Exception as e:
        db.session.rollback()
        print(f"Error voting on comment {comment_id}: {e}")
        return jsonify({'error': 'Failed to record vote'}), 500

@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    products = Product.query.all()
    dashboard_data = []
    for product in products:
        order_items = OrderItem.query.filter_by(product_id=product.id).all()
        sold_quantity = sum(item.quantity for item in order_items)
        buyers = []
        for item in order_items:
            order = Order.query.get(item.order_id)
            if order:
                phone, location = parse_address(order.shipping_address or '')
                buyers.append({
                    'buyer_name': order.buyer_name or '',
                    'product_name': product.name,
                    'quantity': item.quantity,
                    'price_paid': item.price,
                    'payment_method': 'PayPal',
                    'phone_number': phone,
                    'location': location
                })
        dashboard_data.append({
            'id': product.id,
            'title': product.name,
            'description': product.description,
            'price': product.price,
            'category': product.category,
            'image_url': product.image_url,
            'stock': product.stock,
            'sold': sold_quantity,
            'buyers': buyers
        })
    return jsonify(dashboard_data)

@app.route('/api/orders', methods=['POST', 'OPTIONS'])
def create_order():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    session_id = data.get('session_id')
    shipping_address = data.get('shipping_address', '')
    buyer_name = data.get('buyer_name', '')
    if not session_id:
        return jsonify({'error': 'Session ID required'}), 400
    cart_items = CartItem.query.filter_by(session_id=session_id).all()
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400
    total_amount = sum(item.product.price * item.quantity for item in cart_items)
    order = Order(
        session_id=session_id,
        total_amount=total_amount,
        shipping_address=shipping_address,
        buyer_name=buyer_name
    )
    db.session.add(order)
    db.session.flush()
    for cart_item in cart_items:
        if cart_item.product.stock >= cart_item.quantity:
            cart_item.product.stock -= cart_item.quantity
        else:
            return jsonify({'error': f'Not enough stock for {cart_item.product.name}'}), 400
        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            price=cart_item.product.price
        )
        db.session.add(order_item)
    CartItem.query.filter_by(session_id=session_id).delete()
    db.session.commit()
    return jsonify(order.to_dict())

# ---------------- Start App ----------------

if __name__ == '__main__':
    with app.app_context():
        try:
            # Try to create tables (will skip if they already exist)
            db.create_all()
            print("Database tables ready!")
        except Exception as e:
            print(f"Database initialization warning: {e}")
            print("Continuing with existing database...")
    
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
