import mongoose from "mongoose";
import { first_db } from "../constants.js";

const connectdb = async () => {
   try {

 const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${first_db}`);

 console.log(`MongoDb Connected !! DB Host ${connectionInstance.connection.host}`);

   } catch(err) {
    console.log("MongoDb Connection error" , err);
    process.exit(1);
   }
};

export default connectdb;