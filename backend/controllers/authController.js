const User= require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { firebaseAuth } = require("../config/firebase");



function createToken(userId){
    return jwt.sign(
        {userId},
      process.env.JWT_SECRET,
        {expiresIn :"1d"}
    );
}

exports.register = async(req,res)=>{
    try{
        const{ name,email,password,phone}=req.body;

        if(
            typeof name !== "string" || 
            !name.trim() ||
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            typeof password !=="string" ||
            password.length <8
        ){
            return res.status(400).json({
                message:"email name and password should be valid",
            })
        }

        if (
    phone !== undefined &&
    phone !== null &&
    (typeof phone !== "string" || phone.length > 11)
) {
    return res.status(400).json({
        message: "invalid phone number",
    });
}
        const normalizedEmail = email.trim().toLocaleLowerCase();
        const existinguser = await User.findOne({
            email:normalizedEmail,
        });
        if(existinguser){
            return res.status(409).json({
                message:"email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password,12);

        const user = await User.create({
            name:name.trim(),
            email:normalizedEmail,
            password:hashedPassword,
            phone : phone||"",
        });

        const token = createToken(user._id.toString())

        return res.status(201).json({
            message:"registeration done successfully",
            token,
            user:{

                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
            },
        });
    } 
    catch(error){
        if(error.code==11000){
            return res.status(409).json({
                message:"email already registered",
            });
        }

        console.error(error);
        return res.status(505).json({
            message:"server error",
        });
    }
};


exports.login = async(req,res)=>{
    try{
        const{email,password} = req.body;

        if(
            typeof email !== "string" ||
            typeof password !== "string"
        ){
            return res.status(400).json({
                message:"email and password are required",

            });
        }

        const user = await User.findOne({
            email: email.trim().toLocaleLowerCase(),
        }).select("+password");

        if(!user || !(await bcrypt.compare(password, user.password))){
            return res.status(401).json({
                message:"email or password is invalid",
            });
        }

        const token = createToken(user._id.toString());
        return res.status(200).json({
            message:"login successful",
            token,
            user:{
                id: user._id,
                name: user.name,
                email:user.email,
                phone:user.phone,
            },
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            message :"server error",
        });
    }
};

exports.logout = async(req,res)=>{
    return res.status(200).json({
        message:"logout successful",
    });
};

exports.firebaseLogin = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Firebase token is required",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await firebaseAuth.verifyIdToken(idToken);

    if (!decoded.email) {
      return res.status(400).json({
        message: "Firebase account must have an email",
      });
    }

    const email = decoded.email.trim().toLowerCase();

    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // Link an existing account only when Firebase confirms
        // that the email address has been verified.
        if (!decoded.email_verified) {
          return res.status(409).json({
            message:
              "An account with this email already exists. Verify your email or sign in using your existing account.",
          });
        }

        user.firebaseUid = decoded.uid;

        if (decoded.name && !user.name) {
          user.name = decoded.name;
        }

        await user.save();
      } else {
        user = await User.create({
          firebaseUid: decoded.uid,
          name: decoded.name || email.split("@")[0],
          email,
          phone: decoded.phone_number || "",
          role: "user",
        });
      }
    }

    // Preserve compatibility with existing protected API routes.
    const token = createToken(user._id.toString());

    return res.status(200).json({
      message: "Firebase login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Firebase login error:", error.message);

    return res.status(401).json({
      message: "Firebase authentication failed",
    });
  }
};