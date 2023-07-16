const express = require('express');
const router = express.Router();
const {check, validationResult} =  require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route POST api/posts
//Create a Post
router.post('/', [auth,[
    check('text','Text is Required').not().isEmpty()
]], async (req,res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar:user.avatar,
            user:req.user.id
    })
    const post = await newPost.save();
    res.json(post);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }    
}
);
//@route GET api/posts
//Get all Posts
router.get('/', auth, async (req,res) => {
    try {
        const posts = await Post.find().sort({date:-1});
        res.json(posts)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})
//@route GET api/posts/:id
//Get all Posts by ID
router.get('/:id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({msg:'Post not found'});
        }
        res.json(post)
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId' ){
            return res.status(404).json({msg:'Post not found'});
        }
        res.status(500).send('Server Error')
    }
})

//@route DELETE api/posts/:id
//Delete a Posts
router.delete('/:id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({msg:'Post not found'});
        }

        //CHECK USER
        if(post.user.toString()!== req.user.id){
            return res.status(401).json({msg:'User not Authorized'});
        }

        await post.deleteOne();

        res.json({msg:'Post Removed'});
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId' ){
            return res.status(404).json({msg:'Post not found'});
        }
        res.status(500).send('Server Error')
    }
})
//@route PUT api/posts/like/:id
//like a post

router.put('/like/:id',auth,async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id);

        //Check if the post has already been liked
        if(post.likes.filter(like=> like.user.toString() === req.user.id).length > 0){
            return res.status(400).json({msg:'Post already liked'});
        }
        post.likes.unshift({user:req.user.id});
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

//@route PUT api/posts/unlike/:id
//unlike a post

router.put('/unlike/:id',auth,async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id);

        //Check if the post has already been liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
            return res.status(400).json({msg:'Post has not yet been liked'});
        }
        //remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})
//@route POST api/posts/comment/:id
//Comment on a post 
router.post('/comment/:id', [auth,[
    check('text','Text is Required').not().isEmpty()
]], async (req,res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar:user.avatar,
            user:req.user.id
    }
    post.comments.unshift(newComment)
    await post.save();
    res.json(post.comments);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }    
}
);

//@route DELETE api/posts/comment/:id/:comment_id
// Delete Comment
router.delete('/comment/:id/:comment_id',auth,async (req,res)=>{
    try {
        const post = await Post.findById(req.params.id);
        //PUll out Comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        //Make sure comment exists
        if(!comment){
            return res.status(400).json({msg:'Comment does not exist'})
        }
        //Check User
        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({msg:'User not authorizec'});
        }
        
        //remove index
        const removeIndex = post.likes.map(comment => comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})

module.exports = router;