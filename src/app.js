import express from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';

const app = express();

//mainly use for middle wares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true
}))

// to define max json that can be taken
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

export {app}