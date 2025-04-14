const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['https://moviereviewapp-client.onrender.com', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
console.log('Attempting to connect to MongoDB Atlas via SRV...');
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Increase socket timeout
  family: 4 // Force IPv4
})
.then(() => console.log('Connected to MongoDB Atlas via SRV'))
.catch((err) => {
  console.error('MongoDB SRV connection error:', err);
  console.log('Trying direct connection method...');
  
  // Try direct connection string if SRV fails
  const directConnectionString = 'mongodb://arjunvaradiyil203:c21fGh5SYEvPt1Ww@moviereview-shard-00-00.dacg6.mongodb.net:27017,moviereview-shard-00-01.dacg6.mongodb.net:27017,moviereview-shard-00-02.dacg6.mongodb.net:27017/moviedb?ssl=true&replicaSet=atlas-1qbckj-shard-0&authSource=admin&retryWrites=true&w=majority';
  
  mongoose.connect(directConnectionString, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4
  })
  .then(() => console.log('Connected to MongoDB Atlas via direct connection'))
  .catch((directErr) => {
    console.error('MongoDB direct connection error:', directErr);
    console.error('Could not connect to MongoDB Atlas. Check your internet connection and firewall settings.');
    console.log('Trying to connect to local MongoDB as a last resort...');
    
    // Try local connection as last resort
    mongoose.connect('mongodb://localhost:27017/moviedb')
      .then(() => console.log('Connected to local MongoDB'))
      .catch((localErr) => {
        console.error('Local MongoDB connection error:', localErr);
        console.error('All connection attempts failed. The application may not function correctly.');
      });
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit from:', req.headers.origin);
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbLatency = null;
  
  // Check MongoDB connection
  if (mongoose.connection.readyState === 1) {
    try {
      // Measure database latency
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatency = Date.now() - startTime;
      dbStatus = 'connected';
    } catch (err) {
      console.error('MongoDB health check error:', err);
      dbStatus = 'error';
    }
  }
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      nodeVersion: process.version
    },
    database: {
      status: dbStatus,
      latency: dbLatency
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 