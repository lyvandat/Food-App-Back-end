const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect('mongodb+srv://cuongpham:211319539@cluster0.b87mt4q.mongodb.net/Intro2SE-20CLC5-FinalProject-Group2');
        console.log('connect successfully.');
    } catch (error) {
        console.log('connect failure.' + error);
    }
}

module.exports = { connect };
