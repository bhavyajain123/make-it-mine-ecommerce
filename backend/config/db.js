
const mongoose = require("mongoose");
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        throw error;
    }
}

module.exports = connectDB;
