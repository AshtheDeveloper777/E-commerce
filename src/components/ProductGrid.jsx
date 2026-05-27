import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { Search, Info } from 'lucide-react';
import { categories, products } from '../data/products';

export default function ProductGrid({ onCardClick }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  const productsList = products;

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
          />
        </div>

        <div className="filter-groups">
          {/* Category Pill Selectors */}
          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
      {filteredProducts.length > 0 ? (
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
