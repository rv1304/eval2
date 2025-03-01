const mongoose = require('mongoose');

const PollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  options: [{ text: String, votes: { type: Number, default: 0 } }],
  isAnonymous: { type: Boolean, default: false },
  endTime: Date,
  sentiment: Object,
  creatorId: { type: String, required: true }, // Added creatorId
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Poll', PollSchema);