const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator')
const gravatar = require('gravatar');
const bcrypt = require('bcrypt');
const config = require('config');
const jwt = require('jsonwebtoken');
const User = require('../../models/User')
router.post('/',
[
    check('name','Name is Required').not().isEmpty(),
    check('email','Please Enter a Valid email').isEmail(),
    check('password','Please enter a Valid Password').isLength({min:6})
],
async (req,res)=> {
    const  errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {name,email,password} = req.body;
    try{
        //See if User exists
        let user = await User.findOne({email});
        if(user){
           return res.status(400).json({errors:[{msg:'User Already exists'}]});
        }
        //Get usergravatar
        const avatar = gravatar.url(email,{
            s:'200',
            r:'pg',
            d:'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        })
        //Encrypt Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save()
        //Return json webtoken
        const payload = {
            user:{
                id:user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {expiresIn:360000},
            (err, token) => {
                if (err) throw err;
                res.json({ token });
        });
    }   catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
    
});

module.exports = router;