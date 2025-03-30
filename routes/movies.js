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
  body('posterUrl').trim().isURL().withMessage('Invalid poster URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { title, description, releaseYear, genre, director, cast, posterUrl } = req.body;

    // Create new movie
    const movie = new Movie({
      title,
      description,
      releaseYear,
      genre,
      director,
      cast,
      posterUrl,
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
  body('posterUrl').optional().trim().isURL().withMessage('Invalid poster URL')
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