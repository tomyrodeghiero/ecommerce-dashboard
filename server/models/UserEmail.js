const mongoose = require('mongoose');

const userEmailSchema = new mongoose.Schema({
    emailUser: {
        type: String,
        required: true,
        trim: true,
    },
    ecommerceName: {
        type: String,
        required: true,
        trim: true,
    }
});

const UserEmail = mongoose.model('UserEmail', userEmailSchema);

module.exports = UserEmail;