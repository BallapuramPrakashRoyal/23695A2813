const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Import custom logging middleware
const logger = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger); // Use custom logging middleware

// In-memory storage (replace with database in production)
let urlDatabase = {};
let clickAnalytics = {};

// Utility functions
function generateShortCode(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isShortCodeAvailable(shortCode) {
  return !urlDatabase[shortCode];
}

function isUrlExpired(expiryDate) {
  return new Date() > new Date(expiryDate);
}

// API Endpoints

// Create Short URL
app.post('/shorturls', (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  // Validate URL
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({
      error: 'Invalid URL format',
      message: 'Please provide a valid URL'
    });
  }

  let finalShortCode;

  // Handle custom shortcode
  if (shortcode) {
    if (typeof shortcode !== 'string' || shortcode.length < 4 || shortcode.length > 10) {
      return res.status(400).json({
        error: 'Invalid shortcode',
        message: 'Shortcode must be between 4-10 characters'
      });
    }
    
    if (!isShortCodeAvailable(shortcode)) {
      return res.status(409).json({
        error: 'Shortcode collision',
        message: 'The provided shortcode is already in use'
      });
    }
    
    finalShortCode = shortcode;
  } else {
    // Generate unique shortcode
    do {
      finalShortCode = generateShortCode();
    } while (!isShortCodeAvailable(finalShortCode));
  }

  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + validity);

  // Store URL data
  urlDatabase[finalShortCode] = {
    originalUrl: url,
    shortCode: finalShortCode,
    createdAt: new Date().toISOString(),
    expiryDate: expiryDate.toISOString(),
    validity: validity
  };

  // Initialize analytics
  clickAnalytics[finalShortCode] = {
    totalClicks: 0,
    clicks: []
  };

  res.status(201).json({
    shortLink: `http://localhost:${PORT}/${finalShortCode}`,
    expiry: expiryDate.toISOString()
  });
});

// Redirect to original URL
app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  
  if (!urlDatabase[shortCode]) {
    return res.status(404).json({
      error: 'Short URL not found',
      message: 'The requested short URL does not exist'
    });
  }

  const urlData = urlDatabase[shortCode];
  
  // Check if expired
  if (isUrlExpired(urlData.expiryDate)) {
    return res.status(410).json({
      error: 'Short URL expired',
      message: 'The requested short URL has expired'
    });
  }

  // Record click analytics
  const clickData = {
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || 'Unknown',
    referer: req.headers.referer || 'Direct',
    ip: req.ip || req.connection.remoteAddress || 'Unknown',
    location: 'Unknown' // In production, use IP geolocation service
  };

  clickAnalytics[shortCode].totalClicks++;
  clickAnalytics[shortCode].clicks.push(clickData);

  // Redirect to original URL
  res.redirect(urlData.originalUrl);
});

// Retrieve Short URL Statistics
app.get('/shorturls/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  
  if (!urlDatabase[shortCode]) {
    return res.status(404).json({
      error: 'Short URL not found',
      message: 'The requested short URL does not exist'
    });
  }

  const urlData = urlDatabase[shortCode];
  const analytics = clickAnalytics[shortCode];

  res.json({
    shortCode: shortCode,
    originalUrl: urlData.originalUrl,
    shortLink: `http://localhost:${PORT}/${shortCode}`,
    createdAt: urlData.createdAt,
    expiryDate: urlData.expiryDate,
    isExpired: isUrlExpired(urlData.expiryDate),
    totalClicks: analytics.totalClicks,
    recentClicks: analytics.clicks.slice(-10), // Last 10 clicks
    clickDetails: analytics.clicks
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'URL Shortener Microservice'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// Handle 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

app.listen(PORT, () => {
  console.log(`URL Shortener Microservice running on http://localhost:${PORT}`);
});

module.exports = app;

// package.json
/*
{
  "name": "url-shortener-microservice",
  "version": "1.0.0",
  "description": "HTTP URL Shortener Microservice with Analytics",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.5.0",
    "supertest": "^6.3.3"
  },
  "keywords": ["url-shortener", "microservice", "node.js", "express"],
  "author": "Campus Hiring Candidate",
  "license": "MIT"
}
*/
