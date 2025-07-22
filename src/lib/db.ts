import mongoose, { Mongoose } from "mongoose";

interface ConnectionType {
  isConnected?: number;
}

const connection: ConnectionType = {};

const connectDB = async (): Promise<void> => {
  try {
    if (connection.isConnected) {
      console.log("DB is already connected");
      return;
    }

    const db: Mongoose = await mongoose.connect(
      process.env.MONGODB_URI as string
    );
    connection.isConnected = db.connection.readyState;

    if (connection.isConnected) {
      console.log("DB is connected");
    }
  } catch (error) {
    console.error(error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Error connecting to the database"
    );
  }
};


export default connectDB;