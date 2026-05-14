const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
// MongoDB will lazily create the "mindspace" database the moment we insert our first document!
const MONGO_URI = 'mongodb://127.0.0.1:27017/mindspace';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB local instance (MindSpace Database Ready!)'))
  .catch((err) => console.error('❌ Error connecting to MongoDB:', err));

// API Routes
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/focus', require('./routes/focus'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/email', require('./routes/email'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
