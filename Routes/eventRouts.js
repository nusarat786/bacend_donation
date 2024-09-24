const { createCanvas, loadImage } = require('canvas');
const Entry = require('../Db/Entry');
const Event = require('../Db/Event');
const User = require('../Db/User')
const express = require('express');
const handleError = require('../Utils/erroHandel');
const verifyLogin = require('../Middelware/authcheck');
const ExcelJS = require('exceljs');
const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const path = require('path')
require('dotenv').config();

// Create Event API
router.post('/events', verifyLogin, async (req, res) => {
    const { event_name, description, event_date, location } = req.body;
    const created_by = req.user.user_id; // Extract user ID from JWT token

    try {
        const newEvent = await Event.create({
            event_name,
            description,
            event_date,
            location,
            created_by,
        });

        res.status(201).json({
            error: false,
            message: "Event created successfully",
            data: newEvent,
        });
    } catch (err) {
        handleError(res, err);
    }
});

// // Get all Events API
// router.get('/events', async (req, res) => {
//     try {
//         const events = await Event.findAll();
//         res.status(200).json({
//             error: false,
//             message: 'Events fetched successfully',
//             data: events,
//         });
//     } catch (err) {
//         handleError(res, err);
//     }
// });

// Get all Events API (related to the authenticated user)

// router.get('/events', verifyLogin, async (req, res) => {
//     const userId = req.user.user_id; // Extract user ID from JWT token

//     try {
//         const events = await Event.findAll({
//             where: { created_by: userId } // Fetch only events created by the user
//         });
        
//         res.status(200).json({
//             error: false,
//             message: 'Your events fetched successfully',
//             data: events,
//         });
//     } catch (err) {
//         handleError(res, err);
//     }
// });

router.get('/events', verifyLogin, async (req, res) => {
    const userId = req.user.user_id; 

    try {
        const events = await Event.findAll({
            where: { created_by: userId }, 
            order: [['updatedAt', 'DESC']]  
        });
        
        res.status(200).json({
            error: false,
            message: 'Your events fetched successfully',
            data: events,
        });
    } catch (err) {
        handleError(res, err);
    }
});


// Get Event by ID API
router.get('/events/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findOne({ where: { event_id: id } });

        if (!event) {
            return res.status(404).json({ error: true, message: 'Event not found.' });
        }

        res.status(200).json({
            error: false,
            message: 'Event fetched successfully',
            data: event,
        });
    } catch (err) {
        handleError(res, err);
    }
});

// Update Event API
router.put('/events/:id', verifyLogin, async (req, res) => {
    const { id } = req.params;
    const { event_name, description, event_date, location } = req.body;

    try {
        const event = await Event.findOne({ where: { event_id: id } });

        if (!event) {
            return res.status(404).json({ error: true, message: 'Event not found.' });
        }

        const updatedEventData = {
            event_name: event_name || event.event_name,
            description: description || event.description,
            event_date: event_date || event.event_date,
            location: location || event.location,
        };

        await event.update(updatedEventData);

        res.status(200).json({
            error: false,
            message: "Event updated successfully",
            data: updatedEventData,
        });
    } catch (err) {
        handleError(res, err);
    }
});

// Delete Event API
router.delete('/events/:id', verifyLogin, async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findOne({ where: { event_id: id } });

        if (!event) {
            return res.status(404).json({ error: true, message: 'Event not found.' });
        }

        await event.destroy();

        res.status(200).json({
            error: false,
            message: "Event deleted successfully",
        });
    } catch (err) {
        handleError(res, err);
    }
});

// Get Event by ID and respond with an Excel report
router.get('/events/excel/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const event = await Event.findOne({ where: { event_id: id } });

        if (!event) {
            return res.status(404).json({ error: true, message: 'Event not found.' });
        }

        // Create a new workbook and add a worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Event Details');

        // Define the columns
        worksheet.columns = [
            { header: 'Event ID', key: 'event_id', width: 15 },
            { header: 'Event Name', key: 'event_name', width: 30 },
            { header: 'Event Date', key: 'event_date', width: 20 },
            // Add other fields as needed
        ];

        // Add the event data to the worksheet
        worksheet.addRow({
            event_id: event.event_id,
            event_name: event.event_name,
            event_date: event.event_date.toISOString().split('T')[0], // Format date if necessary
        });

        // Set the response headers for Excel file download
        res.setHeader('Content-Disposition', `attachment; filename=event_${id}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Write the workbook to a buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Send the buffer as the response
        res.status(200).send(buffer);
    } catch (err) {
        handleError(res, err);
    }
});




// // Path to your service account key file
// let serviceAccountPath = path.resolve(__dirname, 'interviewqestion.json');

// // Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;




// // Initialize Firebase Admin with the service account
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccountPath),
//   storageBucket: 'interviewqestion.appspot.com' // Your Firebase storage bucket name
// });


// Initialize Firebase Admin with the service account
admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS))),
    storageBucket: 'interviewqestion.appspot.com' // Your Firebase storage bucket name
  });

// Create a Google Cloud Storage client
const storage = new Storage();


const bucketName = 'interviewqestion.appspot.com'; // Your bucket name

// Get Event by ID and respond with a downloadable URL for an Excel report
router.get('/events/excel2/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the event from PostgreSQL
    const event = await Event.findOne({ where: { event_id: id } });

    if (!event) {
      return res.status(404).json({ error: true, message: 'Event not found.' });
    }

    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Event Details');

    // Define the columns
    worksheet.columns = [
      { header: 'Event ID', key: 'event_id', width: 15 },
      { header: 'Event Name', key: 'event_name', width: 30 },
      { header: 'Event Date', key: 'event_date', width: 20 },
      // Add other fields as needed
    ];

    // Add the event data to the worksheet
    worksheet.addRow({
      event_id: event.event_id,
      event_name: event.event_name,
      event_date: event.event_date.toISOString().split('T')[0], // Format date if necessary
    });

    // Write the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generate a unique file name
    const fileName = `event_${id}_${Date.now()}.xlsx`;

    // Create a file in Firebase Storage
    const file = storage.bucket(bucketName).file(fileName);

    // Upload the buffer to Firebase Storage
    await file.save(buffer, {
      metadata: {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      public: true, // Make the file publicly accessible
    });

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    // Respond with the public URL
    res.status(200).json({
      error: false,
      message: 'Report generated successfully',
      url: publicUrl,
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});



// // Retrieve the credentials from environment variables
// const serviceAccount = {
//     type: process.env.FIREBASE_TYPE,
//     project_id: process.env.FIREBASE_PROJECT_ID,
//     private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//     private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Ensure proper format for private key
//     client_email: process.env.FIREBASE_CLIENT_EMAIL,
//     client_id: process.env.FIREBASE_CLIENT_ID,
//     auth_uri: process.env.FIREBASE_AUTH_URI,
//     token_uri: process.env.FIREBASE_TOKEN_URI,
//     auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
//     client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
//   };
  
//   // Initialize Firebase Admin SDK with the credentials object
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     storageBucket: 'interviewqestion.appspot.com' // Your Firebase storage bucket name
//   });
  
//   // Create a Google Cloud Storage client
//   const storage = new Storage();
  
//   // Define the bucket name
//   const bucketName = 'interviewqestion.appspot.com'; // Your bucket name
  
//   // Route to handle Excel report generation
//   router.get('/events/excel2/:id', async (req, res) => {
//     const { id } = req.params;
  
//     try {
//       // Fetch the event from your PostgreSQL database
//       const event = await Event.findOne({ where: { event_id: id } });
  
//       if (!event) {
//         return res.status(404).json({ error: true, message: 'Event not found.' });
//       }
  
//       // Create a new workbook and add a worksheet
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Event Details');
  
//       // Define the columns
//       worksheet.columns = [
//         { header: 'Event ID', key: 'event_id', width: 15 },
//         { header: 'Event Name', key: 'event_name', width: 30 },
//         { header: 'Event Date', key: 'event_date', width: 20 },
//         // Add more fields as needed
//       ];
  
//       // Add the event data to the worksheet
//       worksheet.addRow({
//         event_id: event.event_id,
//         event_name: event.event_name,
//         event_date: event.event_date.toISOString().split('T')[0], // Format date if necessary
//       });
  
//       // Write the workbook to a buffer
//       const buffer = await workbook.xlsx.writeBuffer();
  
//       // Generate a unique file name
//       const fileName = `event_${id}_${Date.now()}.xlsx`;
  
//       // Create a file in Firebase Storage
//       const file = storage.bucket(bucketName).file(fileName);
  
//       // Upload the buffer to Firebase Storage
//       await file.save(buffer, {
//         metadata: {
//           contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         },
//         public: true, // Make the file publicly accessible
//       });
  
//       // Get the public URL for the file
//       const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
  
//       // Respond with the public URL
//       res.status(200).json({
//         error: false,
//         message: 'Report generated successfully',
//         url: publicUrl,
//       });
//     } catch (err) {
//       console.error('Error generating report:', err);
//       res.status(500).json({ error: true, message: 'Internal server error' });
//     }
//   });

const bucket = admin.storage().bucket();


// Function to create and upload the receipt image
async function createReceipt(entryId) {
    try {
      // Fetch the entry details first
      const entry = await Entry.findOne({ where: { entry_id: entryId } });
  
      if (!entry) {
        throw new Error('Entry not found');
      }
  
      // Fetch the event separately by the event_id in the entry
      const event = await Event.findOne({ where: { event_id: entry.event_id } });
  
      if (!event) {
        throw new Error('Event not found');
      }
  
      // Fetch the user separately using the user_id from the event
      const user = await User.findOne({ where: { user_id: event.created_by } });
  
      if (!user) {
        throw new Error('Event creator (user) not found');
      }
  
      // Extract the required data
      const { contributor_name, amount, date } = entry;
      const { event_name, event_date, location } = event;
  
      // Create a canvas to generate the receipt image
      const width = 600;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
  
      // Add background color
      ctx.fillStyle = '#f5f5f5'; // Light gray background
      ctx.fillRect(0, 0, width, height);
  
      // Add title text
      ctx.fillStyle = '#333';
      ctx.font = 'bold 30px Arial';
      ctx.fillText('Donation Receipt', 180, 50);
  
      // Add receipt details
      ctx.font = '20px Arial';
      ctx.fillStyle = '#000';
      ctx.fillText(`Donor: ${contributor_name}`, 50, 100);
      ctx.fillText(`Amount: $${amount.toFixed(2)}`, 50, 140);
      ctx.fillText(`Date: ${new Date(date).toLocaleDateString()}`, 50, 180);
      ctx.fillText(`Event: ${event_name}`, 50, 220);
      ctx.fillText(`Event Date: ${new Date(event_date).toLocaleDateString()}`, 50, 260);
      ctx.fillText(`Location: ${location}`, 50, 300);
      ctx.fillText(`Organized by: ${user.name}`, 50, 340);
  
      // Add signature-like text
      ctx.font = 'italic 20px Arial';
      ctx.fillText('Signed by: Event Organizer', 380, 380);
  
      // Convert the canvas to a buffer
      const buffer = canvas.toBuffer('image/png');
  
      // Generate a unique file name for the receipt image
      const fileName = `receipts/receipt_${entryId}_${Date.now()}.png`;
  
      // Create a file in Firebase Storage
      const file = bucket.file(fileName);
  
      // Upload the buffer to Firebase Storage
      await file.save(buffer, {
        metadata: {
          contentType: 'image/png',
        },
        public: true, // Make the file publicly accessible
      });
  
      // Get the public URL of the uploaded image
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  
      console.log('Receipt uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Error creating receipt:', err);
      throw err;
    }
  }

async function createReceipt2(entryId) {
    try {
      const entry = await Entry.findOne({ where: { entry_id: entryId } });
      if (!entry) throw new Error('Entry not found');
  
      const event = await Event.findOne({ where: { event_id: entry.event_id } });
      if (!event) throw new Error('Event not found');
  
      const user = await User.findOne({ where: { user_id: event.created_by } });
      if (!user) throw new Error('Event creator (user) not found');
  
      // Extracting data
      const { contributor_name, amount, date } = entry;
      const { event_name, event_date, location } = event;
  
      // Create a canvas with width and height similar to the provided image
      const width = 800;
      const height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
  
      // Background (Light Grey)
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, width, height);
  
      // Header - Charity Name
      ctx.fillStyle = '#000080';
      ctx.font = 'bold 30px Arial';
      ctx.fillText('Charity Name', 300, 50);
  
      // Address, Website, Email, and Tax ID
      ctx.font = '20px Arial';
      ctx.fillText('Address, Website, email', 270, 90);
      ctx.fillText('Tax ID ###########', 300, 120);
  
      // Title - Donation Receipt
      ctx.font = 'bold 25px Arial';
      ctx.fillStyle = '#333';
      ctx.fillText('DONATION RECEIPT', 280, 170);
  
      // Lines and Fields
      ctx.font = '18px Arial';
      ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 50, 220);
      ctx.fillText('Receipt No.: ', 600, 220);  // Left a blank for receipt number
  
      ctx.fillText(`Donated By: ${contributor_name}`, 50, 260);
      ctx.fillText('Donor Address:', 50, 300);
  
      ctx.fillText(`Amount received by charity (A): $${amount.toFixed(2)}`, 50, 340);
  
      ctx.fillText('Value of advantage (B): ______________', 50, 380);
      ctx.fillText('Eligible amount for tax purposes (A - B): ______________', 50, 420);
  
      ctx.fillText('Appraised by: ______________', 50, 460);
      ctx.fillText('Appraiser address: ______________', 50, 500);
  
      ctx.fillText('Description of property received by charity:', 50, 540);
  
      // Authorized signature line
      ctx.fillText('Authorized signature:', 50, 580);
      ctx.fillText('_________________________', 200, 580);
  
      // Convert canvas to buffer
      const buffer = canvas.toBuffer('image/png');
  
      // Generate unique filename
      const fileName = `receipts/receipt_${entryId}_${Date.now()}.png`;
      const file = bucket.file(fileName);
  
      // Upload buffer to Firebase Storage
      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true,
      });
  
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log('Receipt uploaded:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Error generating receipt:', err);
      throw err;
    }
  }


async function createReceipt3(entryId) {
    try {
      const entry = await Entry.findOne({ where: { entry_id: entryId } });
      if (!entry) throw new Error('Entry not found');
  
      const event = await Event.findOne({ where: { event_id: entry.event_id } });
      if (!event) throw new Error('Event not found');
  
      const user = await User.findOne({ where: { user_id: event.created_by } });
      if (!user) throw new Error('Event creator (user) not found');
  
      // Extracting data
      const { contributor_name, amount } = entry; // Get contributor name from the Entry model
      const { event_name, location } = event;
      const userName = user.name; // Get user's name for the signature
  
      // Create a canvas with width and height
      const width = 800;
      const height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
  
      // Background (Light Grey)
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, width, height);
  
      // Centered Charity Name (For + event_name)
      ctx.fillStyle = '#000080';
      ctx.font = 'bold 30px Arial';
      const eventNameText = `For ${event_name}`;
      const eventNameWidth = ctx.measureText(eventNameText).width;
      ctx.fillText(eventNameText, (width - eventNameWidth) / 2, 50); // Center the text
  
      // Centered User's email
      ctx.font = '20px Arial';
      const userEmailText = `${user.email}`;
      const userEmailWidth = ctx.measureText(userEmailText).width;
      ctx.fillText(userEmailText, (width - userEmailWidth) / 2, 90); // Center the email
  
      // Title - Donation Receipt
      ctx.font = 'bold 25px Arial';
      ctx.fillStyle = '#333';
      ctx.fillText('DONATION RECEIPT', 280, 170);
  
      // Lines and Fields
      ctx.font = '18px Arial';
      ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 50, 220);
      ctx.fillText(`Donation ID: ${entryId}`, 600, 220); // Using entryId as Donation ID
  
      // Display Contributor's Name
      ctx.font = '20px Arial';
      ctx.fillText(`Donated By: ${contributor_name}`, 50, 260); // Normal contributor name
  
      ctx.fillText('Donor Address:', 50, 300);
      ctx.fillText(`Amount received by charity: $${amount.toFixed(2)}`, 50, 340);
  
      // Description of property received by charity
      ctx.fillText('Description of donation:', 50, 380);
      ctx.fillText(`Event: ${event_name}, Location: ${location}`, 50, 410); // Example description
  
      // Add OK logo
      const logo = await loadImage(path.join(__dirname, 'logo.png')); // Ensure you have an "OK" logo image
      ctx.drawImage(logo, 600, 480, 80, 80); // Positioning the logo
  
      // Position user's name below the logo
      ctx.font = 'italic 20px "Brush Script MT", cursive'; // Cursive font for user's name
      ctx.fillText(userName, 600, 580); // Display user's name in cursive below the logo
  
      // Convert canvas to buffer
      const buffer = canvas.toBuffer('image/png');
  
      // Generate unique filename
      const fileName = `receipts/receipt_${entryId}_${Date.now()}.png`;
      const file = bucket.file(fileName);
  
      // Upload buffer to Firebase Storage
      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true,
      });
  
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log('Receipt uploaded:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Error generating receipt:', err);
      throw err;
    }
  }
  
  // Example route to generate and return receipt URL for a specific entry
  router.get('/events/receipt/:entryId', async (req, res) => {
    const { entryId } = req.params;
  
    try {
      const receiptUrl = await createReceipt3(entryId);
      res.status(200).json({
        success: true,
        message: 'Receipt generated successfully',
        receiptUrl,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Error generating receipt',
      });
    }
  });
  
module.exports = router;



