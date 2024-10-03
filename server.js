const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.NODE_ENV === 'production' 
  ? process.env.MONGO_URL_PROD 
  : process.env.MONGO_URL_DEV;

// Middleware
app.use(cors({
  origin: ['https://sadickyahaya.netlify.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Serve static files from the uploads directory
const uploadPath = process.env.NODE_ENV === 'production'
  ? '/opt/render/project/src/uploads'
  : path.join(__dirname, 'uploads');

app.use('/uploads', express.static(uploadPath));

// Connect to MongoDB
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogPosts', require('./routes/blogPosts'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/newsletter', require('./routes/newsletter'));

// Add this new route for file uploads
app.use('/api/upload', require('./routes/uploadRoutes'));
