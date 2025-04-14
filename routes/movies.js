const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, isAdmin } = require('../middleware/auth');
const Movie = require('../models/Movie');

// Get all movies with optional filtering
router.get('/', async (req, res) => {
  try {
    const { genre, search } = req.query;
    let query = {};

    // Filter by genre if provided
    if (genre) {
      query.genre = genre;
    }

    // Search in title and description if search term provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const movies = await Movie.find(query).sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// Get upcoming movies (movies with future release dates)
router.get('/upcoming', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentDay = currentDate.getDate();
    
    // Find movies that are released in the future
    const upcomingMovies = await Movie.find({ 
      $or: [
        // Current year, current month, but future day (if we had a day field)
        // Since we don't have day precision, exclude current month movies if we're past the 15th
        { 
          releaseYear: currentYear, 
          releaseMonth: currentMonth,
          // Only show current month if we're in the first half of the month
          // This is a heuristic since we don't store the exact release day
          $expr: { $lt: [currentDay, 15] }
        },
        // Current year but future month
        { releaseYear: currentYear, releaseMonth: { $gt: currentMonth } },
        // Future years
        { releaseYear: { $gt: currentYear } }
      ]
    })
    .sort({ releaseYear: 1, releaseMonth: 1 })
    .limit(10);
    
    res.json(upcomingMovies);
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    res.status(500).json({ message: 'Server error while fetching upcoming movies' });
  }
});

// Get movies with banners
router.get('/with-banners', async (req, res) => {
  try {
    // Find movies that have banners
    const moviesWithBanners = await Movie.find({
      bannerUrl: { $exists: true, $ne: null, $ne: '' }
    })
    .select('_id title description bannerUrl trailerUrl')
    .sort({ createdAt: -1 })
    .limit(5);
    
    res.json(moviesWithBanners);
  } catch (error) {
    console.error('Error fetching movies with banners:', error);
    res.status(500).json({ message: 'Server error while fetching movies with banners' });
  }
});

// Get a single movie by ID
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ message: 'Error fetching movie' });
  }
});

// Create a new movie (admin only)
router.post('/', [auth, isAdmin], [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('releaseYear').isInt({ min: 1888, max: new Date().getFullYear() + 5 }).withMessage('Invalid release year'),
  body('releaseMonth').optional().isInt({ min: 1, max: 12 }).withMessage('Release month must be between 1 and 12'),
  body('genre').isArray().withMessage('Genre must be an array'),
  body('genre.*').isIn([
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
    'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
    'TV Movie', 'Thriller', 'War', 'Western'
  ]).withMessage('Invalid genre'),
  body('director').trim().notEmpty().withMessage('Director is required'),
  body('cast').isArray().withMessage('Cast must be an array'),
  body('cast.*').trim().notEmpty().withMessage('Cast member name cannot be empty'),
  body('posterUrl').trim().isURL().withMessage('Invalid poster URL'),
  body('bannerUrl').optional().trim().isURL().withMessage('Invalid banner URL'),
  body('trailerUrl').optional().trim().isURL().withMessage('Invalid trailer URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { 
      title, 
      description, 
      releaseYear,
      releaseMonth, 
      genre, 
      director, 
      cast, 
      posterUrl,
      bannerUrl,
      trailerUrl 
    } = req.body;

    // Create new movie
    const movie = new Movie({
      title,
      description,
      releaseYear,
      releaseMonth,
      genre,
      director,
      cast,
      posterUrl,
      bannerUrl,
      trailerUrl,
      createdBy: req.user._id
    });

    await movie.save();
    res.status(201).json(movie);
  } catch (error) {
    console.error('Error creating movie:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating movie' });
  }
});

// Update a movie (admin only)
router.put('/:id', [auth, isAdmin], [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('releaseYear').optional().isInt({ min: 1888, max: new Date().getFullYear() + 5 }).withMessage('Invalid release year'),
  body('releaseMonth').optional().isInt({ min: 1, max: 12 }).withMessage('Release month must be between 1 and 12'),
  body('genre').optional().isArray().withMessage('Genre must be an array'),
  body('genre.*').optional().isIn([
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
    'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
    'TV Movie', 'Thriller', 'War', 'Western'
  ]).withMessage('Invalid genre'),
  body('director').optional().trim().notEmpty().withMessage('Director cannot be empty'),
  body('cast').optional().isArray().withMessage('Cast must be an array'),
  body('cast.*').optional().trim().notEmpty().withMessage('Cast member name cannot be empty'),
  body('posterUrl').optional().trim().isURL().withMessage('Invalid poster URL'),
  body('bannerUrl').optional().trim().isURL().withMessage('Invalid banner URL'),
  body('trailerUrl').optional().trim().isURL().withMessage('Invalid trailer URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const updates = req.body;
    Object.assign(movie, updates);
    await movie.save();
    res.json(movie);
  } catch (error) {
    console.error('Error updating movie:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating movie' });
  }
});

// Delete a movie (admin only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    await movie.deleteOne();
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ message: 'Error deleting movie' });
  }
});

module.exports = router; 