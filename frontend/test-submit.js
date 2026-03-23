const mongoose = require('mongoose');

async function testSubmit() {
  console.log("Connecting to local MongoDB...");
  await mongoose.connect("mongodb://localhost:27017/interview-ai");
  const job = await mongoose.connection.db.collection('jobs').findOne({});
  
  if (!job) {
    console.log("No jobs found in DB!");
    process.exit(1);
  }
  
  const jobId = job._id.toString();
  console.log("Found jobId:", jobId);
  
  const payload = {
    jobId: jobId,
    name: "Test Candidate",
    email: "test@example.com",
    currentCTC: 10,
    expectedCTC: 12,
    resumeUrl: "blob:http://localhost:3000/123",
    parsedResume: { details: "fake" }
  };

  console.log("Submitting application...");
  try {
    const submitRes = await fetch("http://localhost:3000/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const submitText = await submitRes.text();
    console.log("Submit status:", submitRes.status);
    console.log("Submit response:", submitText);
  } catch(e) { console.error(e) }
  process.exit(0);
}

testSubmit();
