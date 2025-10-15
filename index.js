import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import adminRoutes from './routes/admin.js'; 

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.use(express.static('fe'));

app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('✅ Database Connected');
});
