const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const ideas = await mongoose.connection.collection('ideas').find({}, { projection: { title: 1, status: 1, department: 1 } }).toArray();
    console.log(JSON.stringify(ideas, null, 2));
    process.exit(0);
  });
