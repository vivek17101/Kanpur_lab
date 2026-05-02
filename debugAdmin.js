const crypto = require("crypto");

const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = "sha512";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = String(passwordHash || "").split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(storedHash));
}

console.log("=== Password Hashing & Verification Test ===\n");

// Test 1: Basic hash and verify
const testPassword = "admin123";
const hash = hashPassword(testPassword);
console.log("Test 1: Basic hash and verify");
console.log(`Password: "${testPassword}"`);
console.log(`Hash: ${hash}`);
console.log(`Verify (correct): ${verifyPassword(testPassword, hash)}`);
console.log(`Verify (wrong): ${verifyPassword("wrongpassword", hash)}`);
console.log();

// Test 2: With leading/trailing spaces
console.log("Test 2: Passwords with whitespace");
const hashWithoutSpaces = hashPassword("testpass123");
console.log(`Hash without spaces: ${hashWithoutSpaces}`);
console.log(`Verify without spaces: ${verifyPassword("testpass123", hashWithoutSpaces)}`);
console.log(`Verify WITH spaces: ${verifyPassword("  testpass123  ", hashWithoutSpaces)}`);
console.log(`Verify WITH trimmed spaces: ${verifyPassword("  testpass123  ".trim(), hashWithoutSpaces)}`);
console.log();

// Test 3: Case sensitivity
console.log("Test 3: Case sensitivity");
const hashLower = hashPassword("TestPassword");
console.log(`Hash of "TestPassword": ${hashLower}`);
console.log(`Verify "TestPassword": ${verifyPassword("TestPassword", hashLower)}`);
console.log(`Verify "testpassword": ${verifyPassword("testpassword", hashLower)}`);
console.log();

console.log("✓ Debug script completed");
