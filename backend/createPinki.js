import 'dotenv/config';
import { User, Link, connectDB } from './lib/db.js';
import mongoose from 'mongoose';

async function createPinki() {
  await connectDB();
  
  const email = 'pinki@pinki.com';
  const password = 'pinki';
  
  try {
    let user = await User.findOne({ email });
    if (user) {
      console.log('User Pinki already exists. Updating role to pm...');
      user.role = 'pm';
      await user.save();
    } else {
      user = await User.create({
        email,
        password,
        name: 'Pinki',
        role: 'pm'
      });
      console.log('User Pinki created successfully!');
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

    console.log('Email:', email);
    console.log('Password:', password);
  } catch (err) {
    console.error('Error creating Pinki:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

createPinki();
