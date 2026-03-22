import 'dotenv/config';
import { User, connectDB } from './lib/db.js';
import mongoose from 'mongoose';

async function createAdmin() {
  await connectDB();
  
  const adminEmail = 'admin@admin.com';
  const adminPassword = '1234';
  
  try {
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin user already exists.');
    } else {
      const admin = await User.create({
        email: adminEmail,
        password: adminPassword,
        name: 'Admin User'
      });
      console.log('Admin user created successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    }
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
