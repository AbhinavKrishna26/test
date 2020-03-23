const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const key = require('../../config/keys').secret;
const User = require('../../model/User');

/**
 * @route POST api/users/register
 * @desc Register the user
 * @access Public
 */
router.post('/register', (req, res) => {
    let { name, username, email, password, confirm_password } = req.body
    if(password !== confirm_password){
        return res.status(400).json({
            msg: "passwords do not match."
        });
    }

    //check for unique username

    User.findOne({
        username: username
    }).then(user => {
        if(user){
            return res.status(400).json({
            msg:"Username already taken."
            });
        }
    })

    //ceck for the unique email
    User.findOne({email: email}).then(user => {
        if(user){
            return res.status(400).json({
                msg:"email is  already registered."
                });
        }
    });

    //data valid and register the new user
    let newUser = new User({
        name,
        username,
        password,
        email
    });
    //hasing the password
    bcrypt.genSalt(10 , (err, salt) =>{
      bcrypt.hash(newUser.password, salt, (err, hash) =>{
          //if(err)throw err;
          newUser.password = hash;
          newUser.save().then(user => {
              return res.status(201).json({
                  success: true,
                  msg: "new user registered successfully."
              });
          });
      });
    });
});


/**
 * @route POST api/users/login
 * @desc signing the user
 * @access Public
 */
router.post('/login', (req, res) => {
    User.findOne({
        username: req.body.username
    }).then(user => { 
        if(!user) {
        return res.status(404).json({
            msg: "Username not found.",
            success: false
        });
    }
    //user exists and comparing passwords
    bcrypt.compare(req.body.password, user.password).then(isMatch => {
        if(isMatch){
            // user password is correct send json token for that user
            const payload = {
                _id: user._id,
                username: user.username,
                name: user.name,
                email: user.email
            }
            jwt.sign(payload, key, {
                expiresIn: 604800
            }, (err, token) => {
                res.status(200).json({
                    success:true,
                    token: 'Bearer ' +token,
                    msg: "Hurray! you are logged in!"
                });
            
            })
        }else {
            return res.status(404).json({
                msg: "incorrect password.",
                success: false
        
    });
}
})
});
});


/**
 * @route POST api/users/profile
 * @desc returns user data
 * @access Private
 */
router.get('/profile', passport.authenticate('jwt', {
    session: false
}),(req, res) => {
    return res.json({
        user: req.user
    });
});



module.exports = router;
