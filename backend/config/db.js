const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/billingDB';
    
    console.log('========================================');
    console.log('📡 CONNECTING TO MONGODB');
    console.log('========================================');
    console.log(`URI: ${mongoURI}`);
    console.log('========================================\n');
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB Connected Successfully!\n');
    
    try {
      const dbConn = mongoose.connection.db;
      const usersColl = dbConn.collection('users');
      const existingIdx = await usersColl.indexes();

      const legacyIndexes = ['username_1', 'firebaseUid_1'];
      for (const indexName of legacyIndexes) {
        if (existingIdx.some(i => i.name === indexName)) {
          try {
            await usersColl.dropIndex(indexName);
            console.log(`ℹ️ Dropped legacy index: ${indexName}`);
          } catch (dropErr) {
            console.warn(`⚠️ Could not drop ${indexName} index:`, dropErr.message);
          }
        }
      }

      const hasFirebaseIndex = existingIdx.some(i => i.name === 'firebaseUid_1');
      if (hasFirebaseIndex) {
        try {
          await usersColl.dropIndex('firebaseUid_1');
          console.log('ℹ️ Dropped existing index: firebaseUid_1');
        } catch (dropErr) {
          console.warn('⚠️ Could not drop firebaseUid_1 index:', dropErr.message);
        }
      }
      try {
        // Remove any explicit null values so partial index can be built using $exists
        try {
          const result = await usersColl.updateMany({ firebaseUid: null }, { $unset: { firebaseUid: "" } });
          if (result.modifiedCount > 0) {
            console.log(`ℹ️ Removed firebaseUid field from ${result.modifiedCount} documents where it was null`);
          }
        } catch (unsetErr) {
          console.warn('⚠️ Could not unset null firebaseUid fields:', unsetErr.message);
        }

        await usersColl.createIndex(
          { firebaseUid: 1 },
          { unique: true, partialFilterExpression: { firebaseUid: { $exists: true } } }
        );
        console.log('✅ Created partial unique index on firebaseUid');
      } catch (createErr) {
        console.warn('⚠️ Could not create partial unique index on firebaseUid:', createErr.message);
      }
    } catch (err) {
      console.warn('⚠️ Skipping firebaseUid index maintenance:', err.message);
    }
    
    const User = require('../models/User');
    const adminExists = await User.findOne({ email: 'admin@growfinance.com' });

    if (!adminExists) {
      const admin = new User({
        fullName: 'Administrator',
        businessName: 'GROW FINANCE',
        email: 'admin@growfinance.com',
        phoneNumber: '+0000000000',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Default admin created!');
      console.log('   Email: admin@growfinance.com');
      console.log('   Password: admin123\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('❌ Error:', error.message);
    console.error('\n💡 SOLUTIONS:');
    console.error('   1. Make sure MongoDB is installed');
    console.error('   2. Run as Admin: net start MongoDB');
    console.error('   3. Or manually start: mongod --dbpath C:\\data\\db');
    console.error('   4. Check if port 27017 is free');
    console.error('\n⚠️  Backend will continue but database features will not work!\n');
    
    return false;
  }
};

module.exports = connectDB;