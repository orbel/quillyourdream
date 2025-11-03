// MongoDB initialization script
// This script runs automatically when MongoDB container is first created
// It imports data from JSON files into the database

print('Starting MongoDB data import...');

// Use the database specified in MONGO_INITDB_DATABASE environment variable
// This is automatically set by docker-compose.yml
const dbName = process.env.MONGO_INITDB_DATABASE || 'quillyourdream';
print(`Using database: ${dbName}`);

// Switch to the configured database
db = db.getSiblingDB(dbName);

// Read and parse JSON files
const artworksData = cat('/docker-entrypoint-initdb.d/data/artworks.json');
const artistData = cat('/docker-entrypoint-initdb.d/data/artist.json');
const faqsData = cat('/docker-entrypoint-initdb.d/data/faqs.json');

const artworks = JSON.parse(artworksData);
const artist = JSON.parse(artistData);
const faqs = JSON.parse(faqsData);

// Import artworks
if (Array.isArray(artworks) && artworks.length > 0) {
  print(`Importing ${artworks.length} artworks...`);
  db.artworks.insertMany(artworks);
  print('✅ Artworks imported successfully');
} else {
  print('⚠️  No artworks to import');
}

// Import artist info
if (artist && typeof artist === 'object') {
  print('Importing artist information...');
  // Artist data is typically a single object
  if (Array.isArray(artist)) {
    db.artistinfos.insertMany(artist);
  } else {
    db.artistinfos.insertOne(artist);
  }
  print('✅ Artist info imported successfully');
} else {
  print('⚠️  No artist info to import');
}

// Import FAQs
if (Array.isArray(faqs) && faqs.length > 0) {
  print(`Importing ${faqs.length} FAQs...`);
  db.faqs.insertMany(faqs);
  print('✅ FAQs imported successfully');
} else {
  print('⚠️  No FAQs to import');
}

// Create default admin user with bcrypt password hash
print('Creating default admin user...');

// Pre-generated bcrypt hash for "BlueGrass20!" (cost factor 10)
// This is generated using: bcrypt.hashSync('BlueGrass20!', 10)
const adminPasswordHash = '$2b$10$HwB1wK.uTyjtXJKwmUUsL.sX90eQIHbKRxHv1/hRdULI9pUz7.yOm';

db.users.insertOne({
  email: 'admin@quillyourdream.com',
  password: adminPasswordHash,
  role: 'admin',
  createdAt: new Date()
});

print('✅ Default admin user created');
print('   Email: admin@quillyourdream.com');
print('   Password: BlueGrass20!');
print('   ⚠️  IMPORTANT: Change this password immediately after first login!');

// Create indexes for better performance
print('Creating database indexes...');

db.artworks.createIndex({ slug: 1 }, { unique: true });
db.artworks.createIndex({ category: 1 });
db.artworks.createIndex({ featured: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.faqs.createIndex({ category: 1 });

print('✅ Indexes created successfully');

// Display collection counts
print('\n📊 Database Statistics:');
print(`   Artworks: ${db.artworks.countDocuments()}`);
print(`   Artist Info: ${db.artistinfos.countDocuments()}`);
print(`   FAQs: ${db.faqs.countDocuments()}`);
print(`   Users: ${db.users.countDocuments()}`);

print('\n🎉 MongoDB initialization complete!');
