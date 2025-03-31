const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createNewAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all existing admin users and users with admin email
    await User.deleteMany({ $or: [{ role: 'admin' }, { email: 'admin@example.com' }] });
    console.log('Deleted existing admin users');

    // Create new admin user
    const adminUser = new User({
      username: 'superadmin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    await adminUser.save();
    console.log('New admin user created successfully');
    console.log('Admin credentials:');
    console.log('Username:', adminUser.username);
    console.log('Email:', adminUser.email);
    console.log('Password: admin123');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
};

createNewAdmin(); 