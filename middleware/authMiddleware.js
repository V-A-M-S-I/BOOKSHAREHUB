
const jwt = require('jsonwebtoken');
const Details = require('../models/User');

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    // Check if token exists
    if (token) {
        jwt.verify(token, 'VenkataVamsi', async (err, decodedToken) => {
            if (err) {
                console.error(err.message);
                res.redirect('/login'); // Redirect to login if token is invalid
            } else {
                const user = await Details.findById(decodedToken.id);
                req.user = user; // Set the user object in the request
                next();
            }
        });
    } else {
        res.redirect('/login'); // Redirect to login if no token is present
    }
};

module.exports = { requireAuth };
