const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require("uuid");
const app = express();

const secret = "secretABC";

const generateJWT = (user)=>{
  const payLoad = {username : user.username};
  return jwt.sign(payLoad,secret,{expiresIn: '1h'});
}

const authenticateJWT = (req,res,next)=>{
  const authHeader = req.headers.authorization;
  if(authHeader){
    const token = authHeader.split(" ")[1];
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  }else{
      res.sendStatus(401);
  }
}

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const admin = req.body;
  const existingAdmin = ADMINS.find(a => admin.username == a.username);
  if(existingAdmin){
    res.status(403).send("user already exists");
  }
  else{
    ADMINS.push(admin);
    const token = generateJWT(admin);
    res.send({message : "Admin Created succesfully",token});
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const admin = req.headers;
  // console.log(admin,ADMINS);
  const valid = ADMINS.find(a => admin.username == a.username && admin.password == a.password);
  if(valid){
      const token = generateJWT(admin);
      res.send({message : "Logged in succesfully",token});
  }
  else{
    res.status(403).send("Authentication Failed");
  }
});

app.post('/admin/courses',authenticateJWT,(req, res) => {
  // logic to create a course
  const course = req.body;
  const valid = COURSES.find(c => course.title == c.title);
  if(valid){
    res.status(403).send({message : "course already exists"});
  }
  else{
    course.id = uuidv4();
    COURSES.push(course);
    res.send({message : "Course created successfullly", courseId : course.id});
  }
});

app.put('/admin/courses/:courseId',authenticateJWT, (req, res) => {
  // logic to edit a course
  const courseId = req.params.courseId;
  const valid = COURSES.find(c => c.id == courseId);
  if(valid){
    const course = req.body;
    Object.assign(valid,course);
    res.send({message : "Course Updated succesfully"});
  }
  else{
    res.status(404).send({message : "No such course found"});
  }
});

app.get('/admin/courses',authenticateJWT, (req, res) => {
  // logic to get all courses
  res.status(200).send({courses:COURSES});
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const user = req.body;
  const existingUser = USERS.find(u => u.username == user.username);
  if(existingUser){
    res.status(403).send({message : "User already exists"});
  }
  else{
    user.purchasedCourses = [];
    USERS.push(user);
    const token = generateJWT(user);
    res.send({message : "User created succesfully",token});
  }
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const user = req.headers;
  const valid = USERS.find(u => user.username == u.username && user.password == u.password);
  if(valid){
    const token = generateJWT(user);
    res.send({message : "Logged in succesfully",token});
  }
  else{
    res.status(403).send({message : "Authorization failed"});
  }
});

app.get('/users/courses',authenticateJWT, (req, res) => {
  // logic to list all courses
  res.status(200).send({courses:COURSES});
});

app.post('/users/courses/:courseId',authenticateJWT, (req, res) => {
  // logic to purchase a course
  const courseId = req.params.courseId;
  const course = COURSES.find(c => c.id == courseId && c.published);
  if (course) {
    const user = USERS.find(u => u.username == req.user.username);
    user.purchasedCourses.push(course.id);
    res.json({ message: 'Course purchased successfully' });
  } else {
    res.status(404).json({ message: 'Course not found or not available' });
  }
});

app.get('/users/purchasedCourses',authenticateJWT, (req, res) => {
  // logic to view purchased courses
  const user = USERS.find(u => u.username == req.user.username);
  const purchasedCourses = COURSES.filter(c => user.purchasedCourses.includes(c.id));
  res.status(200).send({courses:purchasedCourses});
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
