const mongoose = require('mongoose');
const Movie = require('../models/Movie');

const MONGODB_URI = 'mongodb+srv://arjunvaradiyil203:c21fGh5SYEvPt1Ww@moviereview.dacg6.mongodb.net/moviedb';

async function clearMovies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all movies
    const result = await Movie.deleteMany({});
    console.log(`Successfully cleared ${result.deletedCount} movies`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error clearing movies:', error);
    process.exit(1);
  }
}

clearMovies(); 