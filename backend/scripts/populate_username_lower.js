import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/userModel.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const users = await User.find({});
    console.log(`Found ${users.length} users, updating usernameLower where missing...`);
    let updated = 0;
    for (const user of users) {
      const lower = user.username ? user.username.toLowerCase() : null;
      if (lower && user.usernameLower !== lower) {
        user.usernameLower = lower;
        await user.save();
        updated++;
      }
    }
    console.log(`Updated usernameLower for ${updated} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
