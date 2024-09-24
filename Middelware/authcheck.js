const jwt = require('jsonwebtoken');
const JWT_SECRET = 'nusarat'; // Use an environment variable in production

const verifyLogin = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

    if (!token) {
        return res.status(401).json({ error: true, message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: true, message: 'Invalid token.' });
        }
        req.user = decoded; // Attach the decoded user info to the request object
        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = verifyLogin;
