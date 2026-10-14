const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.updateProfile = async(req,res)=>{
    try{
        const{name,phone} = req.body;

        if(Object.keys(req.body).some(
            key=> !["name","phone"].includes(key)
        )){
           return res.status(400).json({
    message: "name and phone can be updated",
});
        }

        if(
           name!==undefined&& (typeof name!== "string"  || !name.trim())

        ){
            return res.status(400).json({
                message:"valid number required",
            });
        }
        if (phone!==undefined && (typeof phone !=="string"  || phone.length>20)
        ){
    return res.status(400).json({
        message:"invalid number",
    });
    
        }

        if(name !== undefined){
            req.user.name = name.trim();
        }

        if(phone !== undefined){
            req.user.phone = phone;
        }
        await req.user.save();

       return res.status(200).json({
            message:"profile updated successfully",

            user:{
                id:req.user._id,
                name: req.user.name,
                email:req.user.email,
                phone:req.user.phone,
            },
        });
    }catch(error){
        console.error(error);
        return res.status(500).json({
            message:"server error",
        });
    }
};

exports.changePassword = async(req,res)=>{
    try{
        const{currentPassword, newPassword}= req.body;

        if(
            typeof currentPassword !=="string" ||
            typeof newPassword !== "string" ||
            newPassword.length<8
        ){
            return res.status(400).json({
                message:"password should be of atleast 8 character",

            });
        }

        const user = await User.findById(req.user._id).select("+password");

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if(!passwordMatches){
            return res.status(400).json({
                message:"current pssword is incorrect",
            });
        }

        user.password = await bcrypt.hash(newPassword,12);
        await user.save();

        return res.status(200).json({
            message:"password changed . please login again",

        });
    }
        catch(error){
            console.error(error);
            return res.status(500).json({
                message:"server error",
            });
            
        }
    };
