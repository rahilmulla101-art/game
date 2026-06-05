import jwt from 'jsonwebtoken';

export const isAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Administrative token required.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dragon_vs_tiger_key');
    
    // Validate decoded payload represents a real active administrator
    if (!decoded.isAdmin && decoded.role !== 'superadmin' && decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient administration permissions.'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Administrative session authorization failed: ' + error.message
    });
  }
};

export default isAdmin;
