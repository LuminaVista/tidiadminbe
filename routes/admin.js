import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../services/db.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const blacklistedTokens = new Set();

//REGISTER ADMIN
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password)
    return res.status(400).json({ msg: 'Please provide email and password' });

  try {
    const [existingAdmin] = await db.query('SELECT * FROM Admin WHERE Email = ?', [email]);

    if (existingAdmin.length > 0) {
      return res.status(400).json({ msg: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO Admin (Email, Password, Role) VALUES (?, ?, ?)',
      [email, hashedPassword, role || 'SuperAdmin']
    );

    res.json({ msg: 'Admin registered successfully' });

  } catch (error) {
    console.error("Error during register:", error);
    res.status(500).json({ msg: 'Server error' });
  }
});

//LOGIN ADMIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [admins] = await db.query('SELECT * FROM Admin WHERE Email = ?', [email]);
    if (admins.length === 0)
      return res.status(404).json({ msg: 'Admin not found' });

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.Password);

    if (!isMatch)
      return res.status(401).json({ msg: 'Invalid password' });

    const token = jwt.sign(
      { id: admin.Email, role: admin.Role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      msg: 'Admin logged in successfully',
      token: `Bearer ${token}`
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

//VERIFY TOKEN
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(403).json({ msg: 'No authorization header provided' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ msg: 'Malformed authorization header' });

  if (blacklistedTokens.has(token))
    return res.status(401).json({ msg: 'Token is invalid (logged out)' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(401).json({ msg: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

//GET ALL USERS
router.get('/getUsers', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM Users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching users' });
  }
});

//LOGOUT
router.post('/logout', verifyToken, (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  blacklistedTokens.add(token);
  res.json({
    msg: 'Logout successful. Token invalidated.',
    redirect: '/register.html'
  });
});

export default router;
