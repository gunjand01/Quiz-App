const Quiz = require('../model/quiz');
const Question = require('../model/question');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Create a new quiz with metadata
exports.createQuiz = async (req, res) => {
  try {
    const { title, type, questions } = req.body;
    const userId = req.user._id;

    // Create the quiz first
    const quiz = new Quiz({ title, type, userId });
    await quiz.save();

    // If there are questions in the request, create them and add to the quiz
    if (questions && questions.length > 0) {
      const questionIds = [];

      for (const questionData of questions) {
        const newQuestion = new Question({ ...questionData, quizId: quiz._id });
        await newQuestion.save();
        questionIds.push(newQuestion._id);
      }

      // Update the quiz with the question IDs
      quiz.questions = questionIds;
      await quiz.save();
    }

    res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quiz', details: error.message });
  }
};

// Add questions to an existing quiz
exports.addQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questions } = req.body;

    if (questions.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 questions are allowed.' });
    }

    // Find the quiz by ID
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Create the questions and associate them with the quiz
    const questionPromises = questions.map(question => {
      const newQuestion = new Question({ ...question, quizId: quiz._id });
      return newQuestion.save();
    });

    await Promise.all(questionPromises);

    res.status(201).json({ message: 'Questions added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add questions', details: error.message });
  }
};
  

// Get a quiz by ID
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate({
      path: 'questions',
      strictPopulate: false // Disable strict checks for this population
    });
    console.log(quiz);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get quiz', details: error.message });
  }
};

// Edit a quiz (limited to editing questions and timers)
exports.editQuiz = async (req, res) => {
  try {
    const { questions } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Edit each question
    for (const question of questions) {
      await Question.findByIdAndUpdate(question._id, {
        text: question.text,
        options: question.options,
        timer: question.timer,
      });
    }

    res.status(200).json({ message: 'Quiz updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit quiz', details: error.message });
  }
};

// Delete a quiz
exports.deleteQuiz = async (req, res) => {
  try {
    console.log(req.params.id);
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Delete all associated questions
    await Question.deleteMany({ quizId: quiz._id });

    // Delete the quiz
    await quiz.deleteOne();

    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz', details: error.message });
  }
};

// Get all quizzes (for dashboard)
// exports.getAllQuizzes = async (req, res) => {
//   try {
//     console.log('User ID:', req.user.id);
//     const quizzes = await Quiz.find({ creator: '66c5f49ade51653762b823e8'});
//     console.log('Fetched Quizzes:', quizzes);
//     res.status(200).json(quizzes);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get quizzes', details: error.message });
//   }
// };

exports.getAllQuizzes = async (req, res) => {
  try {
    console.log('User ID:', req.user.id);

    // Convert user ID to ObjectId if needed
    // const creatorId = new mongoose.Types.ObjectId(req.user.id);  

    const quizzes = await Quiz.find({ userId : req.user._id });

    // console.log('Fetched Quizzes:', quizzes);

    if (!quizzes.length) {
      return res.status(404).json({ message: 'No quizzes found' });
    }

    res.status(200).json({ quizzes }); // Return quizzes wrapped in an object
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to get quizzes', details: error.message });
  }
};


// Get questions and options for a specific quiz by quiz ID
exports.getQuestionsByQuizId = async (req, res) => {
  try {
    const quizId = new ObjectId(req.params.quizId); // Use 'new' to create an ObjectId
    const questions = await Question.find({ quizId: quizId });

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this quiz' });
    }

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get questions', details: error.message });
  }
};

exports.updateQuizWithUserAnswers = async (req, res) => {
  try {
    const { userAnswers, quizId } = req.body;
    let score = 0;
    const quizDetails = await Quiz.findById(quizId);
    if (quizDetails.quizType == "QA") {
      for (let i = 0; i < quizDetails?.questions?.length; i++) {
        if (
          quizDetails?.questions[i].answer == userAnswers[i] ||
          quizDetails?.questions[i].answer == userAnswers[i]?.split(",")[0]
        ) {
          quizDetails.questions[i].correctlyAnswered =
            quizDetails.questions[i].correctlyAnswered + 1;
          score++;
        } else {
          quizDetails.questions[i].wronglyAnswered =
            quizDetails.questions[i].wronglyAnswered + 1;
        }
        quizDetails.questions[i].countAttempted =
          quizDetails.questions[i].countAttempted + 1;
      }
    } else {
      for (let i = 0; i < quizDetails?.questions?.length; i++) {
        const index = userAnswers[i];
        quizDetails.questions[i].optionsCount[index - 1] =
          (quizDetails.questions[i].optionsCount[index - 1] || 0) + 1;
      }
    }
    await quizDetails.save();
    res.status(200).json({ success: true, score });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.getQuizAndIncrementImpressions = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Find the quiz by ID and increment the impressions field
    const quiz = await Quiz.findByIdAndUpdate(
      quizId,
      { $inc: { impressions: 1 } }, // Increment impressions by 1
      { new: true } // Return the updated quiz document
    ).populate('questions'); // Optionally populate questions

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch and increment impressions', details: error.message });
  }
};

exports.getQuizAnalysis = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Fetch the quiz and associated questions
    const quiz = await Quiz.findById(quizId);
    const questions = await Question.find({ quizId });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Prepare the analysis data
    const analysisData = questions.map((question) => {
      if (quiz.type === 'q&a') {
        // For Q&A type quizzes, count correct and wrong answers
        const correctCount = question.optionsCount.reduce(
          (count, optionIndex) => count + (question.options[optionIndex].isCorrect ? 1 : 0),
          0
        );
        const wrongCount = question.countAttempted - correctCount;

        return {
          question: question.question,
          correctCount,
          wrongCount,
        };
      } else if (quiz.type === 'poll') {
        // For Poll type quizzes, count selections for each option
        const optionCounts = question.options.map((option, index) => ({
          option: option.text,
          count: question.optionsCount[index] || 0,
        }));

        return {
          question: question.question,
          optionCounts,
        };
      }
    });

    // Send the analysis data as response
    res.json({ quizTitle: quiz.title, analysisData });
  } catch (error) {
    console.error('Error fetching quiz analysis:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// exports.getQuestionsByQuizId = async (req, res) => {
//   try {
//     // Find all quizzes that have associated questions
//     const quizzesWithQuestions = await Quiz.find()
//       .populate({
//         path: 'questions',
//         match: { $exists: true, $ne: [] },  // Ensure that the quiz has at least one question
//       })
//       .lean();  // Return plain JavaScript objects instead of Mongoose documents

//     // Filter out quizzes that have no questions
//     const filteredQuizzes = quizzesWithQuestions.filter(quiz => quiz.questions && quiz.questions.length > 0);
//       console.log(filteredQuizzes);
//     if (filteredQuizzes.length === 0) {
//       return res.status(404).json({ error: 'No quizzes with questions found' });
//     }

//     res.status(200).json({ quizzes: filteredQuizzes });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get quizzes with questions', details: error.message });
//   }
// };
