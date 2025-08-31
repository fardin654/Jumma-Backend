const express = require("express");
const router = express.Router();
const Users = require("../models/User");
const bcrypt = require("bcryptjs");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, AccessCode } = req.body;
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingCode = await Users.findOne({ AccessCode });
    if (existingCode) {
      return res.status(400).json({ message: "Access Code already registered" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // create user
    const newUser = new Users({
      username,
      email,
      password: hashedPassword,
      AccessCode
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user exists
    const userEmail = await Users.findOne({ email });
    const userName = await Users.findOne({ username: email });
    if (!userEmail && ! userName) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // check password
    const user = userEmail || userName;
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ "AccessCode": user.AccessCode});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Authenticate
router.post("/authenticate", async (req,res) => {
  try{
    const user = await Users.findOne({AccessCode: req.body.AccessCode});
    if(!user){
      return res.status(400).json({message: "Authentication Failed."})
    }
    res.status(200).json({ message: "Authentication successful"});
  }catch {
    res.status(400).json({ message: "Authentication Failed." });
  }
  
})

module.exports = router;
