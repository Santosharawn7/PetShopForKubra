import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import { FaStar, FaRegStar, FaShoppingCart, FaArrowLeft, FaThumbsUp, FaThumbsDown, FaEdit, FaTrash } from 'react-icons/fa';
import { MdPets } from 'react-icons/md';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [comments, setComments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [ratingForm, setRatingForm] = useState({ rating: 5, user_name: '' });
  const [commentForm, setCommentForm] = useState({ comment: '', user_name: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const [productRes, ratingRes, commentsRes, ratingsRes] = await Promise.all([
        axios.get(buildApiUrl(`/api/products/${id}`)),
        axios.get(buildApiUrl(`/api/products/${id}/rating-stats`)),
        axios.get(buildApiUrl(`/api/products/${id}/comments`)),
        axios.get(buildApiUrl(`/api/products/${id}/ratings`))
      ]);

      setProduct(productRes.data);
      setRatingData(ratingRes.data);
      setComments(commentsRes.data.comments || []);
      setRatings(ratingsRes.data.ratings || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingForm.user_name.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(buildApiUrl(`/api/products/${id}/rate`), {
        rating: ratingForm.rating,
        user_name: ratingForm.user_name.trim()
      });
      
      setRatingForm({ rating: 5, user_name: '' });
      setShowRatingForm(false);
      fetchProductDetails(); // Refresh data
      alert('Rating submitted successfully!');
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentForm.comment.trim()) {
      alert('Please enter a comment');
      return;
    }
    if (!commentForm.user_name.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(buildApiUrl(`/api/products/${id}/comments`), {
        comment: commentForm.comment.trim(),
        user_name: commentForm.user_name.trim()
      });
      
      setCommentForm({ comment: '', user_name: '' });
      setShowCommentForm(false);
      fetchProductDetails(); // Refresh data
      alert('Comment added successfully!');
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (commentId, direction) => {
    try {
      await axios.post(buildApiUrl(`/api/comments/${commentId}/vote`), {
        direction,
        user_name: 'Anonymous' // No auth, so use anonymous
      });
      fetchProductDetails(); // Refresh to get updated vote counts
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const renderStars = (rating, size = "text-lg") => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    return (
      <div className={`flex items-center gap-1 ${size}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-400">
            {star <= fullStars ? (
              <FaStar />
            ) : star === fullStars + 1 && hasHalfStar ? (
              <div className="relative">
                <FaRegStar className="text-gray-300" />
                <FaStar className="absolute inset-0 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
              </div>
            ) : (
              <FaRegStar className="text-gray-300" />
            )}
          </span>
        ))}
      </div>
    );
  };

  const getStockState = (stock) => {
    if (stock === 0) return { label: "Out of Stock", class: "bg-red-100 text-red-800" };
    if (stock < 10) return { label: "Almost Out of Stock", class: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", class: "bg-green-100 text-green-800" };
  };

  const getSentimentEmoji = (score) => {
    if (score >= 7) return '😊';
    if (score <= 4) return '😞';
    return '😐';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/shop')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const stockState = getStockState(product.stock);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 via-indigo-200 to-pink-200 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 text-purple-700 hover:text-purple-900 mb-6 transition-colors"
        >
          <FaArrowLeft />
          <span>Back to Shop</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6">
            <div className="relative">
              <img
                src={product.image_url || "https://via.placeholder.com/600x400?text=Product"}
                alt={product.name}
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
              {/* Badge */}
              {ratingData?.badge_label && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                  <MdPets className="text-sm" />
                  {ratingData.badge_label}
                </div>
              )}
              {/* Stock Badge */}
              <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${stockState.class}`}>
                {stockState.label}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
            
            {product.category && (
              <div className="mb-4">
                <span className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-semibold border border-indigo-200">
                  {product.category}
                </span>
              </div>
            )}

            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              {product.description || "No description provided."}
            </p>

            {/* Rating Display */}
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {ratingData && ratingData.rating_count > 0 ? (
                    <>
                      {renderStars(ratingData.average_rating, "text-xl")}
                      <div>
                        <span className="text-2xl font-bold text-gray-800">
                          {ratingData.average_rating.toFixed(1)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          ({ratingData.rating_count} {ratingData.rating_count === 1 ? 'rating' : 'ratings'})
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaRegStar key={star} className="text-gray-300 text-xl" />
                        ))}
                      </div>
                      <span className="text-gray-500">No ratings yet</span>
                    </div>
                  )}
                </div>
                
                {ratingData && ratingData.comment_count > 0 && (
                  <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
                    {getSentimentEmoji(ratingData.average_sentiment)} {ratingData.comment_count} comments
                  </div>
                )}
              </div>

              {/* Sentiment Analysis Display */}
              {ratingData && ratingData.comment_count > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    📊 Sentiment Analysis
                    <span className="text-2xl">{getSentimentEmoji(ratingData.average_sentiment)}</span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Overall Sentiment Score</span>
                        <span className="font-bold text-lg">{ratingData.average_sentiment.toFixed(1)}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-700 ${
                            ratingData.average_sentiment >= 7 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            ratingData.average_sentiment >= 5 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                            'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                          style={{ width: `${(ratingData.average_sentiment / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-800">{ratingData.rating_count}</div>
                        <div className="text-xs text-gray-600">Star Ratings</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-800">{ratingData.comment_count}</div>
                        <div className="text-xs text-gray-600">Comments</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-800">{ratingData.average_sentiment.toFixed(1)}</div>
                        <div className="text-xs text-gray-600">Sentiment</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price and Stock */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ${product.price.toFixed(2)}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${stockState.class}`}>
                Stock: {product.stock}
              </span>
            </div>

            {/* Add to Cart */}
            <button
              disabled={product.stock === 0}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                product.stock === 0
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              <FaShoppingCart />
              <span>
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </span>
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Reviews & Ratings</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingForm(!showRatingForm)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Rate Product
              </button>
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Comment
              </button>
            </div>
          </div>

          {/* Rating Form */}
          {showRatingForm && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <h3 className="text-lg font-semibold mb-3">Rate this product</h3>
              <form onSubmit={handleRatingSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={ratingForm.user_name}
                    onChange={(e) => setRatingForm({ ...ratingForm, user_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                        className="text-2xl"
                      >
                        {star <= ratingForm.rating ? (
                          <FaStar className="text-yellow-400" />
                        ) : (
                          <FaRegStar className="text-gray-300" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRatingForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Comment Form */}
          {showCommentForm && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold mb-3">Add a comment</h3>
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={commentForm.user_name}
                    onChange={(e) => setCommentForm({ ...commentForm, user_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    value={commentForm.comment}
                    onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Share your thoughts about this product..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Comment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCommentForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-xl border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{comment.user_name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {comment.sentiment_score && (
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full border">
                          <span className="font-semibold">{comment.sentiment_score.toFixed(1)}</span>/10
                        </div>
                        <span className="text-lg">
                          {getSentimentEmoji(comment.sentiment_score)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{comment.comment}</p>
                  
                  {/* Individual Comment Sentiment Bar */}
                  {comment.sentiment_score && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Comment Sentiment</span>
                        <span className="font-semibold">{comment.sentiment_score.toFixed(1)}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            comment.sentiment_score >= 7 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            comment.sentiment_score >= 5 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                            'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                          style={{ width: `${(comment.sentiment_score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(comment.id, 'up')}
                      className="flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <FaThumbsUp className="text-sm" />
                      <span className="text-sm">{comment.votes?.up || 0}</span>
                    </button>
                    <button
                      onClick={() => handleVote(comment.id, 'down')}
                      className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <FaThumbsDown className="text-sm" />
                      <span className="text-sm">{comment.votes?.down || 0}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
