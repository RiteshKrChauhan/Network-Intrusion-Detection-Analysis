import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import cors from "cors";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

// CORS configuration
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: false // Set to true in production with HTTPS
    }
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query("SELECT role FROM users WHERE id = $1", [req.user.id]);
      if (result.rows.length > 0 && result.rows[0].role === "admin") {
        return next();
      }
      res.status(403).json({ error: "Forbidden - Admin access required" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// API Routes

// Check authentication status
app.get("/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Get all models (for viewers and admins)
app.get("/models", isAuthenticated, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM models ORDER BY date_created DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// Get single model by id
app.get("/models/:id", isAuthenticated, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM models WHERE id = $1", [req.params.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Model not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch model" });
  }
});

// Create new model (admin only)
app.post("/models", isAdmin, async (req, res) => {
  const { model_name, framework, accuracy, precision, recall, f1_score } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO models (model_name, framework, accuracy, precision, recall, f1_score, date_created, date_updated) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *",
      [model_name, framework, accuracy, precision, recall, f1_score]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create model" });
  }
});

// Update model (admin only)
app.put("/models/:id", isAdmin, async (req, res) => {
  const { model_name, framework, accuracy, precision, recall, f1_score } = req.body;
  try {
    const result = await db.query(
      "UPDATE models SET model_name = $1, framework = $2, accuracy = $3, precision = $4, recall = $5, f1_score = $6, date_updated = NOW() WHERE id = $7 RETURNING *",
      [model_name, framework, accuracy, precision, recall, f1_score, req.params.id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Model not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update model" });
  }
});

// Delete model (admin only)
app.delete("/models/:id", isAdmin, async (req, res) => {
  try {
    const result = await db.query("DELETE FROM models WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length > 0) {
      res.json({ message: "Model deleted successfully", model: result.rows[0] });
    } else {
      res.status(404).json({ error: "Model not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete model" });
  }
});

app.get("/", async (req, res) => {
  res.json({ message: "NIDS API Server" });
});

app.post("/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      if (err === "User not found") {
        return res.status(404).json({ error: "No account found with this email. Please register first." });
      } else if (err === "Invalid password") {
        return res.status(401).json({ error: "Incorrect password. Please try again." });
      } else {
        return res.status(500).json({ error: "Login failed. Please try again." });
      }
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password. Please try again." });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed. Please try again." });
      }
      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    });
  })(req, res, next);
});

app.post("/auth/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    // Check if email already exists
    const checkEmailResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkEmailResult.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists. Please login instead." });
    }

    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).json({ error: "Registration failed. Please try again." });
      } else {
        const result = await db.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *", [email, hash, "viewer"]);
        const user = result.rows[0];
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ error: "Registration successful but login failed." });
          }
          res.status(201).json({
            message: "Registration successful",
            user: {
              id: user.id,
              email: user.email,
              role: user.role
            }
          });
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

app.post("/auth/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logout successful" });
  });
});

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get("/auth/google/NIDS",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/dashboard");
  }
);


passport.use("local",
  new Strategy({ usernameField: 'email' }, async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [username]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb("Invalid password");
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
      return cb(err);
    }
  })
);

passport.use("google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/NIDS",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.email]);
        if (result.rows.length === 0) {
          // Create user with viewer role by default
          const newUser = await db.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *", [profile.email, "google", "viewer"]);
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]);
    } else {
      cb(new Error("User not found"));
    }
  } catch (err) {
    cb(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
