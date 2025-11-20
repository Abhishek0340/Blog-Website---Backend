const mongoose = require("mongoose");

const feedbackSchema = mongoose.Schema({
    name : {type : String, required : true},
    email : {type : String, required : true},
    message : {type : String, required : true},
    date : {type : Date, default : Date.now }
})

module.exports = mongoose.model('feedback', feedbackSchema)