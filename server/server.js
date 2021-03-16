const express = require('express');
const morgan = require('morgan');
const bodyparser = require('body-parser');
const cors = require('cors'); 
const connectDB = require('./config/db')

const app = express();

require('dotenv').config({
    path: './config/config.env'
});

// Conect DB
connectDB();


app.use(bodyparser.json());

//config for only development
if(process.env.NODE_ENV === 'development'){
    app.use(cors({
        orgin:process.env.CLENT_URL
    }))

    app.use(morgan('dev'))
    //morgan gets and give information about the each request
    //cors is used for the react
}


//Load all rorutes
const authRouter = require('./routes/auth.route')

//use routes
app.use('/api/',authRouter);

app.use((req, res, next)=>{
    res.status(404).json({
        success:false,
        message: "Page Not Found"
    })
});
const PORT = process.env.PORT;

app.listen(PORT,()=>{
    console.log(`App listening on ${PORT}`);
});