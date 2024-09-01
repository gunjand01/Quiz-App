const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: function() {
      return this.type === 'q&a';
    },
  },
  countAttempted: {
    type: Number,
  },
  timer: {
    type: Number,
    default: null,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  optionsCount: [Number],
  options: [{
    text: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isCorrect: {
      type: Boolean,
      default: false,
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
