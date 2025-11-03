import Datastore from '@seald-io/nedb';
import { readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// NeDB databases - file-based persistent storage
let artworksDB: Datastore;
let artistDB: Datastore;
let faqsDB: Datastore;
let usersDB: Datastore;
let settingsDB: Datastore;

let isNeDBInitialized = false;

// NeDB data directory
const NEDB_DATA_DIR = join(process.cwd(), 'data', 'nedb');

export async function initNeDB() {
  if (isNeDBInitialized) {
    return;
  }

  console.log('🗄️  Initializing NeDB database service...');

  // Create data directory if it doesn't exist
  if (!existsSync(NEDB_DATA_DIR)) {
    await mkdir(NEDB_DATA_DIR, { recursive: true });
    console.log(`  📁 Created NeDB data directory: ${NEDB_DATA_DIR}`);
  }

  // Initialize NeDB datastores with file persistence
  artworksDB = new Datastore({ filename: join(NEDB_DATA_DIR, 'artworks.db'), autoload: true });
  artistDB = new Datastore({ filename: join(NEDB_DATA_DIR, 'artist.db'), autoload: true });
  faqsDB = new Datastore({ filename: join(NEDB_DATA_DIR, 'faqs.db'), autoload: true });
  usersDB = new Datastore({ filename: join(NEDB_DATA_DIR, 'users.db'), autoload: true });
  settingsDB = new Datastore({ filename: join(NEDB_DATA_DIR, 'settings.db'), autoload: true });

  // Check if database files already exist and have data
  const hasExistingData = await new Promise<boolean>((resolve) => {
    artworksDB.count({}, (err, count) => {
      resolve(!err && count > 0);
    });
  });

  // Check if admin user exists
  const hasAdminUser = await new Promise<boolean>((resolve) => {
    usersDB.findOne({ email: 'admin@quillyourdream.com' }, (err, doc) => {
      resolve(!err && doc !== null);
    });
  });

  // Only load sample data if database is empty
  if (!hasExistingData) {
    console.log('  📦 Loading initial sample data...');
    try {
      // Load artworks
      const artworksPath = join(process.cwd(), 'server/data/artworks.json');
      const artworksData = JSON.parse(await readFile(artworksPath, 'utf-8'));
      
      for (const artwork of artworksData) {
        await new Promise((resolve, reject) => {
          artworksDB.insert(artwork, (err) => {
            if (err) reject(err);
            else resolve(null);
          });
        });
      }
      console.log(`  ✅ Loaded ${artworksData.length} artworks`);

      // Load artist info
      const artistPath = join(process.cwd(), 'server/data/artist.json');
      const artistData = JSON.parse(await readFile(artistPath, 'utf-8'));
      await new Promise((resolve, reject) => {
        artistDB.insert(artistData, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      console.log('  ✅ Loaded artist info');

      // Load FAQs
      const faqsPath = join(process.cwd(), 'server/data/faqs.json');
      const faqsData = JSON.parse(await readFile(faqsPath, 'utf-8'));
      
      for (const faq of faqsData) {
        await new Promise((resolve, reject) => {
          faqsDB.insert(faq, (err) => {
            if (err) reject(err);
            else resolve(null);
          });
        });
      }
      console.log(`  ✅ Loaded ${faqsData.length} FAQs`);

      // Create default settings
      await new Promise((resolve, reject) => {
        settingsDB.insert({
          accentHue: 186,
          accentSaturation: 68,
          accentLightness: 45,
          createdAt: new Date()
        }, (err) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      console.log('  ✅ Created default site settings');
    } catch (error: any) {
      console.error('❌ Error loading NeDB data:', error.message);
      throw error;
    }
  } else {
    console.log('  ✅ Loaded existing NeDB data from disk');
  }

  // Always ensure admin user exists (create if not present)
  if (!hasAdminUser) {
    const bcrypt = await import('bcrypt');
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    await new Promise((resolve, reject) => {
      usersDB.insert({
        email: 'admin@quillyourdream.com',
        password: adminPasswordHash,
        role: 'admin',
        createdAt: new Date()
      }, (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
    console.log('  ✅ Created default admin user (email: admin@quillyourdream.com, password: admin123)');
  } else {
    console.log('  ✅ Admin user already exists');
  }

  isNeDBInitialized = true;
  console.log(`✅ NeDB database service ready (${NEDB_DATA_DIR})`);
}

export function getNeDBStores() {
  if (!isNeDBInitialized) {
    throw new Error('NeDB not initialized. Call initNeDB() first.');
  }
  
  return {
    artworks: artworksDB,
    artist: artistDB,
    faqs: faqsDB,
    users: usersDB,
    settings: settingsDB
  };
}

export function isNeDBReady(): boolean {
  return isNeDBInitialized;
}

// NeDB Query Builder for chaining
class NeDBQuery<T> {
  private query: any = {};
  private sortObj: any = null;
  private limitNum: number | null = null;

  constructor(private db: Datastore, query: any = {}) {
    this.query = query;
  }

  sort(sortObj: any): this {
    this.sortObj = sortObj;
    return this;
  }

  limit(num: number): this {
    this.limitNum = num;
    return this;
  }

  exec(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      let cursor = this.db.find(this.query);
      
      if (this.sortObj) {
        cursor = cursor.sort(this.sortObj);
      }
      
      if (this.limitNum !== null) {
        cursor = cursor.limit(this.limitNum);
      }
      
      cursor.exec((err: Error | null, docs: any[]) => {
        if (err) reject(err);
        else resolve(docs as T[]);
      });
    });
  }

  // Make it thenable for async/await
  then(onfulfilled?: any, onrejected?: any): Promise<T[]> {
    return this.exec().then(onfulfilled, onrejected);
  }

  catch(onrejected?: any): Promise<T[]> {
    return this.exec().catch(onrejected);
  }
}

// NeDB adapter for Mongoose-like operations
export class NeDBModel<T> {
  constructor(private db: Datastore) {}

  find(query: any = {}): NeDBQuery<T> {
    return new NeDBQuery<T>(this.db, query);
  }

  findOne(query: any): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.db.findOne(query, (err: Error | null, doc: any) => {
        if (err) reject(err);
        else resolve(doc as T | null);
      });
    });
  }

  async countDocuments(query: any = {}): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.count(query, (err: Error | null, count: number) => {
        if (err) reject(err);
        else resolve(count);
      });
    });
  }

  create(doc: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.insert(doc, (err: Error | null, newDoc: any) => {
        if (err) reject(err);
        else resolve(newDoc as T);
      });
    });
  }

  updateOne(query: any, update: any): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.update(query, update, {}, (err: Error | null, numAffected: number) => {
        if (err) reject(err);
        else resolve(numAffected);
      });
    });
  }

  deleteOne(query: any): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.remove(query, {}, (err: Error | null, numRemoved: number) => {
        if (err) reject(err);
        else resolve(numRemoved);
      });
    });
  }

  async findByIdAndUpdate(id: string, update: any, options?: any): Promise<T | null> {
    // First find the document
    const doc = await this.findOne({ _id: id });
    if (!doc) {
      return null;
    }

    // Update the document
    return new Promise((resolve, reject) => {
      this.db.update(
        { _id: id },
        { ...doc, ...update },
        {},
        (err: Error | null, numAffected: number) => {
          if (err) {
            reject(err);
          } else if (numAffected === 0) {
            resolve(null);
          } else {
            // Return the updated document
            this.findOne({ _id: id }).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    // First find the document to return it
    const doc = await this.findOne({ _id: id });
    if (!doc) {
      return null;
    }

    // Delete the document
    return new Promise((resolve, reject) => {
      this.db.remove({ _id: id }, {}, (err: Error | null, numRemoved: number) => {
        if (err) {
          reject(err);
        } else if (numRemoved === 0) {
          resolve(null);
        } else {
          resolve(doc);
        }
      });
    });
  }
}
