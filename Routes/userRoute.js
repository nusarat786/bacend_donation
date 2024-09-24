const User = require('../Db/User');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const handleError = require('../Utils/erroHandel');

const app = express();
const router = express.Router();
const verifyLogin = require('../Middelware/authcheck');
const { where } = require('sequelize');

const JWT_SECRET = 'nusarat'; 

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




module.exports = router;


// const token = jwt.sign({ id: newUser.user_id, email: newUser.email }, JWT_SECRET, {
//   expiresIn: '24h' 
// });