const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const impls = await mongoose.connection.collection('implementations').find({}).toArray();
    console.log("IMPLEMENTATIONS:");
    console.log(JSON.stringify(impls, null, 2));

    const ideas = await mongoose.connection.collection('ideas').find({ status: "approved_for_implementation" }).toArray();
    console.log("IDEAS APPROVED:");
    console.log(JSON.stringify(ideas, null, 2));

    process.exit(0);
  });
