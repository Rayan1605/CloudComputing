const express = require('express');
const router = express.Router();
require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const jwtString = process.env.JWT_STRING
const mongoose = require('mongoose')
const Schema = mongoose.Schema
 
// Add authentication middleware
const checkAuth = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    console.log('Access denied: User not logged in')
    return res.send({ success: false, message: 'Please log in first' })
  }
  next()
}
 
// Modify product schema to auto-generate ID
const productSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  ourId: { type: String, required: true, unique: true },
  anArray: { type: Array, required: false },
  anObject: { type: Object, required: false }
})
 
const Product = mongoose.model('Product', productSchema)
 
// Add User Schema
const userSchema = new Schema({
  userEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cartId: { type: Number, required: true }
})
 
const User = mongoose.model('User', userSchema)
 
let nextProductId = 0;
 
// Modified addProduct route to use GET and match previous style
router.get('/addProduct', checkAuth, (req, res, next) => {
  const name = req.query.name
  const price = req.query.price
 
  if (!name || !price) {
    console.log('Missing product details')
    return res.send({ success: false, message: 'Please provide both name and price' })
  }
 
  new Product({  ourId: '' + nextProductId, name: name, price: parseFloat(price)
  })
 
    .save()
    .then(result => {
      nextProductId++
      console.log('Product saved to database:', result)
      res.send({ success: true, message: 'Product added successfully', product: result })
    })
    .catch(err => {
      console.log('Failed to add product: ' + err)
      res.send({ success: false, message: 'Error adding product' })
    })
})
 
router.get('/', (req, res, next) => {
  Product.find() // Always returns an array
    .then(products => {
      res.json({ 'All the Products': products })
    })
    .catch(err => {
      console.log('Failed to find: ' + err)
      res.json({ 'Products': [] })
    })
})
 
router.post('/', (req, res, next) => {
  console.log(req.body.testData)
  Product.find() // Always returns an array
    .then(products => {
      res.json({ 'POST Mongoose Products': products })
    })
    .catch(err => {
      console.log('Failed to find: ' + err)
      res.json({ 'Products': [] })
    })
})
 
router.get('/getSpecificProduct/:id', checkAuth, (req, res, next) => {
  const productId = req.params.id
  console.log('Getting product with ID:', productId)
 
  Product.findOne({ ourId: productId })
    .then(product => {
      if (!product) {
        console.log('Product not found with ID:', productId)
        return res.send({ success: false, message: 'Product not found' })
      }
      console.log('Found product:', product)
      res.send({ success: true, product: product })
    })
    .catch(err => {
      console.log('Failed to find product:', err)
      res.send({ success: false, message: 'Error finding product' })
    })
})
 
router.get('/updateSpecificProduct/:id', checkAuth, (req, res, next) => {
  const productId = req.params.id
  const { name, price } = req.query
 
  console.log('Updating product with ID:', productId)
  console.log('New values - Name:', name, 'Price:', price)
 
  if (!name && !price) {
    console.log('No update values provided')
    return res.send({ success: false, message: 'Please provide name or price to update' })
  }
 
  const updateData = {}
  if (name) updateData.name = name
  if (price) updateData.price = parseFloat(price)
 
  Product.findOneAndUpdate(
    { ourId: productId },
    updateData,
    { new: true }
  )
    .then(updatedProduct => {
      if (!updatedProduct) {
        console.log('Product not found with ID:', productId)
        return res.send({ success: false, message: 'Product not found' })
      }
      console.log('Product updated successfully:', updatedProduct)
      res.send({ success: true, message: 'Product updated successfully', product: updatedProduct })
    })
    .catch(err => {
      console.log('Failed to update product:', err)
      res.send({ success: false, message: 'Error updating product' })
    })
})
 
router.get('/deleteSpecificProduct/:id', checkAuth, (req, res, next) => {
  const productId = req.params.id
  console.log('Deleting product with ID:', productId)
 
  Product.findOneAndDelete({ ourId: productId })
    .then(deletedProduct => {
      if (!deletedProduct) {
        console.log('Product not found with ID:', productId)
        return res.send({ success: false, message: 'Product not found' })
      }
      console.log('Product deleted successfully:', deletedProduct)
      res.send({ success: true, message: 'Product deleted successfully', product: deletedProduct })
    })
    .catch(err => {
      console.log('Failed to delete product:', err)
      res.send({ success: false, message: 'Error deleting product' })
    })
})
 
router.get('/signin', async (req, res, next) => {
  try {
    const userEmail = req.query.email;
    const password = req.query.pass;

    if (!userEmail || !password) {
      return res.send({ success: false, message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ userEmail: userEmail.trim() });
    if (!user) {
      return res.send({ success: false, message: 'User not found' });
    }

    const checkPass = await bcrypt.compare(password.trim() + process.env.EXTRA_BCRYPT_STRING, user.password);
    if (!checkPass) {
      return res.send({ success: false, message: 'Invalid password' });
    }

    req.session.isLoggedIn = true;
    req.session.theUser = {
      userEmail: user.userEmail,
      cartId: user.cartId
    };

    req.session.save(err => {
      if (err) {
        return res.send({ success: false, message: 'Session error' });
      }
      res.send({ success: true, login: true });
    });
  } catch (err) {
    console.log('Signin error:', err);
    res.send({ success: false, message: 'Server error' });
  }
})
 
router.get('/signup', async (req, res, next) => {
  try {
    const userEmail = req.query.email.trim();
    let password = req.query.pass.trim();

    // Hash the password
    password = bcrypt.hashSync(password + process.env.EXTRA_BCRYPT_STRING, 12);

    const newUser = new User({
      userEmail: userEmail,
      password: password,
      cartId: 1
    });

    await newUser.save();
    console.log('User saved to database:', userEmail);
    res.send({ success: true });
  } catch (err) {
    console.log('Error saving user:', err);
    res.send({ success: false, error: err.message });
  }
})
 
router.get('/signout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('Session destroy error:', err)
      res.send({ success: false, message: 'Error signing out' })
      return
    }
    console.log('Successfully signed out')
    res.send({ success: true, message: 'Signed out successfully' })
  })
})
 
module.exports = router