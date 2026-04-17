const Admin = require("../models/Admin");
const { createToken, hashPassword, verifyPassword } = require("../utils/auth");

async function ensureDefaultAdmin() {
  const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const existingAdmin = await Admin.findOne({ username });

  if (existingAdmin) {
    return existingAdmin;
  }

  return Admin.create({
    username,
    passwordHash: hashPassword(password),
  });
}

exports.login = async (req, res, next) => {
  try {
    await ensureDefaultAdmin();

    const username = String(req.body.username || "").toLowerCase().trim();
    const password = String(req.body.password || "");
    const admin = await Admin.findOne({ username });

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({
      token: createToken(admin),
      admin: {
        username: admin.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.me = (req, res) => {
  res.json({
    admin: {
      username: req.admin.username,
    },
  });
};
