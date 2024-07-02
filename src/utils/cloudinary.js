import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloud = async (filePath) =>{
    try{
        const result = await cloudinary.uploader.upload(filePath, {
               resource_type:'auto',
           }
       )
       console.log("File uploaded on Cloudinary.",result.url)
       return result
    }
    catch(error){
        fs.unlinkSync(filePath)
        return null
    }
}

export { uploadOnCloud }
