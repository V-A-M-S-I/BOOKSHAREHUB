const Details = require('../models/User');
const jwt = require('jsonwebtoken');

// Handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { name: '', email: '', password: '' };
     
    //incorrect email
    if(err.message === 'incorrect email'){
        errors.email = 'that email is not registered';
    }
    //incorect password
    if(err.message === 'incorrect password'){
        errors.password = 'that password is incorrect';
    }
    //dupliate error code
    if (err.code===11000){
        errors.email ="that email is already registerd";
        return errors;
    }
    // validation error code 
    if (err.message.includes('Details validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
        
    }
    return errors;
};

const maxAge = 5*60*60; 
const createToken = (id) => {
    return jwt.sign({ id }, 'VenkataVamsi', {
        expiresIn: maxAge
    });
};

module.exports.signup_get = (req, res) => {
    res.render('signup');
};

module.exports.login_get = (req, res) => {
    res.render('login');
};

module.exports.signup_post = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const user = await Details.create({ name, email, password });
        const token = createToken(user._id);
        res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
        console.log("User successfully created:", user); // Log user information
        res.status(201).json({ user: user._id });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
};


module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Details.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
};



