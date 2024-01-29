import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';         //to perform relate to files

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//transfering file from local to server
const uploadOnCloudinary = async (localFilePath) => {
    try {
        //uploading file via cloudinary
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("File uploded successfuly ", response.url)
        console.log(response);
        fs.unlinkSync(localFilePath) 
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)            //remove locally saved temporary file as upload operation got failed 
        return null;
    }
}

export { 
    uploadOnCloudinary 
}