import express from 'express';

const testRouter = express.Router();

// GET /api/test
testRouter.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Test route is working!',
        timestamp: new Date().toISOString()
    });
});

// POST /api/test
testRouter.post('/', (req, res) => {
    const { data } = req.body;
    res.json({
        success: true,
        message: 'POST request received',
        receivedData: data || 'No data provided'
    });
});

// GET /api/test/:id
testRouter.get('/:id', (req, res) => {
    const { id } = req.params;
    res.json({
        success: true,
        message: `Test route with ID: ${id}`,
        id: id
    });
});

export default testRouter;