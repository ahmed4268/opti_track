const mongoose = require('mongoose');
const dotenv = require('dotenv');
const scheduler = require('./schedular'); // Adjust the path accordingly




dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE;


mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,

  })
  .then(() => console.log('DB connection successful!'));

const port =  3001;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});


