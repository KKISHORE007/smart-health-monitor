const uniqueEmail = `drverify_${Date.now()}@example.com`;
const signupData = {
  name: "Dr. Verify Success",
  email: uniqueEmail,
  password: "Password123!",
  role: "doctor",
  state: "Tamil Nadu",
  district: "Karur",
  area: "Karur",
  hospitalId: "H1773530019934",
  dob: "1980-01-01",
  gender: "Male",
  familyMale: 1,
  familyFemale: 0
};

async function testSignup() {
  console.log(`Sending signup request for ${uniqueEmail}...`);
  try {
    const response = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupData)
    });
    const result = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

testSignup();
