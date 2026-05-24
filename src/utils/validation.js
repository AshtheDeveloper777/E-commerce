import { z } from 'zod';

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(3, 'Full name must be at least 3 characters')
    .max(50, 'Full name must be under 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number (starts with 6-9)'),
  
  address: z
    .string()
    .min(1, 'Address is required')
    .min(10, 'Address must be at least 10 characters long to ensure delivery'),
  
  city: z
    .string()
    .min(1, 'City is required')
    .min(2, 'City name must be at least 2 characters'),
  
  zipCode: z
    .string()
    .min(1, 'Postal / Zip code is required')
    .regex(/^[a-zA-Z0-9\s-]{3,10}$/, 'Invalid postal code format (3-10 alphanumeric characters)'),
  
  country: z
    .string()
    .min(1, 'Please select a country'),
  
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .transform((val) => val.replace(/\s+/g, '')) // Strip whitespace
    .refine((val) => /^\d{16}$/.test(val), {
      message: 'Card number must be exactly 16 digits'
    }),
  
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be in MM/YY format')
    .refine((val) => {
      const [monthStr, yearStr] = val.split('/');
      const month = parseInt(monthStr, 10);
      const year = 2000 + parseInt(yearStr, 10);
      
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 0-indexed
      const currentYear = now.getFullYear();
      
      if (year < currentYear) return false;
      if (year === currentYear && month < currentMonth) return false;
      return true;
    }, {
      message: 'Card is expired or invalid expiry date'
    }),
  
  cvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits')
});
