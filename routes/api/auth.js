const express = require('express')
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User')
const { check, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');


//      @route GET api/auth
//      @desc Test route
//      @access Public
//      go to postman https://localhost:5000/api/auth to test
// router.get('/', (req, res) => res.send('Auth route')); //uncomment me to test

//      @route GET api/auth
//      @desc Test route
//      @access Public
//      pass in auth in router.get to require authorization token
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});


//      @route POST api/auth
//      @desc Authenticate user and get token
//      @access Public
router.post(
    "/",
    [ check('email', 'Please include a valid email').isEmail(),
      check('password', 'Password is required').exists()],
  
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
  
        const { email, password } = req.body;
  
        try {
        // see if user exists
        let user = await User.findOne({ email });
  
        if (!user) {
          // error if user exists
            return res.status(400).json({ errors: [ { msg: 'Invalid credentials' }] });
        }

        // make sure password matches
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // error if password is incorrect
            return res.status(400).json({ errors: [ { msg: 'Invalid credentials' }] });
        }
  
        // return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }
  
        // secret that is passed in after payload is from /config/default.json
        jwt.sign(
          payload, 
          config.get('jwtSecret'),
          { expiresIn: 360000}, //TODO: change to 3600 in prod
          (err, token) => {
              if (err) throw err;
              res.json({ token });
          }
          ); 
  
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error')
        }
    }
  );

module.exports = router;