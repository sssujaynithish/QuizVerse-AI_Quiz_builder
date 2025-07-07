let questions = [];

let currInd = 0;
let score = 0;
const themeLink = document.getElementById('theme-stylesheet');


function signupUser(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!username || !email || !password) {
        alert("Enter all fields");
        return;
    }

    fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: username, email: email, password: password })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
        })
        .catch(err => {
            console.error("signup error:", err);
        });
}

function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("enter all fields");
        return;
    }

    fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, password: password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.username);
                localStorage.setItem("userId", data.userId);

                window.location.href = "index.html";
            }
            else {
                alert(data.error || "login failed");
            }
        })
        .catch(err => {
            console.error("login error:", err);
        });
}

function logout() {
    localStorage.removeItem("token");
    alert("logged out");
    window.location.href = "login.html";
}

window.onload = function () {
    const username = localStorage.getItem("username");

    if (username) {
        document.getElementById("welcome-user").textContent = `Welcome, ${username}`;
        loadLeaderboard();
    }
    else {
        window.location.href = "login.html";
    }
    document.getElementById("submit-button").style.display = "none";
    document.getElementById("history-container").style.display = "none";
    document.getElementById("shared-quiz-container").style.display = "none";
}

function suffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showQuestion() {
    let q = questions[currInd];
    document.getElementById("question-number").innerHTML = `Question ${currInd + 1}/${questions.length}`;
    document.getElementById("question").innerHTML = q.question;

    let optionContainer = document.getElementById("quiz-option-container");
    optionContainer.innerHTML = "";

    q.options.forEach((option, i) => {
        const optionHTML = `
        <label>
            <input type="radio" name="option" value="${option}"/>  ${option}
        </label><br>
        `;
        optionContainer.innerHTML += optionHTML;
        document.getElementById("answer").innerHTML = "";
    });
}

function calculateScore() {
    const q = questions[currInd];
    let options = document.getElementsByName("option");
    let selectedOption = null;

    for (let i = 0; i < options.length; i++) {
        if (options[i].checked) {
            selectedOption = options[i].value;
            break;
        }
    }

    if (selectedOption === null) {
        document.getElementById("answer").innerHTML = "Select option first";
    }
    else if (selectedOption === q.answer) {
        score++;
        document.getElementById("answer").innerHTML = "Your answer is correct!";
    }
    else {
        document.getElementById("answer").innerHTML = "Your answer is wrong";
    }
}

function nextQuestion() {
    currInd++;
    if (currInd < questions.length) {
        showQuestion();
    }
    else {
        document.getElementById("question").innerHTML = "Quiz Finished!";
        const optionContainer = document.getElementById("quiz-option-container");
        optionContainer.innerHTML = "";

        const imageHTML = `
            <img src="https://media.tenor.com/FkII0MF9ySoAAAAj/rabbit-sticker-bunny-sticker.gif" 
                 alt="Congrats" />
        `;
        optionContainer.innerHTML = imageHTML;

        document.getElementById("answer").innerHTML = `Your Score: ${score}`;

        const topic = document.getElementById("quiz-topic").value;
        saveQuizHistory(score, questions.length, topic);

    }
}

function resetQuiz() {
    currInd = 0;
    score = 0;
    suffleArray(questions);
    showQuestion();
}

function generateQuiz() {
    const topic = document.getElementById("quiz-topic").value;
    const noOfQuestions = document.getElementById("no-of-question").value;
    const token = localStorage.getItem("token");


    if (!topic || !noOfQuestions) {
        alert("Please Enter a topic and No. of Questions");
        return;
    }

    document.getElementById("loader").style.display = "block";

    fetch("http://localhost:5000/generate-quiz", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ topic: topic, noOfQuestions: noOfQuestions })
    })
        .then((res) => res.json())
        .then((data) => {
            suffleArray(data);
            questions = data;
            currInd = 0;
            score = 0;
            showQuestion();

            document.getElementById("submit-button").style.display = "inline-block";
            document.getElementById("next-button").style.display = "inline-block";
            document.getElementById("reset-button").style.display = "inline-block";
            document.getElementById("share-button").style.display = "inline-block";
        })
        .catch((err) => {
            console.error("Error: ", err);
            alert("Failed to fetch quiz");
        })
        .finally(() => {
            document.getElementById("loader").style.display = "none";
        });
}

function saveQuizHistory(score, totalQuestions, topic) {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!userId) return;

    fetch("http://localhost:5000/quiz-history", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, topic, score, totalQuestions })
    })
        .then(res => res.json())
        .then(data => console.log("Quiz history saved!", data))
        .catch(err => console.error("Error saving history:", err));
}


function loadQuizHistory() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        alert("Please login to view your quiz history.");
        window.location.href = "login.html";
        return;
    }

    document.getElementById("history-container").style.display = "block";

    fetch(`http://localhost:5000/quiz-history/${userId}`)
        .then(res => res.json())
        .then(data => {
            const tableBody = document.getElementById("history-table-body");
            tableBody.innerHTML = "";

            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4">No quiz history yet</td></tr>`;
            } else {
                data.forEach(record => {
                    const row = `
                        <tr>
                            <td>${record.topic}</td>
                            <td>${record.score}</td>
                            <td>${record.total_questions}</td>
                            <td>${new Date(record.taken_at).toLocaleString()}</td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
            }
        })
        .catch(err => {
            console.error("Failed to fetch history:", err);
            alert("Unable to load history right now.");
        });
};

function loadLeaderboard() {
    fetch("http://localhost:5000/leaderboard")
        .then(res => res.json())
        .then(data => {
            const tableBody = document.getElementById("leaderboard-table-body");
            tableBody.innerHTML = "";

            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4">No leaderboard data yet</td></tr>`;
            }
            else {
                data.forEach((entry, index) => {
                    const crown = index === 0 ? " 👑" : "";
                    const row = `
                        <tr>
                            <td>${crown} ${entry.username}</td>
                            <td>${entry.topic}</td>
                            <td>${entry.score}</td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
            }
        })
        .catch(err => {
            console.error("Failed to fetch leaderboard:", err);
            alert("Unable to load leaderboard.");
        });
}


function shareQuiz() {
    const senderId = localStorage.getItem("userId");
    const receiverName = prompt("Enter your friend username");
    const topic = document.getElementById("quiz-topic").value;

    fetch("http://localhost:5000/share-quiz", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ senderId: senderId, receiverName: receiverName, topic: topic, questions: questions })
    })
        .then((res) => res.json())
        .then(data => {
            alert(data.message);
        })
        .catch(err => {
            console.log("Error in sharing quiz : ", err);
        });
}

function loadSharedQuizzes() {
    const userId = localStorage.getItem("userId");

    const sharedQuizContainer = document.getElementById("shared-quiz-container");

    sharedQuizContainer.innerHTML = "";

    fetch(`http://localhost:5000/share-quiz/${userId}`)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                alert("No shared quizzes found.");
                return;
            }
            document.getElementById("shared-quiz-container").style.display = "block";
            document.getElementById("quiz-topic").placeholder = data[0].topic;
            data.forEach((quiz, index) => {
                const quizBox = document.createElement("div");
                quizBox.classList.add("quiz-box");

                quizBox.innerHTML = `
                    <p>
                        📩 <strong>${quiz.sender_name}</strong> shared a quiz on 
                        <strong>${quiz.topic}</strong>
                    </p>
                    <button class="button-style" id="take-btn-${index}">Take Quiz</button>
                `;

                sharedQuizContainer.appendChild(quizBox);

                // Add click listener to the "Take Quiz" button
                document.getElementById(`take-btn-${index}`).addEventListener("click", () => {
                    questions = quiz.questions;
                    currInd = 0;
                    score = 0;
                    document.getElementById("quiz-topic").value = quiz.topic;
                    showQuestion();
                    document.getElementById("submit-button").style.display = "block";

                });
            });
        })
        .catch(err => {
            console.error("Error fetching shared quizzes:", err);
            alert("Failed to load shared quizzes.");
        });
    loadLeaderboard();
}

window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "style.css";
    themeLink.href = savedTheme;
    currentTheme = savedTheme;
  });

  function toggleTheme() {
    if (currentTheme === "style.css") {
      themeLink.href = "style2.css";
      currentTheme = "style2.css";
    } else {
      themeLink.href = "style.css";
      currentTheme = "style.css";
    }

    localStorage.setItem("theme", currentTheme);
  }