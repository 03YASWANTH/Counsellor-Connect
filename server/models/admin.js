const mongoose = require("mongoose");
const AdminSchema = new mongoose.Schema({
    name: 
    {
       type: String,
       required: true
    },
    email:
    {
        type:String,
        unique:true,
        required:true
    },
    password:
    {
        type:String,
        required:true
    }
})
const Admin = new mongoose.model('Admin',AdminSchema)
module.exports = {Admin,}