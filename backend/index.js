const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Or handle specific production domains
    }
  },
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-ai')
  .then(() => console.log('Connected to MongoDB via Express Backend'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Interview AI Backend Service is running');
});

// Placeholder for future microservices (e.g. Resume Parsing, heavy computation)
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
