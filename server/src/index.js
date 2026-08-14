require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connect = require('./db');
const surveyRoutes = require('./survey.routes');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'https://designops-maturity.de',
  'https://www.designops-maturity.de',
  'https://designops-maturity.com',
  'https://www.designops-maturity.com',
  'https://designops-consulting.de',
  'https://www.designops-consulting.de',
  'https://designops.at',
  'https://www.designops.at',
];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Survey creation and read operations are intentionally public. Destructive
// operations enforce their own authorization inside the router.
app.use('/api/v1/survey', surveyRoutes);

connect().then(() => {
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
});
