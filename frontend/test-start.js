const mongoose = require('mongoose');

async function testStart() {
  console.log("Connecting to local MongoDB...");
  await mongoose.connect("mongodb://localhost:27017/interview-ai");
  const job = await mongoose.connection.db.collection('jobs').findOne({});
  const candidate = await mongoose.connection.db.collection('candidates').findOne({});
  
  if (!job || !candidate) {
    console.log("Missing job or candidate!");
    process.exit(1);
  }
  
  const jobId = job._id.toString();
  const candidateId = candidate._id.toString();
  console.log("Found jobId:", jobId, "candidateId:", candidateId);
  
  console.log(`Starting test for job ${jobId}...`);
  try {
    const res = await fetch(`http://localhost:3000/api/test/${jobId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId })
    });
    
    const text = await res.text();
    console.log("Start test status:", res.status);
    console.log("Start test response:", text);
  } catch(e) { console.error(e) }
  process.exit(0);
}

testStart();
