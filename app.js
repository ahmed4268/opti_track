const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const siteRouter = require('./routes/siteRoutes');
const techRouter = require('./routes/techRoutes');
const vehRouter = require('./routes/vehRoutes');
const operationRouter = require('./routes/OperationRoute');
const congeRouter = require('./routes/congeRoutes');
const axios = require('axios'); // Make sure to install axios using npm install axios



const app = express();
app.use((req, res, next) => {
  const headersSize = Buffer.byteLength(JSON.stringify(req.headers), 'utf8');
  console.log(`Size of headers: ${headersSize} bytes`);
  next();
});
app.use(cors());
// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());



// 3) ROUTES
app.use('/site', siteRouter);
app.use('/tech',techRouter);
app.use('/vehicule',vehRouter);
app.use('/operation',operationRouter);
app.use('/conge',congeRouter);
// app.get('/get-cookie', async (req, res) => {
//   try {
//     // const response = await axios.get('https://demo.traccar.org/api/session?token=SDBGAiEA2FGiqwpHXnD4RGD8BKRBSaXOVms9-PXh4QH1DaFR9JoCIQDYh0kTUZRAbTlH0FLo-0wjB1_bhuMwOWKID-jW-6tOEHsidSI6NTUwMjYsImUiOiIyMDI1LTAxLTIxVDIzOjAwOjAwLjAwMCswMDowMCJ9');
//     const setCookieHeader = response.headers['set-cookie'][0];
//     res.json({ cookie: setCookieHeader });
//   } catch (error) {
//     console.error('Error during HTTP session: ', error);
//     res.status(500).json({ error: 'Failed to get cookie' });
//   }
// });



module.exports = app;
