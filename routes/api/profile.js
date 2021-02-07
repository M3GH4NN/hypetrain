const express = require('express')
const router = express.Router();
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const { check, validationResult } = require("express-validator");
const { profile } = require('console');

// ************ TEST ************
//      @route GET api/profile
//      @desc Test route
//      @access Public
//      go to postman https://localhost:5000/api/profile to test
// router.get('/', (req, res) => res.send('Profile route')); //uncomment me to test
// ******************************


//      @route GET api/profile/me
//      @desc Get current user's profile
//      @access Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate(
            'user', 
            ['name', 'avatar']
            );
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
            res.status(500).send('Server Error');
    }
});


//      @route POST api/profile
//      @desc Create or update a user profile
//      @access Private
router.post(
    '/',
     [ 
         auth,
        //   [
        //     check('games', 'At least one game is required')
        //     .not()
        //     .isEmpty()
        //     ] 
        ], 
        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // const {
            //     games
            // } = req.body;

            // build profile object
            const profileFields = {};
            profileFields.user = req.user.id;
        //     if(games) {
        //         profileFields.games = games.split(',').map(skill => skill.trim());
        // }

        // console.log(profileFields.games);

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                // update profile if profile exists
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id }, 
                    { $set: profileFields },
                    { new: true }
                    );
                    return res.json(profile);
            }

            // Create profile if profile doesn't exist
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }
});

//      @route GET api/profile/
//      @desc Get all profiles
//      @access Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name, avatar']) //TODO: change name to username
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


//      @route POST api/profile/user/:user_id      //TODO: change to username instead of id and make sure usernames are unique
//      @desc Get profile by user ID //TODO: change to username
//      @access Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar']); //TODO: change name to username    
        
        if (!profile) 
            return res.status(400).json({ msg: 'Profile not found' });
        
        res.json(profile); 
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }
});


//      @route DELETE api/profile
//      @desc Delete profile, user
//      @access Private
router.delete('/', auth, async (req, res) => {
    try {
        // TODO: remove user's games list
        
        // remove profile
        await Profile.findOneAndRemove({ user: req.user.id }); 
        
        // remove user
        await User.findOneAndRemove({ _id: req.user.id }); 

        res.json({ msg: 'User deleted' }); 
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//      @route PUT api/profile/games
//      @desc Add games to profile
//      @access Private
router.put('/games', [auth, [
    check('title', 'Title is required').not().isEmpty()   //TODO: how to add release date?
]], 
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title,
    } = req.body;

    const newGame = {
        title,
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });
        
        profile.games.unshift(newGame);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})


module.exports = router;