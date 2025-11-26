const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    date:{
        type: Date,
        default: Date.now
    },
    content: String,
    Likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
});
const User = mongoose.model('post', postSchema);
module.exports = User;
