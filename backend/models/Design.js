const mongoose = require("mongoose");
const designSchema = new mongoose.Schema(
    {
        user:{
          type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
            index:true,
        },
        name:{
            type:String,
            required:true,
            trim:true,
            maxlength:100,
        },
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product",
            default:null,
        },

        productType:{
            type:String,
            enum:["tshirt","hoodie","mug","phone-case","others"],
            required:true,
        },

        customization:{
            text:{
                type:String,
                default:"",
                maxlength:500
            },
            font:{
                type:String,
                default:"Arial",
                maxlength:50,
            },
            textColor:{
                type:String ,
                default:"#000000"
            },
            backgroundColor:{
                type:String,
                default:"#ffffff"
            },
            imageUrl:{
                type:String,
                default:""
            },
            placement:{
                type:String,
                enum:["front","back","center","other"],
                default:"front",
            },
            options:{
                type:mongoose.Schema.Types.Mixed,
                default:{},
            },
        },

        previewImage:{
            type:String,
            default:"",
        },
    },
    {timestamps:true}
);
module.exports = mongoose.model("Design",designSchema);