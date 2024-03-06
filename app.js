const express = require('express');
const morgan = require('morgan');

const siteRouter = require('./routes/siteRoutes');
const techRouter = require('./routes/techRoutes');
const vehRouter = require('./routes/vehRoutes');
const operationRouter = require('./routes/OperationRoute');



const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());



// 3) ROUTES
app.use('/api/v1/site', siteRouter);
app.use('/api/v1/tech',techRouter);
app.use('/api/v1/vehicule',vehRouter);
app.use('/api/v1/operation',operationRouter);



module.exports = app;
