import express from 'express';
import cors from 'cors';
import testRoutes from './routes/test.js';

const app = express();
app.use(cors());
app.use(express.json());


// Test routes
app.use('/api/test', testRoutes);

// Health check route
app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});


app.listen(3000, '0.0.0.0', () => {
    console.log("Server running on port 3000");
});