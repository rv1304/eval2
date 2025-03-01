const Sentiment = require('sentiment');
const sentiment = new Sentiment();

module.exports = {
  analyze: (text) => {
    return sentiment.analyze(text);
  }
};