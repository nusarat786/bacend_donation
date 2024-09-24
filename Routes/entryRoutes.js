const Entry = require('../Db/Entry');
const Event = require('../Db/Event');

const express = require('express');
const handleError = require('../Utils/erroHandel');
const verifyLogin = require('../Middelware/authcheck');
const router = express.Router();

// Create Entry API
router.post('/entries', verifyLogin, async (req, res) => {
    const { event_id, contributor_name, contributor_nickname, amount, entry_type } = req.body;

    try {
        const event = await Event.findOne({ where: { event_id } });
        if (!event) {
            return res.status(404).json({ error: true, message: 'Event not found.' });
        }

        const newEntry = await Entry.create({
            event_id,
            contributor_name: contributor_name.trim(),
            contributor_nickname: contributor_nickname ? contributor_nickname.trim() : '',
            amount,
            entry_type: entry_type.trim(),
        });

        res.status(201).json({
            error: false,
            message: "Entry created successfully",
            data: newEntry,
        });
    } catch (err) {
        handleError(res, err);
    }
});

// Get All Entries API
router.get('/entries', verifyLogin, async (req, res) => {
    try {
        const entries = await Entry.findAll({
            include: { model: Event, attributes: ['event_name', 'event_date'] }, // Optional: Include related event info
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            error: false,
            message: 'Entries fetched successfully',
            data: entries,
        });
    } catch (err) {
        handleError(res, err);
    }
});


// // Get All Entries by Event ID API
// router.get('/entries/event/:event_id', verifyLogin, async (req, res) => {
//     const { event_id } = req.params;

//     try {
//         const event = await Event.findOne({ where: { event_id } });

//         if (!event) {
//             return res.status(404).json({ error: true, message: 'Event not found.' });
//         }

//         const entries = await Entry.findAll({
//             where: { event_id },
//             order: [['createdAt', 'DESC']],
//         });

//         res.status(200).json({
//             error: false,
//             message: 'Entries fetched successfully for the event',
//             data: entries,
//             data2:{
//                 totaltransaction:entries.length,

//             }
//         });
//     } catch (err) {
//         handleError(res, err);
//     }
// });

// Get All Entries by Event ID API
router.get('/entries/event/:event_id', verifyLogin, async (req, res) => {
    const { event_id } = req.params;

    try {
        const event = await Event.findOne({ where: { event_id } });

        if (!event) {
            return res.status(404).json({ error: true, message: 'Event not found.' });
        }

        // Fetch entries and calculate total amount
        const entries = await Entry.findAll({
            where: { event_id },
            order: [['createdAt', 'DESC']],
        });

        // Calculate total amount collected
        const totalAmount = entries.reduce((acc, entry) => acc + entry.amount, 0);

        res.status(200).json({
            error: false,
            message: 'Entries fetched successfully for the event',
            data: entries,
            totalTransactions: entries.length + ' ',
            totalAmount: totalAmount+ ' ', // Add total amount here   
        });
    } catch (err) {
        handleError(res, err);
    }
});





// Get Entry by ID API
router.get('/entries/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const entry = await Entry.findOne({
            where: { entry_id: id },
            include: { model: Event, attributes: ['event_name', 'event_date'] } // Optional: Include related event info
        });

        if (!entry) {
            return res.status(404).json({ error: true, message: 'Entry not found.' });
        }

        res.status(200).json({
            error: false,
            message: 'Entry fetched successfully',
            data: entry,
        });
    } catch (err) {
        handleError(res, err);
    }
});

// Update Entry API
router.put('/entries/:id', verifyLogin, async (req, res) => {
    const { id } = req.params;
    const { contributor_name, contributor_nickname, amount, entry_type } = req.body;

    try {
        const entry = await Entry.findOne({ where: { entry_id: id } });

        if (!entry) {
            return res.status(404).json({ error: true, message: 'Entry not found.' });
        }

        const updatedEntryData = {
            contributor_name: contributor_name ? contributor_name.trim() : entry.contributor_name,
            contributor_nickname: contributor_nickname ? contributor_nickname.trim() : entry.contributor_nickname,
            amount: amount || entry.amount,
            entry_type: entry_type ? entry_type.trim() : entry.entry_type,
        };

        await entry.update(updatedEntryData);

        res.status(200).json({
            error: false,
            message: "Entry updated successfully",
            data: updatedEntryData,
        });
    } catch (err) {
        handleError(res, err);
    }
});

// Delete Entry API
router.delete('/entries/:id', verifyLogin, async (req, res) => {
    const { id } = req.params;

    try {
        const entry = await Entry.findOne({ where: { entry_id: id } });

        if (!entry) {
            return res.status(404).json({ error: true, message: 'Entry not found.' });
        }

        await entry.destroy();

        res.status(200).json({
            error: false,
            message: "Entry deleted successfully",
        });
    } catch (err) {
        handleError(res, err);
    }
});

module.exports = router;
