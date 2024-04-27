const mongoose = require('mongoose');
const dotenv = require('dotenv');
const scheduler = require('./schedular'); // Adjust the path accordingly
const WebSocketHandler = require('./test'); // Path to WebSocketHandler.js file
const http = require('http');

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
const server = http.createServer( app);
const port =  3001;
 server.listen(port, () => {
  console.log(`App running on port ${port}...`);
    // const webSocketHandler = new WebSocketHandler('demo4.traccar.org', 'SDBGAiEA9VDBxY9YfxfolCFrGFnx9Uq9QqoDohArgrTL0fMevcICIQDTq-H4uyA4f70VHrmzBozOEHekgoLRf7zSFRKuFZXtsHsidSI6MjM2NTcsImUiOiIyMDI1LTA0LTI2VDIzOjAwOjAwLjAwMCswMDowMCJ9');
//     axios.post('https://webhook.site/b90434db-31b7-402a-9439-05a50b9aec47', {
//         message: 'Hi'
//     })
//         .then(response => {
//             console.log('Webhook responded with:', response.data);
//         })
//         .catch(error => {
//             console.error('Error sending request to webhook:', error);
//         });
});


