const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types 

const wishlistSchema = new mongoose.Schema({
    wish: {
        type: String,
        required: true
    },
    wishOf: {
        type: ObjectId,
        ref: "User"
    } 
})

module.exports = mongoose.model('Wishlist', wishlistSchema)