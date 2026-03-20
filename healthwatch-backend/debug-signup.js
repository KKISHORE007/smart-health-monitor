import fs from 'fs';

const signupData = {
  name: "Dr. Browser Test",
  email: `drbrowser_${Date.now()}@example.com`,
  password: "Password123!",
  role: "doctor",
  state: "Tamil Nadu",
  district: "Karur",
  area: "karur",
  hospitalId: "H1773530019934",
  dob: "",
  gender: "Male",
  familyMale: 1,
  familyFemale: 0,
  regularCondition: ""
};

async function testSignup() {
  console.log(`Testing signup...`);
  try {
    const response = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupData)
    });
    const result = await response.json();
    fs.writeFileSync('debug_resp.json', JSON.stringify({ status: response.status, result }, null, 2));
    console.log("Status:", response.status);
    console.log("Response written to debug_resp.json");
  } catch (error) {
    fs.writeFileSync('debug_resp.json', JSON.stringify({ error: error.message, stack: error.stack }, null, 2));
    console.error("Fetch Error:", error);
  }
}

testSignup();
