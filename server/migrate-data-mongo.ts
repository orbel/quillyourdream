import { connectDB, Artwork, ArtistInfo, FAQ } from "./db";
import fs from "fs/promises";
import path from "path";

async function readJsonData(filename: string) {
  const dataPath = path.join(process.cwd(), "server", "data", filename);
  const data = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(data);
}

async function migrateData() {
  console.log("Starting data migration from JSON to MongoDB...\n");

  try {
    // Connect to MongoDB
    await connectDB();

    // Migrate artworks
    console.log("Migrating artworks...");
    const artworksData = await readJsonData("artworks.json");
    
    let artworkCount = 0;
    for (const artwork of artworksData) {
      const { id, ...artworkWithoutId } = artwork;
      
      await Artwork.findOneAndUpdate(
        { slug: artworkWithoutId.slug },
        artworkWithoutId,
        { upsert: true, new: true }
      );
      artworkCount++;
    }
    console.log(`✓ Migrated/updated ${artworkCount} artworks`);

    // Migrate artist info
    console.log("\nMigrating artist information...");
    const artistData = await readJsonData("artist.json");
    
    await ArtistInfo.findOneAndUpdate(
      {},
      artistData,
      { upsert: true, new: true }
    );
    console.log("✓ Migrated artist information");

    // Migrate FAQs
    console.log("\nMigrating FAQs...");
    const faqsData = await readJsonData("faqs.json");
    
    let faqCount = 0;
    for (let i = 0; i < faqsData.length; i++) {
      const faq = faqsData[i];
      const { id, ...faqWithoutId } = faq;
      
      await FAQ.findOneAndUpdate(
        { question: faqWithoutId.question },
        { ...faqWithoutId, order: i },
        { upsert: true, new: true }
      );
      faqCount++;
    }
    console.log(`✓ Migrated/updated ${faqCount} FAQs`);

    console.log("\n✓ Data migration completed successfully!");
    console.log("\nNote: This migration is idempotent and safe to run multiple times.");
    
  } catch (error) {
    console.error("✗ Migration failed:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

migrateData();
