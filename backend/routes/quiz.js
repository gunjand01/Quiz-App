const express = require("express");
const {
  createQuiz,
  addQuestions,
  getQuizById,
  editQuiz,
  deleteQuiz,
  getAllQuizzes,
  getQuestionsByQuizId,
  updateQuizWithUserAnswers,
  getQuizAndIncrementImpressions,
  getQuizAnalysis
} = require("../controllers/quiz");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Route for creating quiz metadata
router.post("/quizzes", protect, createQuiz);

// Route for adding questions to an existing quiz (requires authentication)
router.post("/quizzes/:quizId/questions", protect, addQuestions);

// Get all quizzes created by the logged-in user (dashboard view)
router.get("/quizzes", protect, getAllQuizzes);

// Get a specific quiz by ID (for viewing or taking the quiz)
router.get("/quizzes/:id", getQuizById);

// Route to get questions and their options for a specific quiz
router.get("/question/:quizId", getQuestionsByQuizId);

//Route for Question Analysis
router.get("/analysis/:quizId", getQuizAnalysis);

// Route to get a quiz and increment impressions
router.get('/quizzes/:quizId', getQuizAndIncrementImpressions);

router.post("/updateQuizWithUserAnswers", updateQuizWithUserAnswers);

// Edit a quiz by ID (requires authentication)
router.put("/quizzes/:id", protect, editQuiz);

// Delete a quiz by ID (requires authentication)
router.delete("/quizzes/:id" , deleteQuiz);

module.exports = router;
