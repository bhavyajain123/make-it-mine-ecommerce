exports.uploadDesignImage = (req,res)=>{
    if(!req.file){
        return res.status(400).json({
            message:"please select an image",
        });
    }
    const imageURL= `/uploads/designs/${req.file.filename}`;

    return res.status(201).json({
        message:"image uploaded successfully",
        imageURL,
    });
};