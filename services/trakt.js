// perform searches against the trakt api

var request = require('request-promise');
var options = {
  transform: function(body) {
    return JSON.parse(body)[0];
  },
  headers: {
    'Content-Type': 'application/json',
    'trakt-api-version': '2',
    'trakt-api-key': process.env.TRAKT_CLIENT_ID
  }
};

function url(terms) {
  return `https://api-v2launch.trakt.tv/search?type=movie,show&query=${encodeURIComponent(terms)}`;
}

module.exports = {
  search: function(query) {
    return request(url(query), options);
  }
};
