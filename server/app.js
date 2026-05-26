require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initPool, getPool } = require('./db');
const { isConfigured, getRazorpayInstance, verifyPaymentSignature } = require('./razorpay');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'SYNTH_JWT_SECRET_KEY_2026_SECURE_TOKEN';
const isVercel = Boolean(process.env.VERCEL);

const PRODUCT_IDS = [
  'prod_kbd_01', 'prod_aud_02', 'prod_acc_03', 'prod_light_04', 'prod_mous_05',
  'prod_aud_06', 'prod_chair_07', 'prod_mon_08', 'prod_stand_09', 'prod_bar_10',
];

const localProductImage = (id) => `/products/${id}.jpg`;
const productsImageDir = path.join(__dirname, '..', 'public', 'products');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve product images via API (reliable on Vercel; static /products/* can miss SPA routing)
app.get('/api/products/:id/image', (req, res) => {
  const filePath = path.join(productsImageDir, `${req.params.id}.jpg`);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(productsImageDir, 'placeholder.svg'), (err2) => {
        if (err2) res.status(404).json({ error: 'Image not found' });
      });
    }
  });
});

// Dynamic database schema initialization
const initializeDatabase = async () => {
  try {
    console.log('Verifying database schemas...');

    // Wrap schema queries in a 5-second timeout to prevent slow database hangs from blocking Vercel
    await Promise.race([
      (async () => {
        // 1. Users Table
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);

        // 2. Products Table
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL,
            price NUMERIC(10,2) NOT NULL,
            rating NUMERIC(3,2) NOT NULL,
            reviews_count INTEGER NOT NULL,
            description TEXT NOT NULL,
            tag VARCHAR(50),
            image TEXT NOT NULL,
            color VARCHAR(20) NOT NULL,
            stock INTEGER NOT NULL,
            specs TEXT[] NOT NULL
          );
        `);

        // 3. Orders Table
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(50) PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            payment_id VARCHAR(100) NOT NULL,
            amount NUMERIC(10,2) NOT NULL,
            address TEXT NOT NULL,
            phone VARCHAR(15) NOT NULL,
            items JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);

        console.log('Database tables verified successfully.');
        await seedProducts();
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Schema verification / seeding timed out (5s)')), 5000)
      )
    ]);
  } catch (err) {
    console.error('Error during database initialization:', err.message);
    console.warn('Falling back to MockPool due to schema verification timeout/error.');
    const { forceMockPool } = require('./db');
    forceMockPool();
    // Re-verify on MockPool to populate the in-memory arrays immediately
    await initializeDatabase();
  }
};

// Point all product rows at bundled local images (fixes broken Unsplash URLs in DB)
const syncProductImages = async () => {
  try {
    for (const id of PRODUCT_IDS) {
      await getPool().query('UPDATE products SET image = $1 WHERE id = $2', [
        localProductImage(id),
        id,
      ]);
    }
    console.log('Product images synced to local /products paths.');
  } catch (err) {
    console.error('Error syncing product images:', err.message);
  }
};

// Seed products list if empty
const seedProducts = async () => {
  try {
    const { rows } = await getPool().query('SELECT COUNT(*) FROM products');
    const count = parseInt(rows[0].count, 10);

    if (count > 0) {
      console.log('Database already populated with products.');
      return;
    }

    console.log('Seeding 10 premium tech catalog peripherals...');

    const productsToSeed = [
      {
        id: "prod_kbd_01",
        name: "Aether 75 Custom Keyboard",
        category: "Keyboards",
        price: 19999.00,
        rating: 4.9,
        reviews_count: 124,
        description: "Fully assembled gasket-mounted mechanical keyboard. Featuring custom lubed linear switches, premium dye-sub keycaps, and a solid CNC anodized aluminum case.",
        tag: "Best Seller",
        image: localProductImage("prod_kbd_01"),
        color: "purple",
        stock: 8,
        specs: [
          "75% Compact ANSI Layout",
          "Gasket Mounted Design",
          "Custom Lubed Linear Red Switches",
          "Hot-Swappable 5-Pin PCB",
          "CNC Anodized Aluminum Shell"
        ]
      },
      {
        id: "prod_aud_02",
        name: "Helix Studio Headphones",
        category: "Audio",
        price: 24999.00,
        rating: 4.8,
        reviews_count: 88,
        description: "High-fidelity open-back planar magnetic headphones. Extremely wide soundstage, precise transient response, and ultra-plush memory foam velour earpads.",
        tag: "Audiophile Choice",
        image: localProductImage("prod_aud_02"),
        color: "pink",
        stock: 4,
        specs: [
          "Open-Back Planar Magnetic",
          "10Hz - 50kHz Frequency Range",
          "32 Ohms Low Impedance",
          "Plush Memory Foam Velour Earpads",
          "Detachable Dual-Sided OCC Cable"
        ]
      },
      {
        id: "prod_acc_03",
        name: "Lumina RGB Desk Mat",
        category: "Accessories",
        price: 3599.00,
        rating: 4.7,
        reviews_count: 231,
        description: "Water-resistant, micro-textured weave desk pad. Outlined with addressable dual-zone RGB edge-lighting and a high-grip natural rubber base.",
        tag: "Setup Highlight",
        image: localProductImage("prod_acc_03"),
        color: "blue",
        stock: 12,
        specs: [
          "900mm x 400mm Large Coverage",
          "Water-Resistant Fabric Surface",
          "Addressable Dual-Zone RGB Borders",
          "Non-Slip Textured Rubber Base",
          "Detachable Braided USB-C Cable"
        ]
      },
      {
        id: "prod_light_04",
        name: "Spectra Ambient Smart Lamp",
        category: "Accessories",
        price: 6499.00,
        rating: 4.6,
        reviews_count: 65,
        description: "Interactive smart desk lamp with 16 million colors, custom developer programming integrations (REST API supported), and beautiful sound-reactive modes.",
        tag: "Smart Light",
        image: localProductImage("prod_light_04"),
        color: "amber",
        stock: 5,
        specs: [
          "16 Million Addressable Colors",
          "Developer API & REST Integrations",
          "Sound-Reactive Ambient Modes",
          "Adjustable Warm-to-Cool White",
          "Companion Desktop Controller App"
        ]
      },
      {
        id: "prod_mous_05",
        name: "Quantum Wireless Mouse",
        category: "Keyboards",
        price: 9599.00,
        rating: 4.9,
        reviews_count: 156,
        description: "Ultra-lightweight ergonomic gaming mouse. Features a 26K DPI optical sensor, custom responsive optical switches, and 120-hour uninterrupted battery life.",
        tag: "Performance Pro",
        image: localProductImage("prod_mous_05"),
        color: "cyan",
        stock: 7,
        specs: [
          "52g Ultra-Lightweight Build",
          "26,000 DPI Custom Optical Sensor",
          "Zero-Lag 2.4GHz Wireless Protocol",
          "Responsive 90M Click Optical Switches",
          "120 Hours Continuous Battery Life"
        ]
      },
      {
        id: "prod_aud_06",
        name: "Vortex USB Desk Microphone",
        category: "Audio",
        price: 12999.00,
        rating: 4.7,
        reviews_count: 42,
        description: "Professional studio-grade USB condenser microphone with zero-latency monitoring, hardware gain control, and built-in pop filter shock mount.",
        tag: "Streamer Setup",
        image: localProductImage("prod_aud_06"),
        color: "red",
        stock: 6,
        specs: [
          "Triple-Capsule Condenser Array",
          "Cardioid, Bidirectional, Omnidirectional",
          "24-Bit / 96kHz Studio Recording",
          "Zero-Latency 3.5mm Headphone Jack",
          "Hardware Gain Control & Mute Button"
        ]
      },
      {
        id: "prod_chair_07",
        name: "Apex Ergo Office Chair",
        category: "Accessories",
        price: 34999.00,
        rating: 4.8,
        reviews_count: 94,
        description: "Highly adjustable ergonomic office chair. Designed with elastic mesh support, synchronous tilt adjustments, dynamic auto-adjusting lumbar locks, and soft padded 3D armrests.",
        tag: "Premium Ergo",
        image: localProductImage("prod_chair_07"),
        color: "purple",
        stock: 3,
        specs: [
          "Breathable Mesh Back Support",
          "Synchronous Auto-Tilt Lock",
          "Adaptive Dynamic Lumbar Pillow",
          "3D Adjustable Height Armrests",
          "Heavy-Duty Reinforced Nylon Base"
        ]
      },
      {
        id: "prod_mon_08",
        name: "Horizon 34\" Curved Monitor",
        category: "Accessories",
        price: 54999.00,
        rating: 4.9,
        reviews_count: 73,
        description: "34-inch curved ultrawide desktop monitor. Sports a crisp WQHD (3440 x 1440) resolution, vibrant IPS panel, smooth 144Hz refresh rate, and 90W USB-C hub connectivity.",
        tag: "Ultrawide Hub",
        image: localProductImage("prod_mon_08"),
        color: "blue",
        stock: 2,
        specs: [
          "34-inch 21:9 Curved IPS Screen",
          "WQHD 3440 x 1440 Crystal Resolution",
          "144Hz Fluid Refresh Gaming Rate",
          "Integrated 90W USB-C Docking Port",
          "HDR400 Certified Vivid Display"
        ]
      },
      {
        id: "prod_stand_09",
        name: "Solace Walnut Monitor Riser",
        category: "Accessories",
        price: 4999.00,
        rating: 4.7,
        reviews_count: 112,
        description: "Crafted solid american walnut wooden desk riser. Elevates monitor to ergonomic eye level, clearing underneath space for clean setup cable storage.",
        tag: "Premium Walnut",
        image: localProductImage("prod_stand_09"),
        color: "amber",
        stock: 10,
        specs: [
          "100% Solid Premium American Walnut",
          "Comfortable Ergonomic Elevating Lift",
          "Powder-Coated Sleek Steel Legs",
          "Non-Slip Cushioned Rubber Shoes",
          "Max Weight Capacity up to 45kg"
        ]
      },
      {
        id: "prod_bar_10",
        name: "Aura LED Monitor Lightbar",
        category: "Accessories",
        price: 5999.00,
        rating: 4.8,
        reviews_count: 145,
        description: "Sleek monitor lightbar that clamps atop screens. Illuminates desks without creating screen glare, featuring smart touch dimming and temperature color controls.",
        tag: "Smart Lamp",
        image: localProductImage("prod_bar_10"),
        color: "cyan",
        stock: 8,
        specs: [
          "Asymmetric Desk Illumination Design",
          "Eliminates Screen Glare completely",
          "Stepless Color Temperature controls",
          "Smart Auto-Dimming Brightness sensor",
          "Convenient USB-Powered clamping arm"
        ]
      }
    ];

    for (const p of productsToSeed) {
      await getPool().query(
        `INSERT INTO products (id, name, category, price, rating, reviews_count, description, tag, image, color, stock, specs) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [p.id, p.name, p.category, p.price, p.rating, p.reviews_count, p.description, p.tag, p.image, p.color, p.stock, p.specs]
      );
    }

    console.log('Seeded 10 premium products successfully.');
    await syncProductImages();
  } catch (err) {
    console.error('Error during product seeding:', err.message);
  }
};

// Authentication Middleware to secure checkout/orders
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid or expired.' });
    }
    req.user = user;
    next();
  });
};

app.get('/api/health', async (req, res) => {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  try {
    await getPool().query('SELECT 1');
    res.json({
      ok: true,
      database: 'connected',
      databaseUrlConfigured: hasDatabaseUrl,
      razorpay: isConfigured(),
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      databaseUrlConfigured: hasDatabaseUrl,
      error: err.message,
      hint: !hasDatabaseUrl
        ? 'Add DATABASE_URL in Vercel → Settings → Environment Variables (Supabase pooler URI, port 6543).'
        : undefined,
    });
  }
});

// Create Razorpay order (server-side — keeps secret key off the client)
app.post('/api/razorpay/order', authenticateToken, async (req, res) => {
  const { amount, receipt } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount.' });
  }

  if (!isConfigured()) {
    return res.status(503).json({
      error: 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
    });
  }

  try {
    const instance = getRazorpayInstance();
    const order = await instance.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order error:', err.message);
    res.status(500).json({ error: 'Could not create Razorpay order.' });
  }
});

// --- AUTHENTICATION ENDPOINTS ---

// REGISTER API
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Please enter all details.' });
  }

  try {
    // Check if user already exists
    const checkUser = await getPool().query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await getPool().query(
      'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email',
      [fullName, email, passwordHash]
    );

    const user = newUser.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ error: 'Database error occurred during registration.' });
  }
});

// LOGIN API
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter email and password.' });
  }

  try {
    const { rows } = await getPool().query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Incorrect email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Database error occurred during login.' });
  }
});

// --- PRODUCT CATALOG ENDPOINTS ---

// GET CATALOG PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await getPool().query('SELECT * FROM products ORDER BY name ASC');
    
    // Format numeric values cleanly
    const formattedProducts = rows.map((p) => ({
      ...p,
      price: parseFloat(p.price),
      rating: parseFloat(p.rating),
      reviewsCount: p.reviews_count,
      image: localProductImage(p.id),
    }));

    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch products error:', err.message);
    res.status(500).json({ error: 'Could not fetch catalog products.' });
  }
});

// --- SECURED ORDERS ENDPOINTS ---

// CREATE NEW ORDER (VERIFIES STOCK, DECREMENTS STOCK, WRITES ORDER)
app.post('/api/orders', authenticateToken, async (req, res) => {
  const {
    id,
    paymentId,
    razorpayOrderId,
    razorpaySignature,
    amount,
    address,
    phone,
    items,
  } = req.body;
  const userId = req.user.id;

  if (!id || !paymentId || !amount || !address || !phone || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid order payload details.' });
  }

  if (isConfigured()) {
    if (!razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ error: 'Payment verification data is missing.' });
    }
    const valid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId,
      signature: razorpaySignature,
    });
    if (!valid) {
      return res.status(400).json({ error: 'Payment verification failed. Order not saved.' });
    }
  }

  try {
    // 1. Transaction Block: Verify Stock first
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      for (const item of items) {
        const { rows } = await client.query('SELECT stock, name FROM products WHERE id = $1 FOR UPDATE', [item.id]);
        if (rows.length === 0) {
          throw new Error(`Product "${item.name}" not found in database.`);
        }
        
        const availableStock = rows[0].stock;
        if (availableStock < item.quantity) {
          throw new Error(`Insufficient stock for "${item.name}". Only ${availableStock} left in database, you requested ${item.quantity}.`);
        }
      }

      // 2. All stocks valid! Proceed to decrement stock
      for (const item of items) {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
      }

      // 3. Write Order receipt
      await client.query(
        `INSERT INTO orders (id, user_id, payment_id, amount, address, phone, items) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, userId, paymentId, amount, address, phone, JSON.stringify(items)]
      );

      await client.query('COMMIT');
      res.status(201).json({ success: true, orderId: id, paymentId });
    } catch (transactionErr) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: transactionErr.message });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Order checkout error:', err.message);
    res.status(500).json({ error: 'Server database error during order placement.' });
  }
});

// Local dev only — Vercel serves /products and SPA from dist
if (!isVercel) {
  app.use('/products', express.static(path.join(__dirname, '..', 'public', 'products')));

  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

async function initialize() {
  await initPool();
  await initializeDatabase();
}

module.exports = { app, initialize };
