# QuizVerse-AI_Quiz_builder

QuizVerse-AI_Quiz_builder is a web application that allows users to generate, take, share, and track multiple-choice quizzes powered by AI. The platform provides an interactive and social experience for quiz lovers, educators, and anyone wanting to test their knowledge on any topic.

---

## Features

- **AI-Powered Quiz Generation:**  
  Instantly generate multiple-choice quizzes on any topic by specifying your subject and the number of questions.

- **User Authentication:**  
  Register and log in to access personalized quiz features and history.

- **Quiz History Tracking:**  
  View your previous quiz attempts, scores, and details through a comprehensive history dashboard.

- **Quiz Sharing:**  
  Share custom quizzes with friends by username and take quizzes shared by others.

- **Leaderboard:**  
  Compete with other users and view the leaderboard for top scores.

- **Theme Toggle:**  
  Switch between light and dark themes for a personalized experience.
---

## Usage

1. **Register** for an account or log in.
2. Enter a quiz topic and the number of questions, then click "Generate Quiz."
3. Answer the questions. Your score and history will be saved.
4. Share your quiz with friends or take quizzes shared with you.
5. View your quiz history and check the leaderboard.

---

## API Endpoints (Backend)

- `POST /generate-quiz` — Generate a quiz (JWT Auth required)
- `POST /quiz-history` — Save quiz results
- `GET /quiz-history/:userId` — Fetch user's quiz history
- `POST /share-quiz` — Share a quiz with another user
- `GET /share-quiz/:userId` — Get quizzes shared with a user

---

## Output screenshots are available in outputs folder

## Acknowledgements

- Uses [OpenRouter AI](https://openrouter.ai/) for quiz question generation.
- Built with JavaScript (frontend and backend), Node.js, and PostgreSQL.

---

## Contact

For support or inquiries, reach out to [sssujaynithish on GitHub](https://github.com/sssujaynithish).
