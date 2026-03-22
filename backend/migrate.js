import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { Store, connectDB } from './lib/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

async function migrate() {
  await connectDB();
  
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const key = file.replace('.json', '');
    const filePath = path.join(DATA_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`Migrating ${key}...`);
      await Store.findOneAndUpdate(
        { key },
        { data },
        { upsert: true }
      );
      console.log(`Successfully migrated ${key}`);
    } catch (err) {
      console.error(`Failed to migrate ${key}:`, err.message);
    }
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrate();
