const express = require('express');
const bodyParser = require('body-parser'); // Corrected the typo here
const mongoose = require('mongoose');
const authRoutes = require('./routers/authRoutes');
const cookieParser = require('cookie-parser');
const Details = require('./models/User');
const profile = require('./models/Profile')
const jwt = require('jsonwebtoken');
const { Password } = require('validator');
const nodemailer = require('nodemailer');
const {requireAuth} = require('./middleware/authMiddleware')
const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
// use EJS as View engine
app.set('view engine', 'ejs');
// static file
app.use(express.static("public"));

// MONGOOSE CONNECTION
mongoose.connect("mongodb://127.0.0.1:27017/bookDonation-website", {
    useNewUrlParser: true,
}).then(() => {
    console.log("Connected to database");
}).catch(err => {
    console.log("There is some error in connecting with database", err);
});

//jwt secret
const JWT_SECRET = 'VenkataVamsi'

// Use bodyParser middleware for parsing incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(authRoutes);

app.get('/', (req, res) => {
    res.render('main');
});
app.get('/home',requireAuth,(req,res)=>{
    res.render('home');
})

app.get('/contact',requireAuth,(req,res)=>{
    res.render('contact');
})

app.get('/forgot',requireAuth,(req,res)=>{
    res.render('forgot');
})

app.get('/books',requireAuth,(req,res)=>{
    res.render('books')
})

app.get('/campaigns',requireAuth,(req,res)=>{
    res.render('campaigns')
})


app.get('/cart',requireAuth,(req,res)=>{
    res.render('cart')
})


app.post('/forgot', requireAuth,async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the user exists in the database
        const user = await Details.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
       
        // User exists, generate a password reset token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '10min' });
        const resetLink = `http://localhost:8080/reset/${user._id}/${token}`;

        // Send email to the user
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'venkatavamsi0206@gmail.com', // replace with your email
                pass: 'asqf mqha eytd wlmg' // replace with your email password
            }
        });

        const mailOptions = {
            from: 'venkatavamsi0206@gmail.com', // replace with your email
            to: user.email,
            subject: 'Password Reset Link',
            text: `Click on the following link to reset your password: ${resetLink}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log('Email sent: ' + info.response);
                res.send('Password reset link has been sent to your email');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/submit-form', (req, res) => {
    const { firstName, lastName, email, mobileNumber, message } = req.body;

    // Send email to the user
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'venkatavamsi0206@gmail.com', // replace with your email
            pass: 'asqf mqha eytd wlmg' // replace with your email password
        }
    });

    // Set up email options
    const mailOptions = {
        from: email,
        to: 'venkatavamsi0206@gmail.com',
        subject: 'Requesting For Books',
        html: `
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mobile Number:</strong> ${mobileNumber}</p>
            <p><strong>Message:</strong> ${message}</p>
        `
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send('Form submitted successfully');
        }
    });
});





app.get('/reset/:id/:token', requireAuth, async (req, res) => {
    const { id, token } = req.params;

    try {
        // Check if the user with the given id exists in the database
        const user = await Details.findById(id);

        if (!user) {
            return res.send('Invalid id');
        }

        // We have a valid user with this id
        const payload = jwt.verify(token, JWT_SECRET);
        res.render('reset', { email: user.email });
    } catch (err) {
        console.error(err);
        res.send('Invalid token');
    }
});





app.post('/reset/:id/:token',requireAuth,async (req,res)=>{
    const {id, token} = req.params;
    const {password1 , password2} = req.body;

    try {
        // Check if the user with the given id exists in the database
        const user = await Details.findById(id);

        if (!user) {
            return res.send('Invalid id');
        }
        const payload = jwt.verify(token, JWT_SECRET);
        Details.password = await hashPassword(password1);
        res.send(user);
    }catch (err){
        console.log(err);
    }

})


app.get('/profile', requireAuth, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Use findOne with a query to find the profile based on the user's email
        const userProfile = await profile.findOne({ email: userEmail });

        if (userProfile) {
            // Render the 'profile' view with the retrieved user profile
            res.render('profile', { userProfile });
        } else {
            // Handle the case where the user doesn't have a profile
            res.render('profile', { userProfile: null });
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/profile', requireAuth, async (req, res) => {
    try {
        const { name, email,district, city, address, phone, userClass, educationLevel, institutionType } = req.body;

        // Check if the user already has a profile
        const existingProfile = await profile.findOne({ email });

        if (existingProfile) {
            // Update the existing profile
            existingProfile.name = name;
            existingProfile.district = district;
            existingProfile.city = city;
            existingProfile.address = address;
            existingProfile.phone = phone;
            existingProfile.userClass = userClass;
            existingProfile.educationLevel = educationLevel;
            existingProfile.institutionType = institutionType;

            const updatedProfile = await existingProfile.save();
            res.json({ success: true, message: 'Profile updated successfully!', data: updatedProfile });
        } else {
            // Create a new user profile
            const userProfile = new profile({
                name,
                email: req.user.email, // Use the authenticated user's email
                district, city, address, phone, userClass, educationLevel, institutionType
            });

            // Save the user profile to the database
            const savedProfile = await userProfile.save();
            res.json({ success: true, message: 'Profile saved successfully!', data: savedProfile });
        }
    } catch (error) {
        console.error('Error saving/updating profile:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});




app.listen(8080, () => {
    console.log("server running on the port 8080");
});
