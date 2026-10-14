


const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

app.use(cors({
  origin: [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());



app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users",require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/products", require("./routes/reviewRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/designs", require("./routes/designRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/addresses", require("./routes/addressRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin/orders", require("./routes/adminOrderRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/products", require("./routes/reviewRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.get("/", (req,res)=>{
    res.json({ message:"website api is running"});
});

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

app.use((req,res)=> {
    res.status(404).json({
        message:"route not found",
    });
});


async function startServer(){
    if(!process.env.JWT_SECRET ||  !process.env.MONGO_URI){
        throw new Error("jwt_secret and mongo_url must be configured");

    }
    await connectDB();
    const port = process.env.PORT || 5000;

    app.listen(port,()=>{
        console.log(`server running on port ${port}`);
    });
}

startServer().catch(error=>{
    console.error("server failed:",error.message);
    process.exit(1);
});