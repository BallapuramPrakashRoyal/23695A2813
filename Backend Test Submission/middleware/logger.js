const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.logFile = path.join(this.logDir, 'application.log');
    this.errorLogFile = path.join(this.logDir, 'error.log');
    this.accessLogFile = path.join(this.logDir, 'access.log');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Format log entry
  formatLogEntry(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...metadata
    };
    
    return JSON.stringify(logEntry) + '\n';
  }

  // Write to log file
  writeToFile(filename, content) {
    try {
      fs.appendFileSync(filename, content);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  // Log levels
  info(message, metadata = {}) {
    const logEntry = this.formatLogEntry('INFO', message, metadata);
    this.writeToFile(this.logFile, logEntry);
    console.log(`[INFO] ${message}`, metadata);
  }

  error(message, metadata = {}) {
    const logEntry = this.formatLogEntry('ERROR', message, metadata);
    this.writeToFile(this.errorLogFile, logEntry);
    this.writeToFile(this.logFile, logEntry);
    console.error(`[ERROR] ${message}`, metadata);
  }

  warn(message, metadata = {}) {
    const logEntry = this.formatLogEntry('WARN', message, metadata);
    this.writeToFile(this.logFile, logEntry);
    console.warn(`[WARN] ${message}`, metadata);
  }

  debug(message, metadata = {}) {
    const logEntry = this.formatLogEntry('DEBUG', message, metadata);
    this.writeToFile(this.logFile, logEntry);
    console.debug(`[DEBUG] ${message}`, metadata);
  }

  // HTTP Access logging
  logAccess(req, res, responseTime) {
    const logEntry = this.formatLogEntry('ACCESS', 'HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown',
      referer: req.headers.referer || 'Direct'
    });
    
    this.writeToFile(this.accessLogFile, logEntry);
  }
}

// Create logger instance
const logger = new Logger();

// Express middleware function
const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress || 'Unknown',
    userAgent: req.headers['user-agent'] || 'Unknown'
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info('Response Sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    });
    
    // Log to access log
    logger.logAccess(req, res, responseTime);
    
    return originalJson.call(this, data);
  };

  // Override res.redirect to log redirects
  const originalRedirect = res.redirect;
  res.redirect = function(url) {
    const responseTime = Date.now() - startTime;
    
    logger.info('Redirect Response', {
      method: req.method,
      originalUrl: req.url,
      redirectTo: url,
      statusCode: 302,
      responseTime: `${responseTime}ms`
    });
    
    // Log to access log
    logger.logAccess(req, res, responseTime);
    
    return originalRedirect.call(this, url);
  };

  // Handle response end for other types of responses
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Only log if not already logged by json() or redirect()
    if (!res.headersSent || res.statusCode >= 400) {
      logger.info('Response Completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`
      });
      
      logger.logAccess(req, res, responseTime);
    }
  });

  // Handle errors
  res.on('error', (err) => {
    logger.error('Response Error', {
      method: req.method,
      url: req.url,
      error: err.message,
      stack: err.stack
    });
  });

  next();
};

// Export both the middleware and the logger instance
module.exports = loggingMiddleware;
module.exports.logger = logger;

// Additional utility functions
module.exports.logError = (error, context = {}) => {
  logger.error(error.message || error, {
    stack: error.stack,
    ...context
  });
};

module.exports.logInfo = (message, context = {}) => {
  logger.info(message, context);
};

module.exports.logWarn = (message, context = {}) => {
  logger.warn(message, context);
};

module.exports.logDebug = (message, context = {}) => {
  logger.debug(message, context);
};
