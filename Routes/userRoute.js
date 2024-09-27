const User = require('../Db/User');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const handleError = require('../Utils/erroHandel');
const crypto = require('crypto'); // For generating OTPs
const nodemailer = require('nodemailer'); // If you want to send OTP via email

const app = express();
const router = express.Router();
const verifyLogin = require('../Middelware/authcheck');
const { where } = require('sequelize');

const JWT_SECRET = 'nusarat'; 
require('dotenv').config();

router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;

    try {
     
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword, 
            phone,
        });

        res.status(201).json({
            error: false,
            message: "Registred Successfully",
            data: newUser
            //token 
        });
    } catch (err) {
        handleError(res, err);
    }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    
      const user = await User.findOne({ where: { email } });

      if (!user) {
          return res.status(404).json({ error: true, message: 'User not found.' });
      }

      // Compare the provided password with the stored hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
          return res.status(401).json({ error: true, message: 'Invalid password.' });
      }

      // Generate a JWT token
      const token = jwt.sign({ user_id: user.user_id, email: user.email,name:user.name,phone:user.phone}, JWT_SECRET);
      
      res.json({
          error: false,
          message: 'Login successful',
          token // Send the JWT token in the response
      });
  } catch (err) {
      handleError(res, err);
  }
});


router.get('/profile',verifyLogin, async (req, res) => {
   
    console.log(req.user);
    const user = await User.findOne({where:{user_id:req.user.user_id}})

    try {
        res.status(200).json({
            error: false,
            message: 'User Data Fetched',
            user:req.user,
            user2:user
        });

    } catch (err) {
        handleError(res, err);
    }
  });
  
  

// Update User API
router.put('/update-user', verifyLogin, async (req, res) => {
    const { name, email, phone } = req.body;
    const user_id = req.user.user_id;  // Extract user ID from JWT token

    try {
        // Find user by ID
        const user = await User.findOne({ where: { user_id } });

        if (!user) {
            return res.status(404).json({
                error: true,
                message: "User not found",
            });
        }

        // Prepare updated user details
        const updatedUserData = {
            name: name || user.name,  // If name is not provided, use existing value
            email: email || user.email,
            phone: phone || user.phone,
        };

        // Update the user in the database
        await user.update(updatedUserData);

        res.status(200).json({
            error: false,
            message: "profile updated successfully",
            data: updatedUserData,
        });
    } catch (err) {
        handleError(res, err);
    }
});



// Create a transporter for sending email via Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GOOGLE_GMAIL, // Your Gmail email
      pass: process.env.GOOGLE_APP_PASSWORD, // Your Gmail password or App Password if 2FA is enabled
    },
  });
  
  
  
  
  router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
  
    try {
      // Find the user by email
      const user = await User.findOne({ where: { email } });
  
      if (!user) {
        return res.status(404).json({ error: true, message: 'User not found.' });
      }
  
      // Generate a 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
  
      // Get current timestamp (as a string)
      const timestamp = Date.now().toString();
  
      // Combine OTP and timestamp (e.g., "123456:1631023022021")
      
      const otpWithTimestamp = `${otp}:${timestamp}`;
  
      // Save the OTP with timestamp to the User model
      user.Otp = otpWithTimestamp;
      await user.save();
  
      // Prepare the email
      const mailOptions = {
        from: process.env.GOOGLE_GMAIL, // Sender's email address
        to: user.email, // Recipient's email address
        subject: 'Your OTP Code',
        text: `Dear ${user.name}, \nGreetings From Team  Contribution Recorder \nYour OTP Code is : ${otp}\n It will expire in 20 minutes.`,
      };
  
      // Send the OTP email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
          return res.status(500).json({ error: true, message: 'Error sending OTP email.' });
        } else {
          console.log('Email sent:', info.response);
          res.json({
            error: false,
            message: 'OTP sent successfully. Please check your email.',
          });
        }
      });
    } catch (err) {
      console.error(err);
      handleError(res, err);
    }
  });

  router.post('/verify-otp', async (req, res) => {
    const { email, otp , password} = req.body;
  
    try {

      if(!password){
        return res.status(404).json({ error: true, message: 'Password Can\'t be Empty' });
      }

      if(!(password.length>8)){
        return res.status(404).json({ error: true, message: 'Password Should Be Of Atleast Of 8 Charachter' });
      }

      if(!(email)){
        return res.status(404).json({ error: true, message: 'Email Can Not Be Empty' });
      }

      if(!(otp)){
        return res.status(404).json({ error: true, message: 'Otp Can Not Be Empty' });
      }


      const user = await User.findOne({ where: { email } });
  
      if (!user || !user.Otp) {
        return res.status(404).json({ error: true, message: 'Invalid OTP or user not found.' });
      }

      
  
      // Split the saved OTP into the actual OTP and the timestamp
      const [savedOtp, savedTimestamp] = user.Otp.split(':');
  
      console.log(user.Otp);
      console.log(otp);
      // Check if OTP matches
      if (parseInt(savedOtp) !== parseInt(otp)) {
        return res.status(400).json({ error: true, message: 'Invalid OTP.' });
      }
  
      // Check if OTP is older than 20 minutes
      const currentTime = Date.now();
      const otpAge = currentTime - parseInt(savedTimestamp); // Time difference in milliseconds
  
      // 20 minutes = 20 * 60 * 1000 milliseconds
      const otpExpiryTime = 20 * 60 * 1000;
  
      if (otpAge > otpExpiryTime) {
        return res.status(400).json({ error: true, message: 'OTP has expired.' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.Otp =null;
      await user.save();

      // OTP is valid and within the expiration time
      res.json({
        error: false,
        message: 'Password Changed successfully.',
        data: user
      });
    } catch (err) {
      handleError(res, err);
    }
  });
  




module.exports = router;


// const token = jwt.sign({ id: newUser.user_id, email: newUser.email }, JWT_SECRET, {
//   expiresIn: '24h' 
// });