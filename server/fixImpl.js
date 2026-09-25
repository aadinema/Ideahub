const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = require('./models/User');
    const Implementation = require('./models/Implementation');
    const Idea = require('./models/Idea');

    const neha = await User.findOne({ name: "Neha Patel" });
    const idea = await Idea.findById("6aa7fbc6e0a53da5c99a22f9");

    if (!neha || !idea) {
       console.log("Could not find user or idea");
       process.exit(1);
    }

    const impl = await Implementation.create({
        ideaId: idea._id,
        ownerId: neha._id,
        department: neha.department || idea.department,
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days
        milestones: [],
    });

    console.log("Created implementation record!", impl._id);

    idea.status = "implementation_initiated";
    await idea.save();
    console.log("Updated idea status to implementation_initiated");

    process.exit(0);
  });
