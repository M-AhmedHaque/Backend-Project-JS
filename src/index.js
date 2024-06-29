import dotenv from "dotenv"
import connectdb from "./db/index.js"

dotenv.config({
    path:'./env'
})

connectdb()