const Product = require("../models/Product");

exports.getProducts = async(req,res)=>{
    try{
        const{
            category,
            minPrice,
            maxPrice,
            page=1,
            limit=12,
        }=req.query;

        const  filter={isActive:true};

        if(category){
            filter.category=category;
        }

        if(minPrice !==undefined || maxPrice !== undefined){
            filter.price={};

            if(minPrice !== undefined){
                filter.price.$gte = Number(minPrice);
            }

            if(maxPrice !== undefined){
                filter.price.$lte = Number(maxPrice);
            }
            if(
                Object.values(filter.price).some(
                    value => !Number.isFinite(value) || value<0
                )||
                (filter.price.$gte !== undefined &&
                    filter.price.$lte !==undefined &&
                    filter.price.$gte > filter.price.$lte
                )
            ){
                return res.status(400).json({
                    message:"invalid price range",
                });
            }

        }

        const currentPage = Number(page);
        const pageSize = Number(limit);

        if(
            !Number.isInteger(currentPage)||
            !Number.isInteger(pageSize)||
            currentPage <1 ||
            pageSize <1 ||
            pageSize >100
        ){
            return res.status(400).json({
                message :"invalid page",
            });
        }

        const skip =(currentPage -1)* pageSize;

        const[products,total]= await Promise.all([
            Product.find(filter)
            .sort({createdAt :-1})
            .skip(skip)
            .limit(pageSize),

            Product.countDocuments(filter),

        ]);

        res.status(200).json({
            products,
            pagination:{
                total,
                page:currentPage,
                limit: pageSize,
                totalPages:Math.ceil(total/pageSize),
            },
        });

       
    }catch(error){
        console.error(error);
        res.status(500).json({
            message:"failed to fetch",
        });

    }
};

exports.getFeaturedProducts = async(req,res)=>{
    try{
        const products =await Product.find({
            featured:true,
            isActive:true,
        })

        .sort({ createdAt :-1})
        .limit(8);

        res.status(200).json({products});
    }catch(error){
        console.error(error);
        res.status(500).json({
            message:"failed to fetch",
        });
    }
};

exports.searchProducts = async(req,res)=>{
    try{
        const q= req.query.q?.trim();

        if(!q || q.length >100){
            return res.status(400).json({
                message:"enter a search term",
            });
        }

        const products = await Product.find({
            isActive :true,
            name:{$regex : q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options:"i"},
        }).limit(20);

        res.status(200).json({products});

    }catch(error){
        console.error(error);
        res.status(500).json({
            message:"product searched failed",
        });
    }
};

  

exports.getProductById = async (req, res) => {
    try{
        if(!/^[0-9a-fA-F]{24}$/.test(req.params.id)){
            return res.status(400).json({
                message:"invalid product id",
            });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            isActive: true,
        });
        if(!product){
            return res.status(404).json({
                message:"product not found",
            });
        }
        res.status(200).json({product});
    }catch(error){
        console.error(error);
        res.status(500).json({
            message:"failed to fetch product",
        });
    }

};

exports.createProduct = async(req,res)=>{
    try{
        const{

            name,
            description,
            price,
            category,
            images,
            stock,
            featured,
            customizable,
            sku,
        } = req.body;

        if(
            typeof name !== "string" || !name.trim() ||
            typeof description !=="string" || !description.trim()||
            typeof category !== "string" || !category.trim() ||
            typeof price !== "number"|| !Number.isFinite(price) || price<0
        ){
            return res.status(400).json({
                message:"valid number, description, category",

            });
        }
        if(
            stock !== undefined &&
            (!Number.isInteger(stock) || stock<0)
        ){
            return res.status(400).json({
                message:"stock must be non negative",
            });
        }
        if(
            images !== undefined &&
            (!Array.isArray(images) ||
        images.some(image=> typeof image !=="string"))
        ){
            return res.status(400).json({
                message:"images must be array of urls",
            });
        }

        const product = await Product.create({
            name: name.trim(),
            description: description.trim(),
            price,
            category:category.trim(),
            images,
            stock,
            featured,
            customizable,
            sku,
        });

        res.status(201).json({
            message:"product created successfully",
            product,
        });
    }catch(error){
        if(error.code ===11000){
            return res.status(409).json({
                message:"sku already exists",
            });
        }
        console.error(error);
        res.status(500).json({
            message:"failed to create",
        });
    }
};
exports.updateProduct = async (req, res)=>{
    try{
        if(!/^[0-9a-fA-F]{24}$/.test(req.params.id)){
            return res.status(400).json({
                message:"invalid product id",
            });
        }
        const allowedFields =[
            "name",
            "description",
            "price",
            "category",
            "images",
            "stock",
            "featured",
            "customizable",
            "isActive",
            "sku"
        ];

        const updates={};

        for(const key of Object.keys(req.body)){
            if(!allowedFields.includes(key)){
                return res.status(400).json({
                    message:`Field '${key}' cannot be updated`,

                });
            }
            updates[key] = req.body[key]
        }

        if(Object.keys(updates).length === 0){
            return res.status(400).json({
                message:"no valid fields provided",
            });
        }
        if(
            updates.price !==undefined &&
            (typeof updates.price !== "number" ||
                !Number.isFinite(updates.price) ||
                updates.price <0)
        ){
            return res.status(400).json({
                message:"price should be positive",
            });
        }
        if(
            updates.stock !== undefined &&
            (!Number.isInteger(updates.stock) || updates.stock<0)
        ){
            return res.status(400).json({
                message:"stock must be positive",
            });
        }
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {$set :  updates},
            {new:true, runValidators: true}
        );

        if(!product){
            return res.status(404).json({
                message:"product not found",
            });
        }
        res.status(200).json({
            message:"product updatd successfully",
            product,
        });
    }catch(error){
        if(error.code === 11000){
            return res.status(409).json({
                message:"sku already exists",
            });
        }
        console.error(error);
        res.status(500).json({
            message:"failed to update",
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try{
        if(!/^[0-9a-fA-F]{24}$/.test(req.params.id)){
            return res.status(400).json({
                message:"invalid product id",
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {$set: {isActive: false}},
            {new :true}
        );

        if(!product){
            return res.status(404).json({
                message:"product not found",
            });
        } 
        res.status(200).json({
            message:"product deactivated successfully",
        });
        
    }catch (error){
            console.error(error);
            res.status(500).json({
                message:"failed to deactivate product",
            });
        }
    };
