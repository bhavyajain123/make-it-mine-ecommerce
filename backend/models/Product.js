const mongoose = require("mongoose");
const productSchema= new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true,
        },

        description:{
            type:String,
            requires:true,
        },

        price:{
            type:Number,
            required:true,
            min:0,
        },

        category:{
            type:String,
            required:true,
            trim:true,
        },

        images:{
            type:[String],
            default:[],
        },

        stock:{
            type:Number,
            default:0,
            min:0,
        },

        featured:{
            type:Boolean,
            default:false,
        },

        customizable:{
            type:Boolean,
            default:false,
        },

        isActive:{
            type:Boolean,
            default:true,
        },
        sku:{
            type:String,
            unique:true,
            sparse:true,
            trim:true,
        },
    },
    {timestamps:true}
);

module.exports  = mongoose.model("Product",productSchema);