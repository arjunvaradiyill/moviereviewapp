const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const sampleMovies = require('../data/sampleMovies.json');

const MONGODB_URI = 'mongodb+srv://arjunvaradiyil203:c21fGh5SYEvPt1Ww@moviereview.dacg6.mongodb.net/moviedb';

async function importMovies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing movies
    await Movie.deleteMany({});
    console.log('Cleared existing movies');

    // Insert new movies
    const result = await Movie.insertMany(sampleMovies.movies);
    console.log(`Successfully imported ${result.length} movies`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error importing movies:', error);
    process.exit(1);
  }
}

importMovies(); 