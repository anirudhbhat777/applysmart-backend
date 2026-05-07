import { useState, useEffect } from "react";
const API_URL = "http://localhost:3001";
function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
const [isSignup, setIsSignup] = useState(false);
  const [resume, setResume] = useState("");
  const [bullets, setBullets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load token on refresh
  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (saved) setToken(saved);
  }, []);
const handleSignup = async () => {
  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.user) {
      alert("Signup successful! Now login.");
      setIsSignup(false);
    } else {
      alert(data.error || "Signup failed");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};
  // LOGIN
  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        alert("Login successful");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setBullets([]);
  };

  // OPTIMIZE
  const handleOptimize = async () => {
    if (!token) {
      alert("Please login first");
      return;
    }

    if (!resume) {
      alert("Enter resume first");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ content: resume }),
      });

      const data = await res.json();

      if (data.bullets) {
        setBullets(data.bullets);
      } else {
        alert("Error optimizing");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 30, maxWidth: 600, margin: "auto" }}>
      <h1>ApplySmart</h1>

      {/* LOGIN SECTION */}
<h3>{isSignup ? "Signup" : "Login"}</h3>

<input
  style={{ width: "100%", padding: 8 }}
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
<br /><br />

<input
  style={{ width: "100%", padding: 8 }}
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
<br /><br />

<button
  onClick={isSignup ? handleSignup : handleLogin}
  style={{ padding: 10, width: "100%", cursor: "pointer" }}
>
  {isSignup ? "Signup" : "Login"}
</button>

<br /><br />

<p style={{ cursor: "pointer", color: "blue" }}>
  {isSignup ? "Already have an account? Login" : "New user? Signup"}
</p>

<button
  onClick={() => setIsSignup(!isSignup)}
  style={{ padding: 5, cursor: "pointer" }}
>
  Switch
</button>
      {/* LOGOUT BUTTON */}
      {token && (
        <>
          <button
            onClick={handleLogout}
            style={{
              padding: 8,
              marginBottom: 20,
              background: "red",
              color: "white",
              cursor: "pointer",
            }}
          >
            Logout
          </button>

          <h3>Resume Optimizer</h3>

          <textarea
            style={{ width: "100%", padding: 10 }}
            rows="6"
            placeholder="Paste your resume here..."
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />

          <br /><br />

          <button
            onClick={handleOptimize}
            disabled={loading}
            style={{ padding: 10, width: "100%", cursor: "pointer" }}
          >
            {loading ? "Optimizing..." : "Optimize Resume"}
          </button>

          <h3 style={{ marginTop: 30 }}>Improved Resume</h3>

          <ul>
            {bullets.map((b, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {b}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
