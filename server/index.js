const express = require('express');
const app = express();
const mongoose = require('mongoose');
const PORT = 3000;
const {JWT_SECRETE, MONGOURI} = require('./config/key');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Wishlist = require('./models/wishList');
const jwt = require('jsonwebtoken');

mongoose.connect(MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.connection.on('connected', () => {
    console.log("Successfully connected to database")
})

mongoose.connection.on('error', (error) => {
    console.log("Connection failed ", error)
})

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: "Hello world" })
})

// route for signup 
app.post('/signup', async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(442).json({ message: 'All fields are required' });
        }
        const user = await User.findOne({ email: email })
        if (user) {
            return res.status(442).json({ message: 'User already exisit' })
        }
        const newPassword = await bcrypt.hash(password, 12);
        await new User({
            email: email,
            password: newPassword
        }).save();
        return res.status(200).json({ message: 'Signup successfully, now you can login' })
    } catch (error) {
        console.log(error)
        return res.status(404).json({ message: 'Internal server error' });
    }
})

// route for signin
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(442).json({ message: "Incorrect credentials" });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(442).json({ message: "No user with this credentials" });
        }
        const passMatch = await bcrypt.compare(password, user.password);
        if (passMatch) {
            const token = await jwt.sign({ userId: user._id }, JWT_SECRETE)
            return res.status(200).json({ token: token })
        } else {
            return res.status(401).json({ message: "Invalid credentials" })
        }
    } catch (error) {
        return res.status(404).json({ message: "Internal server error" })
    }
})

// mddleware for verifying user
const middleware = (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        return res.status(401).json({ message: "You must be logged in" })
    }
    try {
        const {userId} = jwt.verify(token, JWT_SECRETE);
        req.user = userId;
        next();
    } catch (error) {
        console.log(error)
        return res.status(404).json({ message: 'Internal server error' });
    }
}

// route to add wish item
app.post('/createWish', middleware, async (req, res) => {
    const data = await new Wishlist({
        wish: req.body.wish,
        wishOf: req.user
    }).save();
    return res.status(200).json({"wish":data});
})

// route to see all the wish item
app.get('/fethcWishItem', middleware, async (req, res) => {
    const data = await Wishlist.find({
        wishOf: req.user
    })
    return res.status(200).json({"wish":data});
})

// route to delete wish
app.delete('/deleteWish/:id', middleware, async (req, res) =>{
    const deletedWish = await Wishlist.findByIdAndDelete({_id: req.params.id})
    return res.status(200).json({"wish":deletedWish});
})

if(process.env.NODE_ENV === 'production'){
    const path = require('path')

    app.get('/', (req, res) => {
        app.use(express.static(path.resolve(__dirname, '..', 'client', 'build')))
        app.sendFile(express.static(path.resolve(__dirname, '..', 'client', 'build', 'index.html')))
    })
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
})