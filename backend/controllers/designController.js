
const mongoose = require("mongoose");
const Design = require("../models/Design");
const isValidId = (id) => mongoose.isValidObjectId(id);

exports.createDesign = async(req,res)=>{
    try{
        const{
            name,
            product,
            productType,
            customization,
            previewImage,
        }=req.body;

         if (!name || !productType){
             return res.status(400).json({
        message: "Design name and product type  required",
      });

         }
         if(product && !isValidId(product)){
            return res.status(400).json({
                message:"invalid product id",
            });
         }

            const design = await Design.create({
          user: req.user._id,
           name,
           product: product || null,
          productType,
          customization: customization || {},
          previewImage: previewImage || "",
    });
    return res.status(201).json({
        message:"design saved successfully",
        design,
    });
    }
   
catch (error) {
    console.error("Get Design Error:", error);

    return res.status(500).json({
        message: "unable to load design",
        error: error.message
    });
}
};

exports.getMyDesigns = async (req, res) =>{
    try{
        const designs = await Design.find({
            user:req.user._id,
        })
        .populate("product", "name price images")
         .sort({ updatedAt: -1 });

         return res.status(200).json({
            count:designs.length,
            designs,
         });
    }
    catch(error){
        return res.status(500).json({
            message:"unable to fetch design",
        });
    }
};


exports.getDesignById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: "invalid design id",
            });
        }

        const design = await Design.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!design) {
            return res.status(404).json({
                message: "design not found",
            });
        }

        return res.status(200).json({ design });
    } catch (error) {
        console.error("Get Design Error:", error);

        return res.status(500).json({
            message: "unable to load design",
        });
    }
};


exports.updateDesign = async (req, res) =>{
      try {
         if (!isValidId(req.params.id)){
             return res.status(400).json({
    message: "Invalid design id",
});
         }
         const design = await Design.findOne({
    _id: req.params.id,
    user: req.user._id,
});
             if (!design){
                return res.status(404).json({
                    message: "Design not found",
                });
             }
                const allowedFields = [
               "name",
                "product",
              "productType",
             "customization",
             "previewImage",
           ];

             for (const field of allowedFields){
                if (Object.prototype.hasOwnProperty.call(req.body, field)){
                     design.set(field, req.body[field]);
                }
             }
             await design.save();
                 return res.status(200).json({
               message: "Design updated successfully",
                design,
           });

      } 
      catch(error){
        return res.status(400).json({
            message:"unable to update design",
        });
      }
};

exports.deleteDesign = async (req, res) => {
      try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ 
        message: "Invalid design ID",
     });
    }
      const design = await Design.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
      if (!design) {
      return res.status(404).json({
        message: "Design not found",
      });
    }
      return res.status(200).json({
      message: "Design deleted successfully",
    });

}
catch (error){
    return res.status(500).json({
        message:"unabl to delete",
    });
   
}
};