require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middleware/auth");


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})


//create express app
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

//signup route
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await pool.query(
            "SELECT * FROM users where email = $1",
            [email]
        );
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO USERS (name, email, password) VALUES ($1, $2, $3)",
            [username, email, hashedPassword]
        );
        res.status(201).json({ message: "user registered successfully" });
    }
    catch (err) {
        console.error("Signup error : ", err.message);
        res.status(500).json({ error: "something went wrong" });
    }
});

//login route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(400).json({ error: "user not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid password" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "login successful", token: token, username: user.name, userId: user.id });
    }
    catch (err) {
        console.error("login error:", err);
        res.status(500).json({ error: "something went wrong during login" });
    }
});

//generate quiz route
app.post("/generate-quiz", verifyToken, async (req, res) => {
    const { topic, noOfQuestions } = req.body;

    const prompt = `Generate ${noOfQuestions} multiple choice questions about "${topic}" in JSON format:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "answer": "Correct Answer"
  },
  ...
]
Return ONLY the JSON array without explanation.`;

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "mistralai/mistral-small-3.2-24b-instruct:free",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:8080"  // must match frontend
                },
                timeout: 30000,
            }
        );

        let rawText = response.data.choices[0].message.content;

        if (rawText.startsWith("```")) {
            rawText = rawText.replace(/```json|```/g, "").trim();
        }

        let quizJSON;
        try {
            quizJSON = JSON.parse(rawText);
            res.json(quizJSON);
        } catch (err) {
            console.error("Parsing error:", rawText);
            res.status(500).json({ error: "Invalid JSON format from AI" });
        }


    }
    catch (error) {
        console.error("Error generating quiz: ", error.message);
        res.status(500).json({ error: "Failed to generate quiz" });
    }

});


//save quiz history route
app.post("/quiz-history", async (req, res) => {
    const { userId, topic, score, totalQuestions } = req.body;

    try {
        await pool.query(
            "INSERT INTO quiz_history (user_id, topic, score, total_questions) VALUES ($1, $2, $3, $4)",
            [userId, topic, score, totalQuestions]
        );
        res.status(201).json({ message: "Quiz history saved!" });
    }
    catch (err) {
        console.error("Error saving quiz history:", err.message);
        res.status(500).json({ error: "Failed to save history" });
    }
});


//retrive past quiz history
app.get("/quiz-history/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const result = await pool.query(
            "SELECT * FROM quiz_history WHERE user_id = $1 ORDER BY taken_at DESC",
            [userId]
        );
        res.status(200).json(result.rows);
    }
    catch (err) {
        console.error("Error fetching history:", err.message);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});


app.get("/leaderboard", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.name AS username, q.topic, q.score
            from quiz_history q
            JOIN users u ON q.user_id = u.id
            ORDER BY q.score DESC
            LIMIT 10;
            `);

        res.json(result.rows);
    }
    catch (err) {
        console.error("Leaderboard fetch error:", err);
        res.status(500).json({ error: "Failed to load leaderboard" });
    }
});


app.post("/share-quiz", async (req, res) => {
    const senderId = req.body.senderId;
    const receiverName = req.body.receiverName;
    const topic = req.body.topic;
    const questions = req.body.questions;

    const receiverResult = await pool.query(
        "SELECT id from users where name = $1",
        [receiverName]
    );

    const receiverId = receiverResult.rows[0].id;

    await pool.query(
        "INSERT INTO shared_quizzes (sender_id, receiver_id, topic, questions) VALUES ($1,$2,$3,$4)",
        [senderId,receiverId, topic,JSON.stringify(questions)]
        );

    res.json({message:"Quiz shared successfully"});

})

app.get("/share-quiz/:userId", async (req,res)=>{
    const userId = req.params.userId;

    const result = await pool.query(
            `SELECT sq.id, sq.topic, sq.questions, sq.timestamp, u.name AS sender_name
             FROM shared_quizzes sq
             JOIN users u ON sq.sender_id = u.id
             WHERE sq.receiver_id = $1
             ORDER BY sq.timestamp DESC`,
            [userId]
        );

        res.status(200).json(result.rows);
})


//start the server listening on the port
app.listen(PORT, () => {
    console.log("server is running");
})