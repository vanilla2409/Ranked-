import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const auth = (req, res, next) => {
  // console.log('Auth middleware triggered');
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Missing Auth token' });
  try {

    const decoded = jwt.verify(token, JWT_SECRET);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = decoded.exp - currentTime;
    if(timeRemaining <= 15 * 60) { // 15 minutes
      const newToken = jwt.sign({ userId: decoded.userId, username: decoded.username }, JWT_SECRET, { expiresIn: '1d' }); 

      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session Expired. Please login to continue' });
  }
};

export default auth;

