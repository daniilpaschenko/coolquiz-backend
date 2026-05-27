module.exports = (err, req, res, next) => {
    
    console.error('Global error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({message: err.message});
    }

    if (err.name === 'CastError') {
        return res.status(400).json({message: 'Invalid id format'});
    }

    res.status(500).json({message: 'Internal server error'});
};