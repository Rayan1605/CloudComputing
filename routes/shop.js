const express = require('express'); // Express router system
const router = express.Router(); // Create a router object

require('dotenv').config(); // Load .env file values into process.env
const bcrypt = require('bcryptjs'); // Library to hash (encrypt) passwords
const jwt = require("jsonwebtoken"); // Library to create JWT tokens (not fully used here)
const jwtString = process.env.JWT_STRING; // Secret string for JWT (optional, for future use)

const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Create MongoDB schemas

// Middleware to check if a user is logged in using session
const checkAuth = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        // If session doesn't show user is logged in, block access
        return res.send({ success: false, message: 'Please log in first' });
    }
    next(); // User is logged in, continue to the next function
};

// ======================= SCHEMAS (MongoDB Models) =======================

// Product schema: defines what a product looks like in the database
const productSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    ourId: { type: String, required: true, unique: true }, // Custom ID we assign
    anArray: { type: Array, required: false },
    anObject: { type: Object, required: false }
});
const Product = mongoose.model('Product', productSchema);

// User schema: defines what a user looks like in the database
const userSchema = new Schema({
    userEmail: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartId: { type: Number, required: true }
});
const User = mongoose.model('User', userSchema);

// ======================= PRODUCT ROUTES =======================

// In-memory counter to give unique product IDs
let nextProductId = 0;

// Add a product (only if user is logged in)
router.get('/addProduct', checkAuth, (req, res) => {
    const name = req.query.name;
    const price = req.query.price;

    if (!name || !price) {
        return res.send({ success: false, message: 'Please provide both name and price' });
    }

    // Create and save new product
    new Product({ ourId: '' + nextProductId, name, price: parseFloat(price) })
        .save()
        .then(result => {
            nextProductId++; // Increase ID counter
            res.send({ success: true, product: result });
        })
        .catch(err => {
            res.send({ success: false, message: 'Error adding product' });
        });
});

// Get all products
router.get('/', (req, res) => {
    Product.find()
        .then(products => {
            res.json({ 'All the Products': products });
        })
        .catch(err => {
            res.json({ 'Products': [] });
        });
});

// Test POST route: also returns all products
router.post('/', (req, res) => {
    Product.find()
        .then(products => {
            res.json({ 'POST Mongoose Products': products });
        })
        .catch(err => {
            res.json({ 'Products': [] });
        });
});

// Get one specific product (only if logged in)
router.get('/getSpecificProduct/:id', checkAuth, (req, res) => {
    const productId = req.params.id;

    Product.findOne({ ourId: productId })
        .then(product => {
            if (!product) return res.send({ success: false, message: 'Product not found' });
            res.send({ success: true, product });
        })
        .catch(err => {
            res.send({ success: false, message: 'Error finding product' });
        });
});

// Update product (only if logged in)
router.get('/updateSpecificProduct/:id', checkAuth, (req, res) => {
    const productId = req.params.id;
    const { name, price } = req.query;

    if (!name && !price) {
        return res.send({ success: false, message: 'Please provide name or price to update' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = parseFloat(price);

    Product.findOneAndUpdate({ ourId: productId }, updateData, { new: true })
        .then(updatedProduct => {
            if (!updatedProduct) return res.send({ success: false, message: 'Product not found' });
            res.send({ success: true, product: updatedProduct });
        })
        .catch(err => {
            res.send({ success: false, message: 'Error updating product' });
        });
});

// Delete a product (only if logged in)
router.get('/deleteSpecificProduct/:id', checkAuth, (req, res) => {
    const productId = req.params.id;

    Product.findOneAndDelete({ ourId: productId })
        .then(deletedProduct => {
            if (!deletedProduct) return res.send({ success: false, message: 'Product not found' });
            res.send({ success: true, product: deletedProduct });
        })
        .catch(err => {
            res.send({ success: false, message: 'Error deleting product' });
        });
});

// ======================= USER ROUTES =======================

// Log in a user
router.get('/signin', async (req, res) => {
    try {
        const userEmail = req.query.email;
        const password = req.query.pass;

        if (!userEmail || !password) {
            return res.send({ success: false, message: 'Please provide both email and password' });
        }

        // Look for user in database
        const user = await User.findOne({ userEmail: userEmail.trim() });
        if (!user) return res.send({ success: false, message: 'User not found' });

        // Compare password with hashed one in DB
        const checkPass = await bcrypt.compare(password.trim() + process.env.EXTRA_BCRYPT_STRING, user.password);
        if (!checkPass) return res.send({ success: false, message: 'Invalid password' });

        // Create session
        req.session.isLoggedIn = true;
        req.session.theUser = { userEmail: user.userEmail, cartId: user.cartId };

        // Save session and confirm login
        req.session.save(err => {
            if (err) return res.send({ success: false, message: 'Session error' });
            res.send({ success: true, login: true });
        });
    } catch (err) {
        res.send({ success: false, message: 'Server error' });
    }
});

// Sign up a new user
router.get('/signup', async (req, res) => {
    try {
        const userEmail = req.query.email.trim();
        let password = req.query.pass.trim();

        // Hash and salt the password before saving
        password = bcrypt.hashSync(password + process.env.EXTRA_BCRYPT_STRING, 12);

        const newUser = new User({
            userEmail,
            password,
            cartId: 1 // Set default cartId
        });

        await newUser.save();
        res.send({ success: true });
    } catch (err) {
        res.send({ success: false, error: err.message });
    }
});

// Log out the user and destroy session
router.get('/signout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.send({ success: false, message: 'Error signing out' });
        res.send({ success: true, message: 'Signed out successfully' });
    });
});

// Export all the routes so app.js can use them
module.exports = router;