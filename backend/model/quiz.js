const mongoose = require('mongoose');
mongoose.set('strictPopulate', false); 

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['poll', 'q&a'],
    required: true,
  },
  impressions: {
    type: Number,
    default: 0,
  },
  isTrending: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  creator: { type: String},
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
