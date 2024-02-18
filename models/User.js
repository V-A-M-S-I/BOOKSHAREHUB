const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');


// MONGOOSE SCHEMA
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please enter name"],
        unique: true,
        trim: true,
        maxLength: [20, "your name is up to 20 chars long."],
    },
    email: {
        type: String,
        required: [true, "please enter email"],
        trim: true,
        lowercase: true,
        validate: [isEmail, "please enter valid email"]
    },
    password: {
        type: String,
        required: [true, "please enter password"],
        trim: true,
        minlength: [7, "minimum of 7 characters"]
    },
});







// Fire the function before storing the data into db
userSchema.pre('save', async function (next) {
    try {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

//static method to login user
userSchema.statics.login = async function(email,password){
    const user = await this.findOne({email});
    if(user){
        const auth = await bcrypt.compare(password,user.password);
        if(auth){
            return user;
        }
        throw Error('incorrect password');
    }
    throw Error('incorrect email');;
}

const Details = mongoose.model("Details", userSchema);

module.exports = Details;

