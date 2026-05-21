const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const pool = require("./db");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
app.use(cors({
  origin: "*"
}));
app.use(express.json());
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secret123");

    req.userId = decoded.userId; // attach to request

    next(); // continue to route
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
app.get("/me", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route working",
    userId: req.userId,
  });
});
// Test route
app.get("/", (req, res) => {
  res.send("API working ");
});

// Signup route
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into DB
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
      [email, hashedPassword]
    );

    // Remove password before sending response
    const user = result.rows[0];
    delete user.password;

    // Send response
    res.json({
      message: "User created",
      user: user,
    });
    
  } catch (err) {
    console.error(err);

    // Duplicate email error
    if (err.code === "23505") {
      return res.status(400).json({ error: "User already exists" });
    }

    res.status(500).json({ error: "Server error" });
  }
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    // user not found
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    //  create token AFTER user is verified
    const token = jwt.sign(
      { userId: user.id },
      "secret123",
      { expiresIn: "1h" }
    );

    // remove password before sending
    delete user.password;

    res.json({
      message: "Login successful",
      token: token,
      user: user,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/resume", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM resumes WHERE user_id = $1",
      [req.userId]
    );

    res.json({
      resumes: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/optimize", authMiddleware, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(`
You are a professional resume writer.
Give the ats score as well as rewrite the following resume content into strong, concise bullet points that are clear, professional, and impact-focused. Use action verbs and keep each bullet short (1 line). Max 5 bullet points.
Rules:
- Output ONLY bullet points
- No explanations, no headings, no extra text
- No markdown symbols like **, ---, or >
- Each bullet must be clear, professional, and impact-focused
- Use action verbs (Built, Developed, Designed, Implemented)
- Max 5 bullet points
- Keep each bullet short (1 line)

Resume:
${content}
`);
    const improved = result.response.text();

    await pool.query(
      "INSERT INTO resumes (content, user_id) VALUES ($1, $2)",
      [improved, req.userId]
    );
const bullets = improved
  .split("\n")
  .map(line => line.trim())
  .filter(line => line.length > 0);

res.json({ bullets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
});
app.post("/resume", authMiddleware, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO resumes (content, user_id) VALUES ($1, $2) RETURNING *",
      [content, req.userId]
    );

    res.json({
      message: "Resume saved",
      resume: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});


