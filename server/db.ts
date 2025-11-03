import mongoose from 'mongoose';
import { initNeDB, getNeDBStores, isNeDBReady, NeDBModel } from './nedb';

// Database mode tracking
let usingNeDB = false;

// MongoDB connection URI (only used if USE_NEDB=false)
export let MONGODB_URI: string;
if (process.env.MONGODB_URI) {
  MONGODB_URI = process.env.MONGODB_URI;
} else {
  const dbUrl = process.env.DATABASE_URL || '';
  // Check if DATABASE_URL is MongoDB or PostgreSQL
  if (dbUrl.startsWith('mongodb://') || dbUrl.startsWith('mongodb+srv://')) {
    MONGODB_URI = dbUrl;
  } else {
    // Default to local MongoDB
    MONGODB_URI = 'mongodb://localhost:27017/quillyourdream';
  }
}

export async function connectDB() {
  // Default to NeDB when USE_NEDB is not set or set to any value other than 'false'
  // USE_NEDB not set (no .env file) → uses NeDB
  // USE_NEDB='true' → uses NeDB
  // USE_NEDB='false' → uses MongoDB
  const useMongoDB = process.env.USE_NEDB === 'false';
  
  if (!useMongoDB) {
    // Use NeDB database service (default)
    console.log('📌 Using NeDB database service (default)');
    try {
      await initNeDB();
      usingNeDB = true;
      return;
    } catch (nedbError: any) {
      console.error('❌ NeDB database service initialization error:', nedbError.message);
      throw nedbError;
    }
  }

  // Try MongoDB database service
  console.log('📌 Attempting MongoDB database service connection...');
  try {
    // Set shorter timeout for connection attempt
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    console.log('✅ Connected to MongoDB database service:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
    usingNeDB = false;
  } catch (error: any) {
    console.error('❌ MongoDB database service connection error:', error.message);
    console.warn('⚠️  Switching to NeDB database service...');
    
    // Initialize NeDB database service
    try {
      await initNeDB();
      usingNeDB = true;
    } catch (nedbError: any) {
      console.error('❌ NeDB database service initialization error:', nedbError.message);
      console.warn('⚠️  Application will continue with limited functionality.');
    }
  }
}

// Helper to check if MongoDB is currently connected
// Uses mongoose.connection.readyState for real-time status
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
export function isMongoDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// Helper to check if using NeDB database service
export function isUsingNeDB(): boolean {
  return usingNeDB;
}

// Helper to check if MongoDB is connected, throws if not
export function checkMongoConnection(): void {
  if (!isMongoDBConnected()) {
    throw new Error('MongoDB is not connected. Please ensure MongoDB is running.');
  }
}

// Artwork Schema
const artworkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  medium: { type: String, required: true },
  artform: { type: String, required: true },
  dateCreated: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  depth: { type: Number },
  price: { type: Number },
  status: { 
    type: String, 
    enum: ['available', 'sold', 'exhibition', 'private'],
    default: 'available' 
  },
  category: { 
    type: String, 
    enum: ['original', 'commission', 'exhibition'],
    required: true 
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true },
    isPrimary: { type: Boolean, default: false }
  }],
  featured: { type: Boolean, default: false },
}, { timestamps: true });

const ArtworkMongoose = mongoose.model('Artwork', artworkSchema);

// Artist Info Schema
const artistInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tagline: { type: String, required: true },
  bio: { type: String, required: true },
  location: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  social: {
    instagram: String,
    etsy: String,
    website: String,
  },
  profileImage: String,
  exhibitions: [{
    year: String,
    title: String,
    location: String,
  }],
}, { timestamps: true });

const ArtistInfoMongoose = mongoose.model('ArtistInfo', artistInfoSchema);

// FAQ Schema
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, unique: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const FAQMongoose = mongoose.model('FAQ', faqSchema);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'admin'],
    default: 'user' 
  },
}, { timestamps: true });

const UserMongoose = mongoose.model('User', userSchema);

// Site Settings Schema
const siteSettingsSchema = new mongoose.Schema({
  accentHue: { type: Number, default: 186, min: 0, max: 360 },
  accentSaturation: { type: Number, default: 68, min: 0, max: 100 },
  accentLightness: { type: Number, default: 45, min: 0, max: 100 },
}, { timestamps: true });

const SiteSettingsMongoose = mongoose.model('SiteSettings', siteSettingsSchema);

// Dynamic model getters - return NeDB models if using fallback, otherwise Mongoose
export const Artwork = new Proxy({} as any, {
  get(_, prop) {
    if (usingNeDB) {
      const stores = getNeDBStores();
      return new NeDBModel(stores.artworks)[prop as keyof NeDBModel<any>];
    }
    return (ArtworkMongoose as any)[prop];
  }
});

export const ArtistInfo = new Proxy({} as any, {
  get(_, prop) {
    if (usingNeDB) {
      const stores = getNeDBStores();
      return new NeDBModel(stores.artist)[prop as keyof NeDBModel<any>];
    }
    return (ArtistInfoMongoose as any)[prop];
  }
});

export const FAQ = new Proxy({} as any, {
  get(_, prop) {
    if (usingNeDB) {
      const stores = getNeDBStores();
      return new NeDBModel(stores.faqs)[prop as keyof NeDBModel<any>];
    }
    return (FAQMongoose as any)[prop];
  }
});

export const User = new Proxy({} as any, {
  get(_, prop) {
    if (usingNeDB) {
      const stores = getNeDBStores();
      return new NeDBModel(stores.users)[prop as keyof NeDBModel<any>];
    }
    return (UserMongoose as any)[prop];
  }
});

export const SiteSettings = new Proxy({} as any, {
  get(_, prop) {
    if (usingNeDB) {
      const stores = getNeDBStores();
      return new NeDBModel(stores.settings)[prop as keyof NeDBModel<any>];
    }
    return (SiteSettingsMongoose as any)[prop];
  }
});

// Export connection
export { mongoose };
