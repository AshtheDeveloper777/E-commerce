import { create } from 'zustand';
import { products } from '../data/products';

export const useCartStore = create((set, get) => ({
  cart: [],
  wishlist: [],
  toasts: [],
  promoCode: null,
  promoDiscount: 0,
  
  // Initialize stocks dynamically from products mock data
  stocks: products.reduce((acc, p) => {
    acc[p.id] = p.stock;
    return acc;
  }, {}),

  // Toast actions
  addToast: (message) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    set((state) => ({
      toasts: [...state.toasts, { id, message }]
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  // Cart actions
  addProduct: (product) => {
    const availableStock = get().stocks[product.id] ?? 0;
    const existingItem = get().cart.find((item) => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity >= availableStock) {
      get().addToast(`Cannot add. Only ${availableStock} items of "${product.name}" are in stock!`);
      return;
    }

    set((state) => {
      let updatedCart;
      if (existingItem) {
        updatedCart = state.cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [...state.cart, { ...product, quantity: 1 }];
      }

      return { cart: updatedCart };
    });
    get().addToast(`Added "${product.name}" to cart!`);
  },

  removeProduct: (productId) => {
    const item = get().cart.find((i) => i.id === productId);
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId)
    }));
    if (item) {
      get().addToast(`Removed "${item.name}" from cart.`);
    }
  },

  updateQuantity: (productId, quantity) => {
    const availableStock = get().stocks[productId] ?? 0;
    const clampedQuantity = Math.max(1, Math.min(quantity, availableStock));

    if (quantity > availableStock) {
      get().addToast(`Only ${availableStock} items are available in stock!`);
    }

    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity: clampedQuantity } : item
      )
    }));
  },

  clearCart: () => {
    set({ cart: [], promoCode: null, promoDiscount: 0 });
  },

  // Stock management actions
  decrementStocks: () => {
    set((state) => {
      const updatedStocks = { ...state.stocks };
      state.cart.forEach((item) => {
        if (updatedStocks[item.id] !== undefined) {
          updatedStocks[item.id] = Math.max(0, updatedStocks[item.id] - item.quantity);
        }
      });
      return { stocks: updatedStocks };
    });
  },

  // Wishlist actions
  toggleWishlist: (product) => {
    const isFavorited = get().wishlist.some((item) => item.id === product.id);
    
    set((state) => {
      if (isFavorited) {
        return {
          wishlist: state.wishlist.filter((item) => item.id !== product.id)
        };
      } else {
        return {
          wishlist: [...state.wishlist, product]
        };
      }
    });

    get().addToast(
      isFavorited 
        ? `Removed "${product.name}" from wishlist.` 
        : `Added "${product.name}" to wishlist! ❤️`
    );
  },

  // Promo code actions (INR localized terms)
  applyPromoCode: (code) => {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode === 'EPICDEAL') {
      set({ promoCode: 'EPICDEAL', promoDiscount: 0.15 });
      get().addToast('Promo code "EPICDEAL" applied (15% OFF)!');
      return true;
    } else if (normalizedCode === 'DEVPOWER') {
      set({ promoCode: 'DEVPOWER', promoDiscount: 0.20 });
      get().addToast('Promo code "DEVPOWER" applied (20% OFF)!');
      return true;
    } else {
      get().addToast('Invalid promo code.');
      return false;
    }
  },

  removePromoCode: () => {
    set({ promoCode: null, promoDiscount: 0 });
    get().addToast('Promo code removed.');
  },

  // Computed state getters (INR-optimized math values)
  getTotalItems: () => {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getDiscountAmount: () => {
    return get().getSubtotal() * get().promoDiscount;
  },

  getTaxAmount: () => {
    // 8% CGST + SGST local tax rate
    return (get().getSubtotal() - get().getDiscountAmount()) * 0.08;
  },

  getShippingCost: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    // Free shipping over ₹10,000, otherwise flat ₹500
    return subtotal > 10000 ? 0 : 500.00;
  },

  getGrandTotal: () => {
    const finalSubtotal = get().getSubtotal() - get().getDiscountAmount();
    if (finalSubtotal <= 0) return 0;
    return finalSubtotal + get().getTaxAmount() + get().getShippingCost();
  }
}));
