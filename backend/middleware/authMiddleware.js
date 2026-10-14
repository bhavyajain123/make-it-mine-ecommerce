const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function protect(req,res,next){
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                message:"authentication is needed",
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded= jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);


        if(!user){
            return res.status(401).json({
                message:"user no longer exists",
            });
        }

        req.user = user;
        next();
    }catch(error){
        return res.status(401).json({
            mesaage:"invalid token",
        });
    }
}
module.exports = protect;