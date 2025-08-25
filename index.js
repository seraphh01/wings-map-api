
const express = require('express');
const cors = require('cors');
const app = express();
const { authenticateToken } = require('./middleware/auth');
const PORT = process.env.PORT || 3001;
require('dotenv').config();




app.use(cors());
app.use(express.json());
// Serve uploaded images
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use(authenticateToken);

app.get('/', (req, res) => {
  res.send('Welcome to the WINGSMAG backend API!');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/analytics', require('./routes/analytics'));

// Local server for development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// AWS Lambda handler
const serverlessExpress = require('@vendia/serverless-express');
exports.handler = serverlessExpress({ app });
module.exports = app;
