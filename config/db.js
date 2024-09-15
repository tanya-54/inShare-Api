require('dotenv').config();
const mongoose = require('mongoose');

function connectDB() {
    // Database connection
    mongoose.connect(process.env.MONGO_CONNECTION_URL).then(() => console.log('Database Connected'))
    .catch(err => console.error('Database connection error:', err));


    const connection = mongoose.connection;

    connection.once('open', () => {
        console.log('Database Connected');
    });

    connection.on('error', (err) => {
        console.log('Connection Failed:', err);
    });
}

module.exports = connectDB; 


