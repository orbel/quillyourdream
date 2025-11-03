import { z } from "zod";

// Artwork Schema
export const artworkSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId
  id: z.number().optional(), // NeDB id field (numeric)
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  medium: z.string(),
  artform: z.string(),
  dateCreated: z.string(),
  width: z.number(),
  height: z.number(),
  depth: z.number().optional(),
  price: z.number().optional(),
  status: z.enum(["available", "sold", "exhibition", "private"]),
  category: z.enum(["original", "commission", "exhibition"]),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string(),
    isPrimary: z.boolean(),
  })),
  featured: z.boolean(),
});

export type Artwork = z.infer<typeof artworkSchema>;

// Insert schema for creating artworks (_id and id are auto-generated)
export const insertArtworkSchema = artworkSchema.omit({ _id: true, id: true });
export type InsertArtwork = z.infer<typeof insertArtworkSchema>;

// Collection Schema
export const collectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  artworkIds: z.array(z.string()),
  coverImage: z.string(),
});

export type Collection = z.infer<typeof collectionSchema>;

// Contact Form Schema
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  inquiryType: z.enum(["commission", "purchase", "exhibition", "press", "other"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactForm = z.infer<typeof contactFormSchema>;

// Artist Info Schema
export const artistInfoSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId
  id: z.number().optional(), // NeDB id field (numeric)
  name: z.string(),
  tagline: z.string(),
  bio: z.string(),
  location: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  social: z.object({
    instagram: z.string().optional(),
    etsy: z.string().optional(),
    website: z.string().optional(),
  }),
  profileImage: z.string(),
  exhibitions: z.array(z.object({
    year: z.string(),
    title: z.string(),
    location: z.string(),
  })),
});

export type ArtistInfo = z.infer<typeof artistInfoSchema>;

// Insert schema for artist info
export const insertArtistInfoSchema = artistInfoSchema.omit({ _id: true, id: true });
export type InsertArtistInfo = z.infer<typeof insertArtistInfoSchema>;

// FAQ Schema
export const faqSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId
  id: z.number().optional(), // NeDB id field (numeric)
  question: z.string(),
  answer: z.string(),
  category: z.string(),
  order: z.number().optional(),
});

export type FAQ = z.infer<typeof faqSchema>;

// Insert schema for FAQs
export const insertFaqSchema = faqSchema.omit({ _id: true, id: true });
export type InsertFaq = z.infer<typeof insertFaqSchema>;

// User Schema
export const userSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId
  id: z.number().optional(), // NeDB id field (numeric)
  email: z.string().email(),
  password: z.string(), // Hashed password
  role: z.enum(["user", "admin"]),
});

export type User = z.infer<typeof userSchema>;

// Insert schema for creating users
export const insertUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

// Update password schema
export const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;

// Site Settings Schema
export const siteSettingsSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId
  id: z.number().optional(), // NeDB id field (numeric)
  accentHue: z.number().min(0).max(360),
  accentSaturation: z.number().min(0).max(100),
  accentLightness: z.number().min(0).max(100),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
