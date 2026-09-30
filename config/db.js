const mongoose = require('mongoose');
const connectDB = async () => {
  const uri = process.env.MONGO_URI || '';
  if (!/^mongodb(\+srv)?:\/\//.test(uri) || /YOUR_|<|>/.test(uri)) {
    throw new Error('Set MONGO_URI in backend/.env to your complete Atlas connection string. Replace the database user, encoded password and cluster hostname.');
  }
  mongoose.set('strictQuery', true);
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`MongoDB connected: ${conn.connection.name}`);
  } catch (error) {
    // Do not print the URI or credentials in deployment logs.
    if (error.code === 18 || /authentication failed|bad auth/i.test(error.message)) {
      throw new Error('Atlas authentication failed. Check your DATABASE user and URL-encode the password.');
    }
    throw new Error('MongoDB connection failed. Check the Atlas cluster hostname, cluster availability, network access list and database credentials.');
  }
};
module.exports = connectDB;
