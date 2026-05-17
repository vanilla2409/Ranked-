import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { findUserByUsernameOrEmail, createNewUser } from '../helpers/db.js';
import prisma from '../exports/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const signup = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  const existingUser = await findUserByUsernameOrEmail(username, email);
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Username or email already exists.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const user = await createNewUser(username, email, hashedPassword, verificationToken);
  if (!user) {
    return res.status(500).json({ success: false, message: 'Error creating user.' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  };
  res.cookie('token', token, cookieOptions);
  // Here we would send a verification email with the token
  res.status(201).json({ success: true, message: 'User created successfully. Please login to continue' });
};

export const login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if ((!usernameOrEmail) || !password) {
    return res.status(400).json({ message: 'Username/email and password are required.' });
  }

  const user = await findUserByUsernameOrEmail(usernameOrEmail, usernameOrEmail);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  bcrypt.compare(password, user.passwordHash, async (err, isMatch) => {
    if (err) {
      console.error('Error comparing passwords:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    if (!isMatch) {
      console.warn('Invalid password attempt for user:', user.username);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };
    res.cookie('token', token, cookieOptions);
    res.json({ 
      success: true,
      message: 'Login successful.',
      user: { userId: user.id, username: user.username },
    })
  }
  );
};

export const verifyEmail = async (req, res) => {
  const { token } = req.body;
  const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null }
  });
  res.json({ message: 'Email verified successfully.' });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const resetToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      // Note: schema doesn't have resetPasswordToken, adding comments
      // resetPasswordToken: resetToken,
      // resetPasswordExpires: new Date(Date.now() + 3600000)
    }
  });

  // TO-Do --> Here we would send a reset email with the token
  res.json({ message: 'Password reset link sent to your email.' });
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  // Note: schema doesn't have these fields, this part will need schema updates if used
  const user = null; // await prisma.user.findFirst({ where: { resetPasswordToken: token, resetPasswordExpires: { gt: new Date() } } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
        // resetPasswordToken: null,
        // resetPasswordExpires: null
      }
    });
  }
  res.json({ message: 'Password reset successful.' });
};

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.json({ success: true, message: 'Logged out successfully.' });
}
