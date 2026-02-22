import dotenv from 'dotenv';
import connectdb from './db/index.js';
import app from './app.js';


app.get('/' , (req , res) => {
    res.status(201).send("Hello Am Younis And Am A Full Stack Developer")
})
dotenv.config({
    path : './.env'
});
connectdb()
.then(() => {
    app.listen(process.env.PORT || 3000 , () => {
        console.log(`Server is running at port ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("MongoDb Connection Failed !!!" , err);
});




















// import express from 'express';
// const app = express();
// iifi
// ;( async () => {
//         try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${first_db}`);
//         app.on("error" , (err) => {
//             console.log("Error");
//             throw err;
//         });

//         app.listen(process.env.PORT , () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
        

//         } catch(err) {
//             console.error('Error Occured' , err);
//             throw err;
//         }
//     } )();