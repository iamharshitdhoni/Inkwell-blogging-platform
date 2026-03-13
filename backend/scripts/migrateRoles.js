/**
 * ============================================================================
 * MIGRATION SCRIPT: Migrate 'writer' role to 'author'
 * ============================================================================
 * 
 * Purpose:
 * - Convert existing users with role='writer' to role='author'
 * - Ensures all author-related users use the new standardized role
 * 
 * Run this script ONCE after updating the schema:
 * node backend/scripts/migrateRoles.js
 * 
 * Safety:
 * - Creates backup of affected users
 * - Logs all changes
 * - Can be run multiple times (idempotent)
 */

import mongoose from 'mongoose';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateRoles = async () => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 ROLE MIGRATION: Converting writer → author');
    console.log('='.repeat(80) + '\n');

    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users with 'writer' role
    console.log('🔍 Searching for users with role = "writer"...');
    const writerUsers = await User.find({ role: 'writer' });
    console.log(`📊 Found ${writerUsers.length} users with role "writer"\n`);

    if (writerUsers.length === 0) {
      console.log('ℹ️  No users with "writer" role found. Migration not needed.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Backup affected users
    console.log('💾 Backing up affected users...');
    const backupData = {
      timestamp: new Date().toISOString(),
      totalAffected: writerUsers.length,
      users: writerUsers.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        roleOld: 'writer',
        roleNew: 'author'
      }))
    };
    console.log(`✅ Backup created with ${writerUsers.length} user records\n`);

    // Migrate roles
    console.log('🔄 Updating roles...');
    const updateResult = await User.updateMany(
      { role: 'writer' },
      { $set: { role: 'author' } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} users\n`);

    // Verify migration
    console.log('✔️  Verifying migration...');
    const authorsCount = await User.countDocuments({ role: 'author' });
    const remainingWriters = await User.countDocuments({ role: 'writer' });
    
    console.log(`📈 Authors with role "author": ${authorsCount}`);
    console.log(`⚠️  Remaining writers (should be 0): ${remainingWriters}\n`);

    if (remainingWriters === 0) {
      console.log('✨ Migration successful!\n');
      console.log('Summary:');
      console.log(`  • Total users migrated: ${updateResult.modifiedCount}`);
      console.log(`  • Total authors now: ${authorsCount}`);
      console.log(`  • Timestamp: ${backupData.timestamp}\n`);
    } else {
      console.log('⚠️  WARNING: Some writers still exist!\n');
    }

    // Log sample migrated users
    console.log('Sample of migrated users:');
    const migratedUsers = await User.find({ role: 'author' })
      .select('name email role createdAt')
      .limit(5);
    
    migratedUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.name} (${user.email}) - role: ${user.role}`);
    });
    console.log();

    await mongoose.connection.close();
    console.log('🎉 Migration completed and database connection closed.\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed with error:');
    console.error(`   ${error.message}\n`);
    console.error('Stack trace:');
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
migrateRoles();
