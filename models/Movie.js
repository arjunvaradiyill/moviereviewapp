const mongoose = require('mongoose');

const VALID_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
  'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
  'TV Movie', 'Thriller', 'War', 'Western'
];

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  releaseYear: {
    type: Number,
    required: [true, 'Release year is required'],
    min: [1888, 'Release year must be 1888 or later'],
    max: [new Date().getFullYear() + 5, 'Release year cannot be more than 5 years in the future'],
    validate: {
      validator: Number.isInteger,
      message: 'Release year must be an integer'
    }
  },
  releaseMonth: {
    type: Number,
    min: [1, 'Release month must be between 1 and 12'],
    max: [12, 'Release month must be between 1 and 12'],
    validate: {
      validator: Number.isInteger,
      message: 'Release month must be an integer'
    }
  },
  genre: {
    type: [String],
    required: [true, 'Genre is required'],
    validate: {
      validator: function(genres) {
        return genres.length > 0 && genres.every(genre => VALID_GENRES.includes(genre));
      },
      message: 'Invalid genre. Must be one of: ' + VALID_GENRES.join(', ')
    }
  },
  director: {
    type: String,
    required: [true, 'Director is required'],
    trim: true
  },
  cast: {
    type: [String],
    required: [true, 'Cast is required'],
    validate: {
      validator: function(cast) {
        return cast.length > 0 && cast.every(member => member.trim().length > 0);
      },
      message: 'Cast must contain at least one member and cannot be empty strings'
    }
  },
  posterUrl: {
    type: String,
    required: [true, 'Poster URL is required'],
    trim: true,
    validate: {
      validator: function(url) {
        try {
          new URL(url);
          return true;
        } catch (error) {
          return false;
        }
      },
      message: 'Invalid poster URL'
    }
  },
  bannerUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(url) {
        if (!url) return true; // Allow empty as it's not required
        try {
          new URL(url);
          return true;
        } catch (error) {
          return false;
        }
      },
      message: 'Invalid banner URL'
    }
  },
  trailerUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(url) {
        if (!url) return true; // Allow empty as it's not required
        try {
          new URL(url);
          return true;
        } catch (error) {
          return false;
        }
      },
      message: 'Invalid trailer URL'
    }
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add text index for search functionality
movieSchema.index({ title: 'text', description: 'text' });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie; 