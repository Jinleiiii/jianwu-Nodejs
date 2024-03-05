const mongoose = require('mongoose')

let UserSchema = new mongoose.Schema({
    openid: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
})

let UserModel = mongoose.model('users', UserSchema)

module.exports = UserModel;