const express = require('express');
const app = express();
const { v4: uuidv4 } = require("uuid");

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const authenticateAdmin = (req,res,next)=>{
  const {username,password} = req.headers;
  const valid = ADMINS.find(admin => admin.username == username && admin.password == password);
  if(valid){
    next();
  }
  else{
    res.status(403).send({message:"Authentication failed"});
  }
};

const authenticateUser = (req,res,next)=>{
  const {username,password} = req.headers;
  const valid = USERS.find(user => user.username == username && user.password == password);
  if(valid){
    req.user = valid;
    next();
  }
  else{
    res.status(403).send({message:"Authentication failed"});
  }
};

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const admin = req.body;
  const existingAdmin = ADMINS.find(a => a.username == admin.username);
  if(existingAdmin){
    res.status(403).send({message : "Admin already exists"});
  }
  else{
    ADMINS.push(admin);
    res.status(200).send({message:"Admin created successfully"});
  }
});

app.post('/admin/login',authenticateAdmin,(req, res) => {
  // logic to log in admin
  res.status(200).send({message : "Logged in successfully"})
});

app.post('/admin/courses',authenticateAdmin,(req, res) => {
  // logic to create a course
  const course = req.body;
  course.id = uuidv4();
  const valid = COURSES.find(c => course.title == c.title);
  if(valid){
    res.status(403).send({message:"course already exists"});
  }
  else{
    COURSES.push(course);
    res.status(200).send({message:"Course created successfully",courseId:course.id});
  }
});

app.put('/admin/courses/:courseId',authenticateAdmin,(req, res) => {
  // logic to edit a course
  const courseId = req.params.courseId;
  const valid = COURSES.find(course => course.id == courseId);
  if(valid){
      Object.assign(valid,req.body);
      res.status(200).send({message:"course updated succesfully"});
  }
  else{
    res.status(404).send({message:"course not found"});
  }
});

app.get('/admin/courses',authenticateAdmin,(req, res) => {
  // logic to get all courses
  res.status(200).send({courses:COURSES});
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const user = req.body;
  user.purchasedCourses = [];
  const existingUser = USERS.find(u => u.username == user.username);
  if(existingUser){
    res.status(403).send({message:"User already exists"});
  }
  else{
    USERS.push(user);
    res.status(200).send({message:"User created successfully"});
  }
});

app.post('/users/login',authenticateUser,(req, res) => {
  // logic to log in user
  res.status(200).send({message : "Logged in successfully"})
});

app.get('/users/courses',authenticateUser,(req, res) => {
  // logic to list all courses
  res.status(200).send({courses:COURSES});
});

app.post('/users/courses/:courseId',authenticateUser,(req, res) => {
  // logic to purchase a course
  const courseId = req.params.courseId;
  const course = COURSES.find(c => c.id === courseId && c.published);
  if (course) {
    req.user.purchasedCourses.push(courseId);
    res.json({ message: 'Course purchased successfully' });
  } else {
    res.status(404).json({ message: 'Course not found or not available' });
  }
});

app.get('/users/purchasedCourses',authenticateUser,(req, res) => {
  // logic to view purchased courses
  const purchasedCourses = COURSES.filter(c => req.user.purchasedCourses.includes(c.id));
  res.status(200).send({courses:purchasedCourses});
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
