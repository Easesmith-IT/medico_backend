const mongoose= require('mongoose')

const otpModel=new mongoose.Schema({

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    otp: {
      type: Number,
    },
    otpExpiresAt:{
        type: Date,
    },
  },
  { timestamps: true }
);

const otpSchema=mongoose.model("otpSchema",otpModel)

module.exports=otpSchema