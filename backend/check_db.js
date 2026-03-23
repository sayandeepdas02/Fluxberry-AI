const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const Candidate = require('./models/Candidate').default;
    const count = await Candidate.countDocuments();
    const last = await Candidate.findOne().sort({ createdAt: -1 });
    console.log("Candidate count:", count);
    console.log("Last Candidate:", last);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
