import connectDB from "./db/index.js";
import dotenv from 'dotenv';

//to configure dotenv file
dotenv.config({
    path: './env'
});

//db connected
connectDB()
.then(()=>{
    //to make db listen 
    app.on("error", (error)=>{
        console.log("ERR: ",error);
        throw error;
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(` Server is running at port : ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("MONGO db connection failed !!! ",error)
})