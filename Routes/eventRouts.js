const Event = require('../Db/Event');
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


module.exports = router;
