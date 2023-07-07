const express = require("express");
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const secret = "secret123";

const generateJWT = (user) => {
  const payLoad = {
    username: user.username,
  };
  const token = jwt.sign(payLoad, secret, { expiresIn: "1h" });
  return token;
};

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(401);
  }
  jwt.verify(token,secret, (err,user) => {
    if (err) {
      return res.sendStatus(401);
    }
    req.user = user;
    next();
  });
};

const adminSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

// User schema
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  purchasedCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }]
});

const courseSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  imageLink: {
    type: String,
    required: true
  },
  published: {
    type: Boolean,
    default: false
  }
});

const dbUrl = 'mongodb+srv://sagnik:123@cluster0.7onbywq.mongodb.net/';

// Connect to the database
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to the database');
}).catch((error) => {
  console.error('Error connecting to the database:', error);
});

const Course = mongoose.model('Course', courseSchema);
const Admin = mongoose.model('Admin', adminSchema);
const User = mongoose.model('User', userSchema);

// Admin routes
app.post("/admin/signup", async(req, res) => {
  // logic to sign up admin
  const admin = req.body;
  const existing = await Admin.findOne({username : admin.username});
  if(existing){
    res.status(403).send({message : "Admin already exists"});
  }else{
    await new Admin(admin).save();
    const token = generateJWT(admin);
    res.send({message : "Admin created successfully",token});
  }
});

app.post("/admin/login", async(req, res) => {
  // logic to log in admin
  const admin = req.headers;
  const existing = await Admin.findOne({username : admin.username,password : admin.password});
  if(existing){
    const token = generateJWT(admin);
    res.send({message : "Logged in succesfully",token});
  }else{
    res.status(403).send("Authorization failed");
  }
});

app.post("/admin/courses",authenticateJWT,async(req, res) => {
  // logic to create a course
  const course = req.body;
  const existing = await Course.findOne({title : course.title});
  if(existing){
    res.status(403).send({message : "Course already exists"});
  }
  else{
    await new Course(course).save();
    res.send({message : "Course created succesfully"});
  }
});

app.put("/admin/courses/:courseId",authenticateJWT,async(req, res) => {
  // logic to edit a course
  const courseId = req.params.courseId;
  const existing = await Course.findById(courseId);
  if(existing){
    const course = req.body;
    await Course.findByIdAndUpdate(courseId,course);
    res.send({message : "Course updated successfully"});
  }else{
    res.status(404).send({message : "Course not found"});
  }
});

app.get("/admin/courses",authenticateJWT, async(req, res) => {
  // logic to get all courses
  const courses = await Course.find();
  res.send({courses : courses});
});

// User routes
app.post("/users/signup", async(req, res) => {
  // logic to sign up user
  const user = req.body;
  const existing = await User.findOne({username : user.username});
  if(existing){
    res.status(403).send({message : "Admin already exists"});
  }else{
    user.purchasedCourses = [];
    await new User(user).save();
    const token = generateJWT(user);
    res.send({message : "Admin created successfully",token});
  }
});

app.post("/users/login", async(req, res) => {
  // logic to log in user
  const user = req.headers;
  const existing = await User.findOne({username : user.username,password : user.password});
  if(existing){
    const token = generateJWT(user);
    res.send({message : "Logged in succesfully",token});
  }else{
    res.status(403).send("Authorization failed");
  }
});

app.get("/users/courses",authenticateJWT, async(req, res) => {
  // logic to list all courses
  const courses = await Course.find();
  res.send({courses : courses});
});

app.post("/users/courses/:courseId",authenticateJWT, async(req, res) => {
  // logic to purchase a course
  const courseId = req.params.courseId;
  const existing = await Course.findOne({_id : courseId, published : true});
  if(existing){
    const username = req.user.username;
    const user =await User.findOne({username : username});
    user.purchasedCourses.push(courseId);
    await user.save();
    const user2 =await User.findOne({username : username});
    console.log(user2)
    res.send({message : "Course purchased succesfully"});
  }else{
    res.status(404).send({message : "No such course found"});
  }
});

app.get("/users/purchasedCourses",authenticateJWT, async(req, res) => {
  // logic to view purchased courses
  const username = req.user.username;
  const user =await User.findOne({username : username});
  const purchasedCourses = await Course.find({ _id: { $in: user.purchasedCourses } });
  res.send({purchasedCourses : purchasedCourses});
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
