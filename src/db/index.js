import {DB_NAME} from "../constants.js";
import mongoose from "mongoose";

const connectdb = async ()=>{
    try{
       const dbInstance=  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`\nDatabase connented. \nInstance: ${dbInstance.connection.host}`)
    }
    catch(error){
        console.log("Cannot connect to database.",error);
        process.exit(1)
    }
}
export default connectdb 