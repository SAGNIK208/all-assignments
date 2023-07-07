const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const app = express();


app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const secret = "secret123"

const generateJWT = (user)=>{
  const payLoad = {
    username : user.username
  };
  const token = jwt.sign(payLoad,secret,{expiresIn : '1h'});
  return token;
}

const authenticateUser = (req,res,next)=>{
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
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const admin = req.body;
  try {
    // Read the file synchronously
    ADMINS = JSON.parse(fs.readFileSync('./ADMINS.json', 'utf8'));
    const existing = ADMINS.find(a => a.username == admin.username);
    if(existing){
      res.status(403).send({message : "Admin already exists"});
    }
    else{
      ADMINS.push(admin);
      fs.writeFileSync('./ADMINS.json',JSON.stringify(ADMINS),'utf-8');
      const token = generateJWT(admin);
      res.send({message : "Admin created successfully",token});
    }
  } catch (error) {
    console.error('Error reading file:', error);
  }
  
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  ADMINS = JSON.parse(fs.readFileSync('./ADMINS.json', 'utf8'));
  const admin = req.headers;
  const valid = ADMINS.find(a=> a.username == admin.username && a.password == admin.password);
  if(valid){
    const token = generateJWT(admin);
    res.send({message : "Logged in successfully",token});
  }
  else{
    res.status(403).send({message : "Authorization failed"});
  }
});

app.post('/admin/courses',authenticateUser,(req, res) => {
  // logic to create a course
  const course = req.body;
  COURSES = JSON.parse(fs.readFileSync('./COURSES.json','utf-8'));
  const valid = COURSES.find(c => c.title == course.title);
  if(valid){
    res.status(403).send({message : "Course already exists"});
  }
  else{
    course.id = uuidv4();
    COURSES.push(course);
    fs.writeFileSync('./COURSES.json',JSON.stringify(COURSES),'utf-8');
    res.send({message : "Course created succesfully",courseId : course.id});
  }
});

app.put('/admin/courses/:courseId',authenticateUser, (req, res) => {
  // logic to edit a course
  const courseId = req.params.courseId;
  COURSES = JSON.parse(fs.readFileSync('./COURSES.json','utf-8'));
  const valid = COURSES.find(c => c.id == courseId);
  if(valid){
    const course = req.body;
    Object.assign(valid,course);
    fs.writeFileSync('./COURSES.json',JSON.stringify(COURSES),'utf-8');
    res.send({message : "Course Updated succesfully"});
  }else{
    res.status(404).send({message : "No such course found"});
  }
});

app.get('/admin/courses',authenticateUser,(req, res) => {
  // logic to get all courses
  COURSES = JSON.parse(fs.readFileSync('./COURSES.json','utf-8'));
  res.send({courses : COURSES});
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const user = req.body;
  USERS = JSON.parse(fs.readFileSync('./USERS.json','utf-8'));
  const valid = USERS.find(u => u.username == user.username);
  if(valid){
    res.status(403).send({message : "User already exists"});
  }else{
    user.purchasedCourses = [];
    USERS.push(user);
    fs.writeFileSync('./USERS.json',JSON.stringify(USERS),'utf-8');
    const token = generateJWT(user);
    res.send({message : "User created successfully",token});
  }
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const user = req.headers;
  USERS = JSON.parse(fs.readFileSync('./USERS.json','utf-8'));
  const valid = USERS.find(u => u.username == user.username && u.password == user.password);
  if(valid){
    const token = generateJWT(user);
    res.send({message : "Logged in successfully",token});
  }else{
    res.status(403).send({message : "Authorization failed"});
  }
});

app.get('/users/courses',authenticateUser, (req, res) => {
  // logic to list all courses
  COURSES = JSON.parse(fs.readFileSync('./COURSES.json','utf-8'));
  res.send({courses : COURSES});
});

app.post('/users/courses/:courseId',authenticateUser, (req, res) => {
  // logic to purchase a course
  const courseId = req.params.courseId;
  COURSES = JSON.parse(fs.readFileSync('./COURSES.json','utf-8'));
  const course = COURSES.find(c => c.id == courseId && c.published);
  if(course){
    const username = req.user.username;
    USERS = JSON.parse(fs.readFileSync('./USERS.json','utf-8'));
    const user = USERS.find(u => u.username == username);
    user.purchasedCourses.push(courseId);
    fs.writeFileSync('./USERS.json',JSON.stringify(USERS),'utf-8');
    res.send({ message: 'Course purchased successfully' });
  }else{
    res.status(404).send({message : "No such course exists"});
  }

});

app.get('/users/purchasedCourses',authenticateUser, (req, res) => {
  // logic to view purchased courses
  const username = req.user.username;
  USERS = JSON.parse(fs.readFileSync('./USERS.json','utf-8'));
  const user = USERS.find(u => u.username == username);
  COURSES = JSON.parse(fs.readFileSync('./COURSES.json','utf-8'));
  const purchasedCourses = COURSES.filter(c => user.purchasedCourses.includes(c.id));
  res.send({purchasedCourses : purchasedCourses});
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
