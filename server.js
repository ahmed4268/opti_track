const mongoose = require('mongoose');
const dotenv = require('dotenv');
const scheduler = require('./schedular'); // Adjust the path accordingly
const WebSocketHandler = require('./test'); // Path to WebSocketHandler.js file

const axios = require('axios'); // Make sure to install axios using npm install axios



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
    // const webSocketHandler = new WebSocketHandler('demo.traccar.org', 'SDBGAiEA2FGiqwpHXnD4RGD8BKRBSaXOVms9-PXh4QH1DaFR9JoCIQDYh0kTUZRAbTlH0FLo-0wjB1_bhuMwOWKID-jW-6tOEHsidSI6NTUwMjYsImUiOiIyMDI1LTAxLTIxVDIzOjAwOjAwLjAwMCswMDowMCJ9');
    // axios.post('https://webhook.site/b90434db-31b7-402a-9439-05a50b9aec47', {
    //     message: 'Hi'
    // })
    //     .then(response => {
    //         console.log('Webhook responded with:', response.data);
    //     })
    //     .catch(error => {
    //         console.error('Error sending request to webhook:', error);
    //     });
});


