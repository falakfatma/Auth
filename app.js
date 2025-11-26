const express = require('express');
const app = express();
const userModel = require('./model/user');
const postModel = require('./model/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get('/', (req, res) => {
    res.render('index');
});

app.post('/register', async (req, res) => {
    let { username, name, email, password, age } = req.body;
    let user = await userModel.findOne({email})
    if(user){
        return res.status(500).send('User already exists');
    }else{
        bcrypt.genSalt(10, (err, salt)=>{
            bcrypt.hash(password, salt, async (err, hash)=>{
                let user = await userModel.create({username, name, email, password: hash, age});
                let token = jwt.sign({email,id: user._id, password:hash},"secretkey");
                res.cookie('token', token);
                // res.send('User registered successfully');
                res.redirect('/profile');
            })
        })
    }
});

app.get('/profile', isLogIn ,async (req, res) => {
    // console.log(req.user);
    const user = await userModel.findOne({email: req.user.email}).populate('posts');
    // console.log(user);
    res.render('profile',{user});
});
app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({email})
    if(!user){
        return res.status(500).send('Something went wrong');
    }else{
        bcrypt.compare(password, user.password, (err, result)=>{
            if(result){
                let token = jwt.sign({email,id: user._id, password:user.password},"secretkey");
                res.cookie('token', token);
                res.redirect('/profile');
            }
        })
    }
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/logout', (req, res) => {
    // res.clearCookie('token');
    res.cookie('token', '');
    res.send('Logged out successfully');
});
function isLogIn (req, res, next){
    let token = req.cookies.token;
    if(token === ""|| !token){
        return res.status(401).send('Unauthorized');
    }
    try{
        let decoded = jwt.verify(token, 'secretkey');
        req.user = decoded;
        next();
    }catch(err){
        return res.status(401).send('Unauthorized');
    }
}
app.post('/post', isLogIn, async (req, res) => {
    const user = await userModel.findOne({email: req.user.email});
    let { content } = req.body;
    console.log(user);
    let post = await postModel.create({user: req.user.id, content});
    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile');
});
app.get('/likes/:id', isLogIn, async (req, res) => {
    let post = await postModel.findOne({user: req.params.id}).populate('user');
    // if(!post){
    console.log(req.params.id, " : ", res.user.id);
    //     return res.status(404).send('Post not found');
    // }
    // console.log("id : ",req.user.id);
    if( post.Likes.indexOf(req.user.id) == -1){
    post.Likes.push(req.user.id);
    }else{
        post.Likes.splice(post.Likes.indexOf(req.user.id), 1);
    }
    await post.save();
    res.redirect('/profile');
    // console.log(post);
})
app.get('/postUpdate/:id', isLogIn, async (req, res) => {
    let post = await postModel.findOne({user: req.params.id}).populate('user');
    res.render('edit',{post});
    console.log(post);
})
app.post('/update/:id', isLogIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
    res.redirect('/profile');
});

app.listen(3000);