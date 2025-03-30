const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Review = require('../models/Review');
const Movie = require('../models/Movie');

// Get all reviews for a movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const reviews = await Review.find({ movie: req.params.movieId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a review
router.post('/',
  auth,
  [
    body('movieId').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if movie exists
      const movie = await Movie.findById(req.body.movieId);
      if (!movie) {
        return res.status(404).json({ message: 'Movie not found' });
      }

      // Check if user has already reviewed this movie
      const existingReview = await Review.findOne({
        movie: req.body.movieId,
        user: req.user.id
      });

      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this movie' });
      }

      const review = new Review({
        movie: req.body.movieId,
        user: req.user.id,
        rating: req.body.rating,
        comment: req.body.comment
      });

      await review.save();

      // Update movie's average rating and total reviews
      const movieReviews = await Review.find({ movie: req.body.movieId });
      const totalRating = movieReviews.reduce((sum, review) => sum + review.rating, 0);
      movie.averageRating = totalRating / movieReviews.length;
      movie.totalReviews = movieReviews.length;
      await movie.save();

      res.status(201).json(review);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update a review
router.put('/:id',
  auth,
  [
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const review = await Review.findById(req.params.id);
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Check if user owns the review
      if (review.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this review' });
      }

      review.rating = req.body.rating;
      review.comment = req.body.comment;
      await review.save();

      // Update movie's average rating
      const movieReviews = await Review.find({ movie: review.movie });
      const totalRating = movieReviews.reduce((sum, review) => sum + review.rating, 0);
      const movie = await Movie.findById(review.movie);
      movie.averageRating = totalRating / movieReviews.length;
      await movie.save();

      res.json(review);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a review
router.delete('/:id',
  auth,
  async (req, res) => {
    try {
      const review = await Review.findById(req.params.id);
      
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Check if user owns the review or is admin
      if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this review' });
      }

      const movieId = review.movie;
      await review.deleteOne();

      // Update movie's average rating and total reviews
      const movieReviews = await Review.find({ movie: movieId });
      const movie = await Movie.findById(movieId);
      
      if (movieReviews.length === 0) {
        movie.averageRating = 0;
        movie.totalReviews = 0;
      } else {
        const totalRating = movieReviews.reduce((sum, review) => sum + review.rating, 0);
        movie.averageRating = totalRating / movieReviews.length;
        movie.totalReviews = movieReviews.length;
      }
      
      await movie.save();

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router; 