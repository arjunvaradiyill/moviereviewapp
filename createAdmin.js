const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

async function connectToMongoDB() {
  try {
    // Try SRV connection first
    console.log('Attempting to connect to MongoDB Atlas via SRV...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('Connected to MongoDB Atlas via SRV');
    return true;
  } catch (srvErr) {
    console.error('MongoDB SRV connection error:', srvErr);
    
    try {
      // Try direct connection string if SRV fails
      console.log('Trying direct connection method...');
      const directConnectionString = 'mongodb://arjunvaradiyil203:c21fGh5SYEvPt1Ww@moviereview-shard-00-00.dacg6.mongodb.net:27017,moviereview-shard-00-01.dacg6.mongodb.net:27017,moviereview-shard-00-02.dacg6.mongodb.net:27017/moviedb?ssl=true&replicaSet=atlas-1qbckj-shard-0&authSource=admin&retryWrites=true&w=majority';
      
      await mongoose.connect(directConnectionString, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4
      });
      console.log('Connected to MongoDB Atlas via direct connection');
      return true;
    } catch (directErr) {
      console.error('MongoDB direct connection error:', directErr);
      
      try {
        // Try local connection as last resort
        console.log('Trying to connect to local MongoDB as a last resort...');
        await mongoose.connect('mongodb://localhost:27017/moviedb');
        console.log('Connected to local MongoDB');
        return true;
      } catch (localErr) {
        console.error('Local MongoDB connection error:', localErr);
        console.error('All connection attempts failed. Cannot create admin user.');
        return false;
      }
    }
  }
}

async function createAdmin() {
  // Try to connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    process.exit(1);
    return;
  }
  
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      mongoose.connection.close();
      return;
    }
    
    // Check if test user exists
    const testUser = await User.findOne({ email: 'kannnan@gmail.com' });
    if (!testUser) {
      // Create a test user
      const testPassword = await bcrypt.hash('password123', 10);
      const newTestUser = new User({
        username: 'kannan',
        email: 'kannnan@gmail.com',
        password: testPassword,
        role: 'user'
      });
      await newTestUser.save();
      console.log('Test user created successfully');
    } else {
      console.log('Test user already exists');
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    await admin.save();
    console.log('Admin user created successfully');
    console.log('Admin credentials: admin@example.com / admin123');
    console.log('Test user credentials: kannnan@gmail.com / password123');
    
    // Close connection
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin(); 