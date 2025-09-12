import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import { MdPets } from "react-icons/md";
import { FaShoppingCart, FaStar, FaRegStar, FaFilter, FaTimes } from "react-icons/fa";

const ItemProductList = ({ category = '', searchTerm = '', onAddToCart }) => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productRatings, setProductRatings] = useState({});

  // Filter UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedOwners, setSelectedOwners] = useState(new Set());
  const [selectedBadges, setSelectedBadges] = useState(new Set());
  const [selectedRatingRanges, setSelectedRatingRanges] = useState(new Set());

  /* -------------------------------- products -------------------------------- */
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [category, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(buildApiUrl('/api/products'));
      let list = response.data || [];

      if (category) {
        list = list.filter(
          (p) => p.category && p.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        list = list.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        );
      }

      setProducts(list);
      await fetchProductRatings(list); // includes badge_label server-side
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err?.message || err);
      setProducts([]);
      setError('Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductRatings = async (productsList) => {
    try {
      const ratingPromises = productsList.map(async (product) => {
        try {
          const response = await axios.get(buildApiUrl(`/api/products/${product.id}/rating-stats`));
          return { productId: product.id, ratingData: response.data };
        } catch (error) {
          console.error(`Error fetching ratings for product ${product.id}:`, error);
          return { productId: product.id, ratingData: null };
        }
      });

      const ratingResults = await Promise.all(ratingPromises);
      const ratingsMap = {};
      ratingResults.forEach(({ productId, ratingData }) => {
        if (ratingData) ratingsMap[productId] = ratingData;
      });
      setProductRatings(ratingsMap);
    } catch (error) {
      console.error('Error fetching product ratings:', error);
    }
  };

  /* ----------------------------- helpers: sentiment ----------------------------- */
  const normalizeSentiment = (s) => {
    if (typeof s !== "number" || Number.isNaN(s)) return null;
    if (s >= -1 && s <= 1) return 5.5 + 4.5 * s; // legacy polarity
    if (s === 0) return 5.5;
    return Math.max(1, Math.min(10, s));
  };

  const calculateCombinedRating = (ratingData) => {
    if (!ratingData || ratingData.rating_count === 0) {
      return { stars: 0, displayRating: 0, hasRatings: false, avgSentiment: null };
    }
    const starRating = ratingData.average_rating;
    const s1to10 = normalizeSentiment(ratingData.average_sentiment);
    const polarity = typeof s1to10 === "number" ? (s1to10 - 5.5) / 4.5 : 0;
    const sentimentAdjustment = polarity * 0.5; // -0.5 .. +0.5
    const combinedRating = Math.max(0, Math.min(5, starRating + sentimentAdjustment));
    return {
      stars: Math.round(combinedRating * 2) / 2,
      displayRating: combinedRating,
      hasRatings: true,
      avgSentiment: s1to10
    };
  };

  const renderStars = (rating, size = "text-sm") => {
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

  /* ------------------------------- stock helpers ------------------------------- */
  const getMaxStock = (p) => {
    const candidates = [
      p?.max_stock, p?.initial_stock, p?.stock_capacity, p?.capacity,
      p?.original_stock, p?.inventory_limit, p?.stock_limit, p?.total_stock,
    ];
    const n = candidates.map((v) => Number(v)).find((v) => Number.isFinite(v) && v > 0);
    return n || null;
  };

  const getStockState = (p) => {
    const stock = Number(p?.stock) || 0;
    if (stock === 0) {
      return { key: "out", label: "Out of Stock",
        badgeClass: "bg-gradient-to-r from-gray-400 to-gray-500 text-white",
        pillClass: "text-sm text-white bg-gray-500", disableCart: true };
    }
    if (stock < 10) {
      return { key: "almost", label: "Almost Out of Stock",
        badgeClass: "bg-gradient-to-r from-red-500 to-red-600 text-white",
        pillClass: "text-sm text-red-700 bg-red-50 border border-red-200", disableCart: false };
    }
    const max = getMaxStock(p);
    if (max && stock <= max / 2) {
      return { key: "half", label: "In Stock",
        badgeClass: "bg-gradient-to-r from-amber-100 to-yellow-100 text-yellow-800",
        pillClass: "text-sm text-yellow-800 bg-amber-50 border border-amber-200", disableCart: false };
    }
    return { key: "ok", label: "In Stock",
      badgeClass: "bg-gradient-to-r from-green-100 to-green-200 text-green-800",
      pillClass: "text-sm text-green-800 bg-green-50 border border-green-200", disableCart: false };
  };

  const handleAddToCart = (product, e) => {
    e?.stopPropagation();
    const stockState = getStockState(product);
    if (stockState.disableCart) return;
    onAddToCart(product);
  };

  const openDetails = (product) => {
    navigate(`/products/${product.id}`, { state: { product } });
  };

  const safePrice = (p) => {
    const n = Number(p?.price);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  /* --------------------------- dynamic badge (fallback) -------------------------- */
  const computeBadge = (product, ratingData) => {
    if (ratingData?.badge_label) return ratingData.badge_label; // server label preferred
    const avgSent = normalizeSentiment(ratingData?.average_sentiment) ?? 0;
    const ratingCount = Number(ratingData?.rating_count) || 0;
    const createdAt = product?.created_at ? new Date(product.created_at) : null;
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    if (avgSent >= 8.0) return "Most Favourite";
    if (avgSent >= 6.5) return `Popular among ${product?.category || "pets"}`;
    if (avgSent >= 4.5) return "Try Me";
    if (ratingCount === 0 && createdAt && createdAt > twoWeeksAgo)
      return "Not rated / Recently added";
    return "Pet Favorite";
  };

  const ownerName = (p) =>
    p?.owner_name || p?.owner_display_name || p?.owner || (p?.owner_uid ? `User ${String(p.owner_uid).slice(-6)}` : "Owner");

  /* ---------------------------- filter option sets ---------------------------- */
  const allCategories = useMemo(() => {
    const s = new Set();
    products.forEach(p => { if (p.category) s.add(p.category); });
    return Array.from(s).sort((a,b)=>a.localeCompare(b));
  }, [products]);

  const allOwners = useMemo(() => {
    const s = new Set();
    products.forEach(p => s.add(ownerName(p)));
    return Array.from(s).sort((a,b)=>a.localeCompare(b));
  }, [products]);

  const allBadges = useMemo(() => {
    const s = new Set();
    products.forEach(p => {
      const label = computeBadge(p, productRatings[p.id]);
      if (label) s.add(label);
    });
    return Array.from(s).sort((a,b)=>a.localeCompare(b));
  }, [products, productRatings]);

  // Define rating ranges (label -> predicate)
  const RATING_BUCKETS = [
    { key: "no", label: "No ratings", test: (rd) => !rd || (rd.rating_count|0) === 0 },
    { key: "45_5", label: "4.5 – 5.0",  test: (rd) => rd && rd.rating_count > 0 && rd.average_rating >= 4.5 },
    { key: "4_449", label: "4.0 – 4.49", test: (rd) => rd && rd.rating_count > 0 && rd.average_rating >= 4.0 && rd.average_rating < 4.5 },
    { key: "3_399", label: "3.0 – 3.99", test: (rd) => rd && rd.rating_count > 0 && rd.average_rating >= 3.0 && rd.average_rating < 4.0 },
    { key: "0_299", label: "0 – 2.99",   test: (rd) => rd && rd.rating_count > 0 && rd.average_rating < 3.0 },
  ];

  /* ----------------------------- filtering logic ----------------------------- */
  const passesFilters = (p) => {
    const rd = productRatings[p.id];

    // Category
    if (selectedCategories.size > 0 && !selectedCategories.has(p.category)) return false;

    // Owner
    const o = ownerName(p);
    if (selectedOwners.size > 0 && !selectedOwners.has(o)) return false;

    // Badge
    const badge = computeBadge(p, rd);
    if (selectedBadges.size > 0 && !selectedBadges.has(badge)) return false;

    // Rating ranges (OR across selected buckets, AND with other filters)
    if (selectedRatingRanges.size > 0) {
      const anyMatch = RATING_BUCKETS
        .filter(b => selectedRatingRanges.has(b.key))
        .some(b => b.test(rd));
      if (!anyMatch) return false;
    }

    return true;
  };

  const filteredProducts = useMemo(
    () => products.filter(passesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, productRatings, selectedCategories, selectedOwners, selectedBadges, selectedRatingRanges]
  );

  const toggleInSet = (set, value, setter) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const clearAllFilters = () => {
    setSelectedCategories(new Set());
    setSelectedOwners(new Set());
    setSelectedBadges(new Set());
    setSelectedRatingRanges(new Set());
  };

  const activeFiltersCount =
    selectedCategories.size + selectedOwners.size + selectedBadges.size + selectedRatingRanges.size;

  /* ---------------------------------- UI ---------------------------------- */
  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading products...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-center text-red-500 bg-red-50 rounded-lg p-6 border border-red-200">
        <p className="text-lg font-semibold">{error}</p>
      </div>
    </div>
  );

  if (products.length === 0) return (
    <div className="flex justify-center items-center py-16">
      <div className="text-center text-gray-500 bg-gray-50 rounded-lg p-8 border border-gray-200">
        <MdPets className="text-6xl text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-semibold">No products found</p>
        <p className="text-sm mt-2">Upload something new to get started!</p>
      </div>
    </div>
  );

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-7xl">

        {/* --------------------------- Filters toolbar --------------------------- */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-2 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow text-sm font-medium hover:bg-gray-50"
            >
              <FaFilter />
              Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-800"
                title="Clear all filters"
              >
                <FaTimes /> Clear
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showFilters && (
            <div className="relative">
              <div className="absolute z-30 right-0 mt-2 w-[320px] sm:w-[560px] bg-white border border-gray-200 rounded-2xl shadow-2xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Categories */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Category</p>
                    <div className="max-h-40 overflow-auto pr-1 space-y-1">
                      {allCategories.map((c) => (
                        <label key={c} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedCategories.has(c)}
                            onChange={() => toggleInSet(selectedCategories, c, setSelectedCategories)}
                          />
                          <span className="truncate">{c}</span>
                        </label>
                      ))}
                      {allCategories.length === 0 && (
                        <p className="text-xs text-gray-400">No categories</p>
                      )}
                    </div>
                  </div>

                  {/* Owners */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Shop owner</p>
                    <div className="max-h-40 overflow-auto pr-1 space-y-1">
                      {allOwners.map((o) => (
                        <label key={o} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedOwners.has(o)}
                            onChange={() => toggleInSet(selectedOwners, o, setSelectedOwners)}
                          />
                          <span className="truncate">{o}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Badges */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Badge</p>
                    <div className="max-h-40 overflow-auto pr-1 space-y-1">
                      {allBadges.map((b) => (
                        <label key={b} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedBadges.has(b)}
                            onChange={() => toggleInSet(selectedBadges, b, setSelectedBadges)}
                          />
                          <span className="truncate">{b}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Ratings */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Ratings</p>
                    <div className="max-h-40 overflow-auto pr-1 space-y-1">
                      {RATING_BUCKETS.map((b) => (
                        <label key={b.key} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedRatingRanges.has(b.key)}
                            onChange={() => toggleInSet(selectedRatingRanges, b.key, setSelectedRatingRanges)}
                          />
                          <span className="truncate">{b.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------ Product grid ----------------------------- */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 p-4 sm:p-6 w-full max-w-none">
            {filteredProducts.map((product) => {
              const ratingData = productRatings[product.id];
              const combined = calculateCombinedRating(ratingData);
              const stockState = getStockState(product);
              const badgeText = computeBadge(product, ratingData);

              return (
                <article
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(product)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openDetails(product); }}
                  className="group relative bg-white/90 backdrop-blur-lg border border-white/30 rounded-3xl shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl mx-auto w-full min-w-[320px] max-w-[400px] cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-300"
                >
                  {/* Top-left Badge (dynamic) */}
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 z-20 transition-all duration-300 group-hover:scale-110 pointer-events-none">
                    <MdPets className="inline-block text-sm" />
                    <span className="hidden sm:inline">{badgeText}</span>
                    <span className="sm:hidden">🐾</span>
                  </div>

                  {/* Top-right Stock badge */}
                  <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg z-20 transition-all duration-300 group-hover:scale-110 pointer-events-none ${stockState.badgeClass}`}>
                    {stockState.label}
                  </div>

                  {/* Image */}
                  <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden mb-6 border shadow-md relative">
                    <img
                      src={product.image_url || "https://via.placeholder.com/600x400?text=Product"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <h3 className="text-black font-bold text-lg sm:text-xl truncate group-hover:text-purple-700 transition-colors duration-300">
                      {product.name}
                    </h3>

                    {product.category && (
                      <div>
                        <span className="inline-block text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200">
                          {product.category}
                        </span>
                      </div>
                    )}

                    <p className="text-black/80 text-sm leading-relaxed line-clamp-3 min-h-[3.75rem]">
                      {product.description || "No description provided."}
                    </p>

                    {/* Rating Display */}
                    <div className="py-2 px-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {ratingData && ratingData.rating_count > 0 ? (
                            <>
                              {renderStars(combined.stars, "text-base")}
                              <span className="text-sm font-semibold text-gray-700">
                                {combined.displayRating.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({ratingData.rating_count} {ratingData.rating_count === 1 ? 'rating' : 'ratings'})
                              </span>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaRegStar key={star} className="text-gray-300 text-base" />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">No ratings yet</span>
                            </div>
                          )}
                        </div>
                        
                        {ratingData && ratingData.rating_count > 0 && typeof combined.avgSentiment === "number" && (
                          <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full border">
                            <span className="font-semibold">{combined.avgSentiment.toFixed(1)}</span> {combined.avgSentiment >= 7 ? '😊' : combined.avgSentiment <= 4 ? '😞' : '😐'}
                          </div>
                        )}
                      </div>
                      
                      {/* Sentiment Score Bar */}
                      {ratingData && ratingData.rating_count > 0 && typeof combined.avgSentiment === "number" && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Sentiment Score</span>
                            <span className="font-semibold">{combined.avgSentiment.toFixed(1)}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                combined.avgSentiment >= 7 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                combined.avgSentiment >= 5 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                'bg-gradient-to-r from-red-400 to-red-500'
                              }`}
                              style={{ width: `${(combined.avgSentiment / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price and Stock */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ${safePrice(product)}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${getStockState(product).pillClass}`}>
                        Stock: {product.stock}
                      </span>
                    </div>

                    {/* Add to Cart */}
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={getStockState(product).disableCart}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 active:scale-95
                        ${getStockState(product).disableCart
                          ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                      title={
                        getStockState(product).disableCart
                          ? 'Out of Stock'
                          : 'Add to Cart'
                      }
                    >
                      <FaShoppingCart className="transition-transform duration-300" />
                      <span>
                        {getStockState(product).disableCart
                          ? 'Out of Stock'
                          : 'Add to Cart'}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Optional: empty state for filtered results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">
              No products match your selected filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemProductList;