const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email:{ type: String,required:true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    userClass: { type: String },
    educationLevel: { type: String, enum: ['school', 'inter', 'btech', 'degree'] },
    institutionType: { type: String, enum: ['private', 'government', 'individual'] }
});

const profile = mongoose.model('profile', profileSchema);

module.exports = profile;