import 'dotenv/config';
import { User, connectDB } from './lib/db.js';
import mongoose from 'mongoose';

async function createAdmin() {
  await connectDB();
  
  // Use environment variables instead of hardcoded strings
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
  
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn('Warning: ADMIN_EMAIL or ADMIN_PASSWORD not set in environment. Using defaults.');
  }

  try {
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`Admin user ${adminEmail} already exists.`);
    } else {
      await User.create({
        email: adminEmail,
        password: adminPassword,
        name: 'Admin User'
      });
      console.log(`Admin user ${adminEmail} created successfully!`);
    }
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
