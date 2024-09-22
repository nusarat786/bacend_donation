const handleError = (res, err) => {
    console.error(err);
    console.log('Error Name:', err.name);

    switch (err.name) {
        case 'SequelizeValidationError':
            return res.status(400).json({ 
                error: true, 
                message: err.errors.map(e => e.message).join(", "), 
                errObj: err 
            });
        case 'SequelizeUniqueConstraintError':
            return res.status(409).json({ 
                error: true, 
                message: err.errors[0].message, 
                errObj: err 
            });
        case 'SequelizeForeignKeyConstraintError':
            return res.status(400).json({ 
                error: true, 
                message: err.message, 
                errObj: err 
            });
        case 'SequelizeDatabaseError':
            return res.status(500).json({ 
                error: true, 
                message: err.message, 
                errObj: err 
            });
        case 'SequelizeTimeoutError':
            return res.status(503).json({ 
                error: true, 
                message: err.message, 
                errObj: err 
            });
        // Add more cases for other error types as needed
        default:
            return res.status(500).json({ 
                error: true, 
                message: "Internal Server Error", 
                errObj: err 
            });
    }
};

module.exports = handleError;
