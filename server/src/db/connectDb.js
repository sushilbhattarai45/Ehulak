import mongoose from "mongoose";

const connectDb = async () => {

  try {

let MONGO_URL = process.env.MONGO_DB_URI || "development";

console.log("Attempting to connect to MongoDB at:", MONGO_URL);

    if (mongoose.connection.readyState === 0) {
      let connection = await mongoose.connect(MONGO_URL,{
        maxPoolSize: 10,
      });
      console.log("Connected to MongoDB");
      return connection;
    } else {
      console.log("MongoDB already connected");
    }
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
  }
};

export default connectDb;