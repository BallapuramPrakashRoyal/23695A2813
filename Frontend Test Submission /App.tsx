import React, { useState, useEffect } from 'react';
import { Link, Copy, BarChart3, Clock, ExternalLink, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const App = () => {
  const [url, setUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [validity, setValidity] = useState(30);
  const [shortLink, setShortLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const API_BASE = 'http://localhost:3001';

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const createShortUrl = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/shorturls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          validity: parseInt(validity),
          shortcode: shortCode.trim() || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShortLink(data.shortLink);
        setSuccess('Short URL created successfully!');
        setUrl('');
        setShortCode('');
      } else {
        setError(data.message || 'Failed to create short URL');
      }
    } catch (err) {
      setError('Network error. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const getAnalytics = async () => {
    if (!shortLink) return;

    const shortCode = shortLink.split('/').pop();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/shorturls/${shortCode}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
        setShowAnalytics(true);
      } else {
        setError(data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Network error. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      createShortUrl();
    }
  };

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4\">
      <div className=\"max-w-4xl mx-auto\">
        {/* Header */}
        <div className=\"text-center mb-8\">
          <div className=\"flex justify-center items-center mb-4\">
            <Link className=\"w-12 h-12 text-blue-600 mr-3\" />
            <h1 className=\"text-4xl font-bold text-gray-800\">URL Shortener</h1>
          </div>
          <p className=\"text-gray-600 text-lg\">Transform your long URLs into short, manageable links</p>
        </div>

        {/* Main Card */}
        <div className=\"bg-white rounded-xl shadow-lg p-6 mb-6\">
          <div className=\"space-y-4\">
            {/* URL Input */}
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                Enter URL to shorten
              </label>
              <input
                type=\"url\"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder=\"https://example.com/very-long-url\"
                className=\"w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all\"
              />
            </div>

            {/* Advanced Options */}
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Custom Short Code (Optional)
                </label>
                <input
                  type=\"text\"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  placeholder=\"custom-code\"
                  className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all\"
                />
              </div>
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Validity (Minutes)
                </label>
                <input
                  type=\"number\"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  min=\"1\"
                  max=\"43200\"
                  className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all\"
                />
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={createShortUrl}
              disabled={loading || !url.trim()}
              className=\"w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2\"
            >
              {loading ? (
                <>
                  <Loader className=\"w-5 h-5 animate-spin\" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Link className=\"w-5 h-5\" />
                  <span>Create Short URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className=\"bg-red-50 border border-red-200 rounded-lg p-4 mb-6\">
            <div className=\"flex items-center space-x-2 text-red-700\">
              <AlertCircle className=\"w-5 h-5\" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className=\"bg-green-50 border border-green-200 rounded-lg p-4 mb-6\">
            <div className=\"flex items-center space-x-2 text-green-700\">
              <CheckCircle className=\"w-5 h-5\" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Result */}
        {shortLink && (
          <div className=\"bg-white rounded-xl shadow-lg p-6 mb-6\">
            <h3 className=\"text-lg font-semibold text-gray-800 mb-4\">Your Short URL</h3>
            <div className=\"flex items-center space-x-2 p-3 bg-gray-50 rounded-lg mb-4\">
              <input
                type=\"text\"
                value={shortLink}
                readOnly
                className=\"flex-1 bg-transparent outline-none text-blue-600 font-medium\"
              />
              <button
                onClick={copyToClipboard}
                className=\"p-2 text-gray-500 hover:text-blue-600 transition-colors\"
                title=\"Copy to clipboard\"
              >
                <Copy className=\"w-5 h-5\" />
              </button>
              <a
                href={shortLink}
                target=\"_blank\"
                rel=\"noopener noreferrer\"
                className=\"p-2 text-gray-500 hover:text-blue-600 transition-colors\"
                title=\"Open in new tab\"
              >
                <ExternalLink className=\"w-5 h-5\" />
              </a>
            </div>
            <div className=\"flex space-x-2\">
              <button
                onClick={getAnalytics}
                disabled={loading}
                className=\"flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400\"
              >
                <BarChart3 className=\"w-4 h-4\" />
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        )}

        {/* Analytics */}
        {showAnalytics && analytics && (
          <div className=\"bg-white rounded-xl shadow-lg p-6\">
            <h3 className=\"text-lg font-semibold text-gray-800 mb-4\">Analytics</h3>
            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6\">
              <div className=\"bg-blue-50 p-4 rounded-lg\">
                <div className=\"text-2xl font-bold text-blue-600\">{analytics.totalClicks}</div>
                <div className=\"text-sm text-gray-600\">Total Clicks</div>
              </div>
              <div className=\"bg-green-50 p-4 rounded-lg\">
                <div className=\"text-sm font-medium text-green-600\">
                  {analytics.isExpired ? 'Expired' : 'Active'}
                </div>
                <div className=\"text-sm text-gray-600\">Status</div>
              </div>
              <div className=\"bg-purple-50 p-4 rounded-lg\">
                <div className=\"text-sm font-medium text-purple-600\">
                  {new Date(analytics.createdAt).toLocaleDateString()}
                </div>
                <div className=\"text-sm text-gray-600\">Created</div>
              </div>
              <div className=\"bg-orange-50 p-4 rounded-lg\">
                <div className=\"text-sm font-medium text-orange-600\">
                  {new Date(analytics.expiryDate).toLocaleDateString()}
                </div>
                <div className=\"text-sm text-gray-600\">Expires</div>
              </div>
            </div>

            <div className=\"border-t pt-4\">
              <h4 className=\"font-semibold text-gray-700 mb-3\">Original URL</h4>
              <p className=\"text-gray-600 break-all\">{analytics.originalUrl}</p>
            </div>

            {analytics.recentClicks && analytics.recentClicks.length > 0 && (
              <div className=\"border-t pt-4 mt-4\">
                <h4 className=\"font-semibold text-gray-700 mb-3\">Recent Clicks</h4>
                <div className=\"space-y-2 max-h-60 overflow-y-auto\">
                  {analytics.recentClicks.map((click, index) => (
                    <div key={index} className=\"flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm\">
                      <div className=\"flex items-center space-x-2\">
                        <Clock className=\"w-4 h-4 text-gray-400\" />
                        <span>{new Date(click.timestamp).toLocaleString()}</span>
                      </div>
                      <div className=\"text-gray-500 truncate max-w-xs\">
                        {click.referer !== 'Direct' ? click.referer : 'Direct access'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className=\"text-center mt-8 text-gray-500 text-sm\">
          <p>© 2025 URL Shortener - Campus Hiring Technical Assessment</p>
        </div>
      </div>
    </div>
  );
};

export default App;
