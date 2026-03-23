import 'dotenv/config';
import { User, Link, connectDB } from './lib/db.js';
import mongoose from 'mongoose';

async function createPinki() {
  await connectDB();
  
  // Use environment variables instead of hardcoded strings
  const email = process.env.PINKI_EMAIL || 'pinki@example.com'; 
  const password = process.env.PINKI_PASSWORD || 'changeme';
  
  if (!process.env.PINKI_EMAIL || !process.env.PINKI_PASSWORD) {
    console.warn('Warning: PINKI_EMAIL or PINKI_PASSWORD not set in environment. Using defaults.');
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      console.log(`User ${email} already exists. Updating role to pm...`);
      user.role = 'pm';
      await user.save();
    } else {
      user = await User.create({
        email,
        password,
        name: 'Pinki',
        role: 'pm'
      });
      console.log(`User ${email} created successfully!`);
    }

    // Add the roadmap link for her
    const existingLink = await Link.findOne({ userId: user._id, url: 'https://roadmap.sh/product-manager' });
    if (!existingLink) {
      await Link.create({
        userId: user._id,
        title: 'Product Manager Roadmap',
        url: 'https://roadmap.sh/product-manager',
        category: 'Roadmap'
      });
      console.log('Roadmap link added for Pinki.');
    }

    console.log('Provisioning complete for:', email);
  } catch (err) {
    console.error('Error creating Pinki:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

createPinki();
