import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { contactFormSchema, insertUserSchema, updatePasswordSchema, insertArtworkSchema } from "@shared/schema";
import { connectDB, Artwork, ArtistInfo, FAQ, SiteSettings, User, isUsingNeDB } from "./db";
import { setupAuth, isAuthenticated, isAdmin, hashPassword, verifyPassword } from "./auth";
import { triggerRebuild, getRebuildStatus } from "./rebuild";
import multer from "multer";
import sharp from "sharp";
import { join } from "path";
import { mkdir } from "fs/promises";
import { randomUUID } from "crypto";

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Simple hash function to convert string to stable numeric ID
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Helper function to normalize database documents for frontend compatibility
// Ensures id field is always a number as expected by frontend
function normalizeId(doc: any): any {
  if (!doc) return doc;
  
  const obj = doc.toObject ? doc.toObject() : doc;
  
  if (isUsingNeDB()) {
    // NeDB: ensure numeric id exists by hashing _id
    if (!obj.id && obj._id) {
      obj.id = hashStringToNumber(obj._id);
    } else if (obj.id && typeof obj.id === 'string') {
      // Legacy: convert string id to number
      obj.id = parseInt(obj.id, 10);
    }
  } else {
    // MongoDB: hash ObjectId to create numeric id for frontend
    if (obj._id && !obj.id) {
      const idStr = obj._id.toString();
      obj.id = hashStringToNumber(idStr);
    }
  }
  
  return obj;
}

// Helper to normalize arrays of documents
function normalizeIds(docs: any[]): any[] {
  return docs.map(normalizeId);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await connectDB();
  
  // Setup authentication
  await setupAuth(app);

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      await Artwork.find().limit(1);
      res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({ status: 'unhealthy', error: 'Database connection failed' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update password for current user
  app.patch('/api/auth/password', isAuthenticated, async (req: any, res) => {
    try {
      const validation = updatePasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { currentPassword, newPassword } = validation.data;
      
      console.log('Password update - User from session:', JSON.stringify(req.user));
      console.log('Password update - Using NeDB?', isUsingNeDB());
      
      // Find user with password field
      const query = isUsingNeDB() 
        ? { email: req.user.email }  // Use email for lookup
        : { _id: req.user._id };
      
      console.log('Password update - Query:', JSON.stringify(query));
      const userWithPassword = await User.findOne(query);
      
      console.log('Password update - Found user?', userWithPassword ? 'yes' : 'no');
      if (!userWithPassword) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValid = verifyPassword(currentPassword, userWithPassword.password);
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Update password
      const hashedPassword = hashPassword(newPassword);
      if (isUsingNeDB()) {
        await User.updateOne({ email: req.user.email }, { $set: { password: hashedPassword } });
      } else {
        await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });
      }

      console.log('Password updated successfully for', req.user.email);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // User management routes (admin only)
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await User.find().sort({ email: 1 });
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const userObj = user.toObject ? user.toObject() : user;
        const { password, ...userWithoutPassword } = userObj;
        return normalizeId(userWithoutPassword);
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { email, password, role } = validation.data;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Hash password and create user
      const hashedPassword = hashPassword(password);
      const user = await User.create({ email, password: hashedPassword, role });

      // Remove password from response
      const userObj = user.toObject ? user.toObject() : user;
      const { password: _, ...userWithoutPassword } = userObj;
      res.status(201).json(normalizeId(userWithoutPassword));
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete('/api/admin/users/:id', isAdmin, async (req: any, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      
      if (isNaN(targetId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      if (isUsingNeDB()) {
        // NeDB: Find user by _id that hashes to the target numeric id
        const allUsers = await User.find();
        const targetUser = allUsers.find(u => {
          const userId = hashStringToNumber(u._id);
          return userId === targetId;
        });
        
        if (!targetUser) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Prevent deleting yourself
        if (targetUser.email === req.user.email) {
          return res.status(400).json({ error: "Cannot delete your own account" });
        }
        
        await User.deleteOne({ _id: targetUser._id });
      } else {
        // MongoDB: search by numeric hash
        const allUsers = await User.find();
        const targetUser = allUsers.find(u => {
          const userId = hashStringToNumber(u._id.toString());
          return userId === targetId;
        });
        
        if (!targetUser) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Prevent deleting yourself
        if (targetUser._id.toString() === req.user._id.toString()) {
          return res.status(400).json({ error: "Cannot delete your own account" });
        }
        
        await User.findByIdAndDelete(targetUser._id);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Get all artworks
  app.get("/api/artworks", async (req, res) => {
    try {
      const allArtworks = await Artwork.find().sort({ createdAt: -1 });
      res.json(normalizeIds(allArtworks));
    } catch (error) {
      console.error("Error reading artworks:", error);
      res.status(500).json({ error: "Failed to load artworks" });
    }
  });

  // Get featured artworks
  app.get("/api/artworks/featured", async (req, res) => {
    try {
      const featured = await Artwork.find({ featured: true }).sort({ createdAt: -1 });
      res.json(normalizeIds(featured));
    } catch (error) {
      console.error("Error reading featured artworks:", error);
      res.status(500).json({ error: "Failed to load featured artworks" });
    }
  });

  // Get artwork by slug
  app.get("/api/artworks/:slug", async (req, res) => {
    try {
      const artwork = await Artwork.findOne({ slug: req.params.slug });
      
      if (!artwork) {
        return res.status(404).json({ error: "Artwork not found" });
      }
      
      res.json(normalizeId(artwork));
    } catch (error) {
      console.error("Error reading artwork:", error);
      res.status(500).json({ error: "Failed to load artwork" });
    }
  });

  // Get related artworks
  app.get("/api/artworks/related/:slug", async (req, res) => {
    try {
      const currentArtwork = await Artwork.findOne({ slug: req.params.slug });
      
      if (!currentArtwork) {
        return res.json([]);
      }
      
      const related = await Artwork.find({ 
        category: currentArtwork.category,
        slug: { $ne: req.params.slug }
      }).limit(3);
      
      res.json(normalizeIds(related));
    } catch (error) {
      console.error("Error reading related artworks:", error);
      res.status(500).json({ error: "Failed to load related artworks" });
    }
  });

  // Get artist information
  app.get("/api/artist", async (req, res) => {
    try {
      const artist = await ArtistInfo.findOne();
      res.json(normalizeId(artist) || null);
    } catch (error) {
      console.error("Error reading artist info:", error);
      res.status(500).json({ error: "Failed to load artist information" });
    }
  });

  // Get FAQs
  app.get("/api/faqs", async (req, res) => {
    try {
      const allFaqs = await FAQ.find().sort({ order: 1 });
      res.json(normalizeIds(allFaqs));
    } catch (error) {
      console.error("Error reading FAQs:", error);
      res.status(500).json({ error: "Failed to load FAQs" });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = contactFormSchema.parse(req.body);
      console.log("Contact form submission:", validatedData);
      
      res.json({ 
        success: true, 
        message: "Your message has been received. We'll get back to you soon!" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to process contact form" });
    }
  });

  // Admin routes - Create artwork
  app.post("/api/admin/artworks", isAdmin, async (req, res) => {
    try {
      console.log("[CREATE ARTWORK] Request body:", JSON.stringify(req.body));
      
      // Validate request body with Zod
      const validation = insertArtworkSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("[CREATE ARTWORK] Validation error:", validation.error.errors);
        return res.status(400).json({ 
          error: "Validation error", 
          details: validation.error.errors,
          message: validation.error.errors[0]?.message || "Invalid artwork data"
        });
      }

      // Create the artwork
      const artwork = await Artwork.create(validation.data);
      
      // For NeDB, we need to add the numeric id field to the database
      if (isUsingNeDB() && artwork._id && !artwork.id) {
        const numericId = hashStringToNumber(artwork._id);
        await Artwork.updateOne({ _id: artwork._id }, { ...artwork, id: numericId });
        // Fetch the updated artwork
        const updatedArtwork = await Artwork.findOne({ _id: artwork._id });
        console.log("[CREATE ARTWORK] Success:", JSON.stringify(updatedArtwork));
        res.status(201).json(normalizeId(updatedArtwork));
      } else {
        console.log("[CREATE ARTWORK] Success:", JSON.stringify(normalizeId(artwork)));
        res.status(201).json(normalizeId(artwork));
      }
    } catch (error) {
      console.error("[CREATE ARTWORK] Error creating artwork:", error);
      res.status(500).json({ error: "Failed to create artwork" });
    }
  });

  // Update artwork
  app.patch("/api/admin/artworks/:id", isAdmin, async (req, res) => {
    try {
      console.log("[UPDATE ARTWORK] ID:", req.params.id, "Body:", JSON.stringify(req.body));
      
      if (isUsingNeDB()) {
        // NeDB: query by 'id' field (convert string param to number)
        const numericId = parseInt(req.params.id, 10);
        const existingArtwork = await Artwork.findOne({ id: numericId });
        
        if (!existingArtwork) {
          return res.status(404).json({ error: "Artwork not found" });
        }

        console.log("[UPDATE ARTWORK] Existing:", JSON.stringify(existingArtwork));
        
        // Update using id field
        // NeDB returns plain objects, no need for toObject()
        const existingData = existingArtwork.toObject ? existingArtwork.toObject() : existingArtwork;
        const updateData = { ...existingData, ...req.body };
        console.log("[UPDATE ARTWORK] Update data:", JSON.stringify(updateData));
        
        await Artwork.updateOne({ id: numericId }, updateData);
        
        // Fetch updated artwork
        const artwork = await Artwork.findOne({ id: numericId });
        console.log("[UPDATE ARTWORK] After update:", JSON.stringify(artwork));
        
        res.json(normalizeId(artwork));
      } else {
        // MongoDB: Frontend sends numeric hash, but we need ObjectId
        // Try to find by the original _id sent in request body, fallback to searching all
        let artwork;
        
        // If request body contains _id, use that (most reliable)
        if (req.body._id) {
          artwork = await Artwork.findByIdAndUpdate(
            req.body._id,
            req.body,
            { new: true, runValidators: true }
          );
        } else {
          // Fallback: find by numeric ID hash and update
          // This requires searching all documents (less efficient but works)
          const numericId = parseInt(req.params.id, 10);
          const allArtworks = await Artwork.find();
          const targetArtwork = allArtworks.find(art => {
            const artId = hashStringToNumber(art._id.toString());
            return artId === numericId;
          });
          
          if (targetArtwork) {
            artwork = await Artwork.findByIdAndUpdate(
              targetArtwork._id,
              req.body,
              { new: true, runValidators: true }
            );
          }
        }
        
        if (!artwork) {
          return res.status(404).json({ error: "Artwork not found" });
        }
        
        res.json(normalizeId(artwork));
      }
    } catch (error) {
      console.error("Error updating artwork:", error);
      res.status(500).json({ error: "Failed to update artwork" });
    }
  });

  // Delete artwork
  app.delete("/api/admin/artworks/:id", isAdmin, async (req, res) => {
    try {
      if (isUsingNeDB()) {
        // NeDB: query by 'id' field (convert string param to number)
        const numericId = parseInt(req.params.id, 10);
        const artwork = await Artwork.findOne({ id: numericId });
        
        if (!artwork) {
          return res.status(404).json({ error: "Artwork not found" });
        }

        // Delete using id field
        await Artwork.deleteOne({ id: numericId });
        
        res.json({ success: true });
      } else {
        // MongoDB: Frontend sends numeric hash in URL
        // Need to find the actual document by searching
        const numericId = parseInt(req.params.id, 10);
        const allArtworks = await Artwork.find();
        const targetArtwork = allArtworks.find(art => {
          const artId = hashStringToNumber(art._id.toString());
          return artId === numericId;
        });
        
        if (!targetArtwork) {
          return res.status(404).json({ error: "Artwork not found" });
        }
        
        await Artwork.findByIdAndDelete(targetArtwork._id);
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error deleting artwork:", error);
      res.status(500).json({ error: "Failed to delete artwork" });
    }
  });

  // Update artist info
  app.patch("/api/admin/artist", isAdmin, async (req, res) => {
    try {
      let artist = await ArtistInfo.findOne();
      
      if (!artist) {
        artist = await ArtistInfo.create(req.body);
      } else {
        Object.assign(artist, req.body);
        await artist.save();
      }
      
      res.json(normalizeId(artist));
    } catch (error) {
      console.error("Error updating artist info:", error);
      res.status(500).json({ error: "Failed to update artist information" });
    }
  });

  // Create FAQ
  app.post("/api/admin/faqs", isAdmin, async (req, res) => {
    try {
      const faq = await FAQ.create(req.body);
      res.status(201).json(normalizeId(faq));
    } catch (error) {
      console.error("Error creating FAQ:", error);
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  // Update FAQ
  app.patch("/api/admin/faqs/:id", isAdmin, async (req, res) => {
    try {
      if (isUsingNeDB()) {
        // NeDB: query by 'id' field (convert string param to number)
        const numericId = parseInt(req.params.id, 10);
        const existingFaq = await FAQ.findOne({ id: numericId });
        
        if (!existingFaq) {
          return res.status(404).json({ error: "FAQ not found" });
        }

        // Update using id field
        const existingData = existingFaq.toObject ? existingFaq.toObject() : existingFaq;
        await FAQ.updateOne({ id: numericId }, { ...existingData, ...req.body });
        
        // Fetch updated FAQ
        const faq = await FAQ.findOne({ id: numericId });
        res.json(normalizeId(faq));
      } else {
        // MongoDB: Try to use _id from request body, fallback to numeric hash search
        let faq;
        
        if (req.body._id) {
          faq = await FAQ.findByIdAndUpdate(
            req.body._id,
            req.body,
            { new: true, runValidators: true }
          );
        } else {
          const numericId = parseInt(req.params.id, 10);
          const allFaqs = await FAQ.find();
          const targetFaq = allFaqs.find(f => {
            const faqId = hashStringToNumber(f._id.toString());
            return faqId === numericId;
          });
          
          if (targetFaq) {
            faq = await FAQ.findByIdAndUpdate(
              targetFaq._id,
              req.body,
              { new: true, runValidators: true }
            );
          }
        }
        
        if (!faq) {
          return res.status(404).json({ error: "FAQ not found" });
        }
        
        res.json(normalizeId(faq));
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  // Delete FAQ
  app.delete("/api/admin/faqs/:id", isAdmin, async (req, res) => {
    try {
      if (isUsingNeDB()) {
        // NeDB: query by 'id' field (convert string param to number)
        const numericId = parseInt(req.params.id, 10);
        const faq = await FAQ.findOne({ id: numericId });
        
        if (!faq) {
          return res.status(404).json({ error: "FAQ not found" });
        }

        // Delete using id field
        await FAQ.deleteOne({ id: numericId });
        
        res.json({ success: true });
      } else {
        // MongoDB: Frontend sends numeric hash, need to find actual document
        const numericId = parseInt(req.params.id, 10);
        const allFaqs = await FAQ.find();
        const targetFaq = allFaqs.find(f => {
          const faqId = hashStringToNumber(f._id.toString());
          return faqId === numericId;
        });
        
        if (!targetFaq) {
          return res.status(404).json({ error: "FAQ not found" });
        }
        
        await FAQ.findByIdAndDelete(targetFaq._id);
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  // Get site settings
  app.get("/api/settings", async (req, res) => {
    try {
      let settings = await SiteSettings.findOne();
      
      if (!settings) {
        settings = await SiteSettings.create({});
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update site settings
  app.put("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      let settings = await SiteSettings.findOne();
      
      if (!settings) {
        settings = await SiteSettings.create(req.body);
      } else {
        Object.assign(settings, req.body);
        await settings.save();
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Image upload endpoint
  app.post("/api/admin/upload-image", isAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      const cropData = JSON.parse(req.body.cropData || "{}");
      const artworkSlug = req.body.slug || randomUUID();
      const outputDir = join(process.cwd(), "attached_assets", "optimized", artworkSlug);
      
      await mkdir(outputDir, { recursive: true });

      const buffer = req.file.buffer;
      let processedBuffer = buffer;

      if (cropData.width && cropData.height) {
        processedBuffer = await sharp(buffer)
          .extract({
            left: Math.round(cropData.x),
            top: Math.round(cropData.y),
            width: Math.round(cropData.width),
            height: Math.round(cropData.height),
          })
          .toBuffer();
      }

      const sizes = [480, 960, 1440, 2048];
      const variants: any[] = [];

      for (const width of sizes) {
        const webpPath = join(outputDir, `${width}w.webp`);
        const jpegPath = join(outputDir, `${width}w.jpg`);

        await sharp(processedBuffer)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(webpPath);

        await sharp(processedBuffer)
          .resize(width, null, { withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toFile(jpegPath);

        variants.push({
          width,
          webp: `/attached_assets/optimized/${artworkSlug}/${width}w.webp`,
          jpeg: `/attached_assets/optimized/${artworkSlug}/${width}w.jpg`,
        });
      }

      res.json({
        success: true,
        url: `/attached_assets/optimized/${artworkSlug}/960w.jpg`,
        variants,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Rebuild trigger
  app.post("/api/admin/rebuild", isAdmin, async (req, res) => {
    try {
      await triggerRebuild();
      res.json({ success: true, message: "Rebuild started" });
    } catch (error: any) {
      console.error("Rebuild error:", error);
      res.status(500).json({ error: error.message || "Rebuild failed" });
    }
  });

  // Rebuild status
  app.get("/api/admin/rebuild/status", isAdmin, async (req, res) => {
    const status = getRebuildStatus();
    res.json(status);
  });

  const httpServer = createServer(app);
  return httpServer;
}
