const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
    try {
      await mongoose.connect(db, {
          // fixes for deprecation warnings
          useNewUrlParser: true,
          useCreateIndex: true,
          useUnifiedTopology: true,
          useFindAndModify: false,
      });

      console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        // exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;