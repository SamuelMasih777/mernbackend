const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile')
const User = require('../../models/User');
const Post = require('../../models/Post')
const config = require('config')
const request = require('request');
const {check, validationResult} = require('express-validator');

router.get('/me', auth, async (req,res)=>{ 
    try{
        const profile = await Profile.findOne({user:req.user.id}).populate('user',['name','avatar']);

        if(!profile){
            return res.status(400).json({msg:'There is no Profile for this user'});
        }
        res.json(profile)
    }catch(err){
        console.error(err.message);
        res.send('Profile Route')
    }
});


router.post('/',auth,
[
    [
        check('status','Status is Required').not().isEmpty(),
        check('skills','Skills is Required').not().isEmpty()
    ]
], 
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
        // spread the rest of the fields we don't need to check

      } = req.body;
    const profileFields ={};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company
    if(website) profileFields.website = website
    if(location) profileFields.location = location
    if(bio) profileFields.bio = bio
    if(status) profileFields.status = status
    if(githubusername) profileFields.githubusername = githubusername
    if(skills){
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    profileFields.social={}
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(instagram) profileFields.social.instagram = instagram;
    
    try{
        let profile = await Profile.findOne({user: req.user.id})
        if(profile){
            //Update
            profile= await Profile.findOneAndUpdate(
                {user: req.user.id},
                {$set: profileFields},
                {new:true});

            return res.json(profile);
        }
        //Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

router.get('/',async (req,res)=>{
    try {
        const profiles = await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
//@desc Get Profile by user ID
router.get('/user/:user_id',async (req,res)=>{
    try {
        const profile = await Profile.findOne({user:req.params.user_id}).populate('user',['name','avatar']);

        if(!profile) return res.status(400).json({msg:'Profile not found!'})
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg:'Profile not found!'})
        }
        res.status(500).send('Server Error');
    }
})
//@route DELETE api/profile
//Delete profile, user & posts
router.delete('/',auth,async (req,res)=>{
    try {
        //remove posts
        //Remove profile
        await Profile.findOneAndRemove({user: req.user.id});
        //Remove User
        await User.findOneAndRemove({_id: req.user.id});
        res.json({msg:'User Deleted'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
// PUT api/profile/experience
// Add Profile experience
router.put('/experience',[auth,[
    check('title','Title is required').not().isEmpty(),
    check('company','Company is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty()    
]],
    async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
    }
    try {
        const profile = await Profile.findOne({user:req.user.id});

        profile.experience.unshift(newExp);

        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
// @route DELETE api/profile/experience/:exp_id
//Delete Experience

router.delete('/experience/:exp_id',auth,async(req,res)=>{
    try {
        const profile = await Profile.findOne({user:req.user.id});
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

//@route DELETE api/profile
//Delete profile, user & posts
router.delete('/',auth,async (req,res)=>{
    try {
        //remove posts
        await Post.deleteMany({ user: req.user.id });
        //Remove profile
        await Profile.findOneAndRemove({user: req.user.id});
        //Remove User
        await User.findOneAndRemove({_id: req.user.id});
        res.json({msg:'User Deleted'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
// PUT api/profile/education
// Add Profile education
router.put('/education',[auth,[
    check('school','Title is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('fieldofstudy','Field of study is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty()    
]],
    async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
    }
    try {
        const profile = await Profile.findOne({user:req.user.id});

        profile.education.unshift(newEdu);

        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
// @route DELETE api/profile/education/:edu_id
//Delete Education

router.delete('/education/:edu_id',auth,async(req,res)=>{
    try {
        const profile = await Profile.findOne({user:req.user.id});
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
//@route GET api/proifle/github/:username
// Get user repos from Github

router.get('/github/:username',(req,res)=>{
    try {
       const options={
        uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&
        sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=
        ${config.get('githubSecret')}`,method:'GET',
        headers:{'user-agent':'node.js'}
       } 
       request(options,(error,response,body)=>{
        if(error) console.error(error);
        if(response.statusCode !== 200){
            return res.status(404).json({msg:'No Github profile found'});
        }

        res.json(JSON.parse(body));
       })       
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
 

module.exports = router;