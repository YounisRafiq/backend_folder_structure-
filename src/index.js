import dotenv from 'dotenv';

import connectdb from './db/index.js';

dotenv.config({
    path : './env'
});
connectdb();




















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