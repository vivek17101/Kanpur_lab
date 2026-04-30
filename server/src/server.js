require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const WEAK_SECRETS = [
  "replace-with-a-long-random-secret",
  "change-this-local-development-secret",
  "",
];

if (!process.env.AUTH_SECRET || WEAK_SECRETS.includes(process.env.AUTH_SECRET)) {
  console.error(
    "FATAL: AUTH_SECRET is not set or is using a placeholder value.\n" +
    "Set a strong random secret in server/.env before starting the server.\n" +
    "Example: AUTH_SECRET=your-64-char-random-string-here"
  );
  process.exit(1);
}

const app = require("./app");
const connectDB = require("./config/db");

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
