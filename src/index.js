import dotenv from "dotenv"
import connectdb from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
    path:'./env'
})

connectdb()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Error in app",error);
    })
    app.listen(process.env.PORT || 3000 ,()=>{
        
        console.log(`App running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log(`Databse connection failed. ${ error }`);
})