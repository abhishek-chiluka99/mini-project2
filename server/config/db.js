const mongoose = require('mongoose');

const connectDB = async() => {
    const connection = await mongoose.connect(process.env.MONGO_URL,{
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModif:  false,
        useUnifiedTopology: true
    });
 
    console.log(`MongoDB Connected: ${connection.connection.host}`);
}

module.exports = connectDB;