const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/User');

//      @route GET api/users
//      @desc Test route
//      @access Public
//      go to postman https://localhost:5000/api/users to test
// router.get("/", (req, res) => res.send("User route")); //uncomment me to test

//      @route POST api/users
//      @desc Register user
//      @access Public
router.post(
  "/",
  [check("name", "Name is required").not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })],

  async (req, res) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      try {
      // see if user exists
      let user = await User.findOne({ email });

      if (user) {
        // error if user exists
          return res.status(400).json({ errors: [ { msg: 'User already exists' }] });
      }

      // get user's gravatar
      const avatar = gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm'
      })

      user = new User({
          name,
          email,
          avatar,
          password
      })

      // encrypt password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

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
