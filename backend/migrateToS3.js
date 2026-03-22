import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToS3 } from './lib/s3Storage.js';
import { loadConfig } from './config/index.js';
import { Note, User, connectDB } from './lib/db.js';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTES_BASE = path.join(__dirname, 'data', 'notes');
const DOCS_BASE = path.join(__dirname, 'docs');

async function migrate() {
  await loadConfig();
  await connectDB();
  
  const admin = await User.findOne({ email: 'admin@admin.com' });
  if (!admin) {
    console.error('Admin user not found. Please run createAdmin.js first.');
    process.exit(1);
  }
  const adminId = admin._id;

  console.log(`Starting migration for Admin (${admin.email})...`);

  // 1. Migrate Notes
  if (fs.existsSync(NOTES_BASE)) {
    // We walk the local notes and map them to: uploads/{adminId}/notes/...
    await walkAndUploadNotes(NOTES_BASE, adminId, "");
  }

  // 2. Migrate Public Docs (Roadmap)
  const roadmapPath = path.join(DOCS_BASE, 'product-manager.pdf');
  if (fs.existsSync(roadmapPath)) {
    console.log('Uploading public roadmap...');
    const buffer = fs.readFileSync(roadmapPath);
    await uploadToS3('public/product-manager.pdf', buffer, 'application/pdf');
    console.log('Public roadmap uploaded.');
  }

  console.log('Migration complete!');
  mongoose.connection.close();
  process.exit(0);
}

async function walkAndUploadNotes(dir, userId, relativePath) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);
    const currentRelPath = relativePath ? `${relativePath}/${ent.name}` : ent.name;

    if (ent.isDirectory()) {
      await walkAndUploadNotes(fullPath, userId, currentRelPath);
    } else {
      if (ent.name === '.gitkeep' || ent.name === '.DS_Store') continue;

      const buffer = fs.readFileSync(fullPath);
      // S3 Key: uploads/{userId}/notes/{relPath}
      const s3Key = `uploads/${userId}/notes/${currentRelPath}`;
      
      console.log(`Processing: ${currentRelPath}`);
      
      let contentType = 'application/octet-stream';
      if (ent.name.endsWith('.pdf')) contentType = 'application/pdf';
      if (ent.name.endsWith('.txt')) contentType = 'text/plain';
      if (ent.name.endsWith('.md')) contentType = 'text/markdown';
      if (ent.name.endsWith('.png')) contentType = 'image/png';
      if (ent.name.endsWith('.jpg') || ent.name.endsWith('.jpeg')) contentType = 'image/jpeg';

      // 1. Upload to S3
      await uploadToS3(s3Key, buffer, contentType);

      // 2. Index in Database
      // Expected parts: [gsPaper, subject, chapter, topic, filename]
      const parts = currentRelPath.split('/');
      if (parts.length >= 5) {
        const [gsPaper, subject, chapter, topic, filename] = parts;
        await Note.findOneAndUpdate(
          { userId, filename },
          {
            userId,
            gsPaper,
            subject,
            chapter,
            topic,
            filename,
            s3Key,
            contentType,
            size: buffer.length
          },
          { upsert: true, new: true }
        );
        console.log(`  - Indexed in DB: ${filename}`);
      } else {
        console.log(`  - Skipping DB index for ${ent.name} (Incomplete path structure)`);
      }
    }
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
