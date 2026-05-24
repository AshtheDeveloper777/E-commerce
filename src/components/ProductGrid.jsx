import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCartStore } from '../store/useCartStore';
import ProductCard from './ProductCard';
import { Search, Info, Loader2, Sparkles } from 'lucide-react';

export default function ProductGrid({ onCardClick }) {
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch('/api/products');
      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        throw new Error('API returned invalid response. Check server / DATABASE_URL on Vercel.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to load products (${response.status})`);
      }

      if (!Array.isArray(data)) {
        throw new Error('Invalid product data from server.');
      }

      setProductsList(data);

      const liveStocks = data.reduce((acc, p) => {
        acc[p.id] = p.stock;
        return acc;
      }, {});

      useCartStore.setState({ stocks: liveStocks });
    } catch (err) {
      console.error('Error fetching database products:', err);
      setFetchError(err.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = ["All", "Keyboards", "Audio", "Accessories"];

  // Filter and sort products using useMemo for maximum performance
  const filteredProducts = useMemo(() => {
    let result = [...productsList];

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (category !== 'All') {
      result = result.filter((p) => p.category === category);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [productsList, search, category, sortBy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search and Filters panel */}
      <div className="filters-bar glass">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search premium workspace hardware..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-groups">
          {/* Category Pill Selectors */}
          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
            aria-label="Filter by category"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            disabled={loading}
            aria-label="Sort products"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        // Premium Skeleton Loader grid
        <div className="products-grid">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="product-card glass"
              style={{ 
                height: '420px', 
                animation: 'float 2s ease-in-out infinite', 
                opacity: 0.6,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '20px'
              }}
            >
              <div style={{ width: '100%', height: '180px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--secondary)' }} />
              <div style={{ width: '60%', height: '20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--secondary)' }} />
              <div style={{ width: '40%', height: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--secondary)' }} />
              <div style={{ width: '90%', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--secondary)', marginTop: '8px' }} />
              <div style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--secondary)', marginTop: 'auto' }} />
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div
          className="glass"
          style={{
            padding: '48px',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            color: 'var(--destructive)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Info size={36} />
          <h3>Could not load products</h3>
          <p style={{ color: 'var(--muted-foreground)', maxWidth: '420px' }}>{fetchError}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchProducts}
          >
            Retry
          </button>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onCardClick={onCardClick} />
          ))}
        </div>
      ) : (
        <div 
          className="glass" 
          style={{ 
            padding: '48px', 
            borderRadius: 'var(--radius-lg)', 
            textAlign: 'center',
            color: 'var(--muted-foreground)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Info size={36} style={{ color: 'var(--primary)' }} />
          <h3>No products match your filters</h3>
          <p>Try refining your search query or choosing another category.</p>
        </div>
      )}
    </div>
  );
}
