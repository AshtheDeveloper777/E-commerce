import React, { useMemo } from 'react';
import { useCartStore } from '../store/useCartStore';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import ProductImage from './ProductImage';

export default function OrderSuccess({ customerData, onContinue }) {
  const {
    cart,
    promoCode,
    promoDiscount,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getShippingCost,
    getGrandTotal,
    clearCart
  } = useCartStore();

  const [copied, setCopied] = React.useState(false);

  // Memoize transaction values before clearing the cart state
  const orderSummary = useMemo(() => {
    return {
      orderId: `ORD-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentId: customerData.paymentId || `pay_mock_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      items: [...cart],
      promoCode,
      promoDiscount,
      subtotal: getSubtotal(),
      discount: getDiscountAmount(),
      tax: getTaxAmount(),
      shipping: getShippingCost(),
      total: getGrandTotal()
    };
  }, []); // Captures details on mount before clear

  const handleCopyPaymentId = () => {
    navigator.clipboard.writeText(orderSummary.paymentId);
    setCopied(true);
    useCartStore.getState().addToast('Payment ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinueShopping = () => {
    clearCart(); // Clear Zustand store
    onContinue(); // Return to shop view
  };

  return (
    <div className="success-card glass">
      <div className="success-icon-wrapper" style={{ boxShadow: '0 0 20px rgba(74,222,128,0.4)' }}>
        <CheckCircle2 size={48} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}>Payment Successful!</h2>
        <p style={{ color: 'var(--muted-foreground)', maxWidth: '480px', margin: '0 auto', fontSize: '0.95rem' }}>
          Thank you for your purchase, <strong style={{ color: 'var(--foreground)' }}>{customerData.fullName}</strong>! We've registered your transaction with Razorpay.
        </p>
      </div>

      {/* Invoice receipt container */}
      <div className="receipt-summary">
        <div className="receipt-header">
          <span>Official Receipt</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: 'normal' }}>
            ID: {orderSummary.orderId}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
          <div><strong>Date:</strong> {orderSummary.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <strong>Razorpay Payment ID:</strong>
            <code style={{ backgroundColor: 'var(--secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--primary)' }}>
              {orderSummary.paymentId}
            </code>
            <button 
              onClick={handleCopyPaymentId}
              style={{ background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center' }}
              title="Copy Payment ID"
              aria-label="Copy Payment ID"
            >
              {copied ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
            </button>
          </div>
          <div>
            <strong>Deliver To:</strong> {customerData.address}, {customerData.city}, {customerData.zipCode}, {customerData.country}
          </div>
          <div><strong>Contact Phone:</strong> +91 {customerData.phone}</div>
        </div>

        {/* Purchased items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 0', margin: '8px 0' }}>
          {orderSummary.items.map((item) => (
            <div key={item.id} className="receipt-item">
              <span style={{ color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <ProductImage
                  product={item}
                  style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                />
                <strong style={{ color: 'var(--foreground)' }}>{item.name}</strong> x{item.quantity}
              </span>
              <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>

        {/* Math Calculation Breakdowns in INR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="receipt-item" style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            <span>Subtotal</span>
            <span>₹{orderSummary.subtotal.toLocaleString('en-IN')}</span>
          </div>
          {orderSummary.discount > 0 && (
            <div className="receipt-item" style={{ fontSize: '0.85rem', color: 'var(--success)' }}>
              <span>Discount ({orderSummary.promoCode})</span>
              <span>-₹{orderSummary.discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="receipt-item" style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            <span>Sales CGST/SGST (8%)</span>
            <span>₹{orderSummary.tax.toLocaleString('en-IN')}</span>
          </div>
          <div className="receipt-item" style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            <span>Shipping Charge</span>
            <span>{orderSummary.shipping === 0 ? 'FREE' : `₹${orderSummary.shipping.toLocaleString('en-IN')}`}</span>
          </div>
          <div className="receipt-total">
            <span>Grand Total</span>
            <span style={{ color: 'var(--primary)' }}>₹{orderSummary.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '12px' }}>
        <button 
          className="btn btn-secondary" 
          style={{ flex: 1 }}
          onClick={() => window.print()}
        >
          Print Invoice
        </button>
        <button 
          className="btn btn-primary" 
          style={{ flex: 1 }}
          onClick={handleContinueShopping}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
