import fetch from 'node-fetch';

async function testLogin(role, payload) {
  const url = 'https://healthwatch-backend-new.vercel.app/api/auth/login';
  console.log(`Testing login for ${role}...`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`✅ ${role} login successful! Token: ${data.token.substring(0, 20)}...`);
    return data.token;
  } else {
    console.log(`❌ ${role} login failed: ${JSON.stringify(data)}`);
    return null;
  }
}

async function runTests() {
  // 1. Super Admin
  const saToken = await testLogin('Super Admin', {
    role: 'superadmin',
    id: 'SA-INDIA-2024',
    password: 'india@healthwatch'
  });

  // 2. Health Minister (AP)
  const hmToken = await testLogin('Health Minister', {
    role: 'minister',
    id: 'HM-AP-001',
    password: 'ap@health2024'
  });

  // 3. Signup a Patient
  console.log('Testing Patient Signup...');
  // Note: Signup requires the portal to be unlocked. 
  // Let's unlock AP portal first using HM token.
  if (hmToken) {
    console.log('Unlocking AP Portal...');
    const unlockRes = await fetch('https://healthwatch-backend-new.vercel.app/api/portals', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hmToken}`
      },
      body: JSON.stringify({ state: 'Andhra Pradesh', unlock: true }),
    });
    if (unlockRes.ok) {
      console.log('✅ AP Portal unlocked!');
      
      // Now Signup
      const signupPayload = {
        name: 'Test Patient',
        email: 'test_patient@example.com',
        password: 'password123',
        role: 'patient',
        state: 'Andhra Pradesh',
        district: 'Guntur'
      };
      const signupRes = await fetch('https://healthwatch-backend-new.vercel.app/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupPayload),
      });
      const signupData = await signupRes.json();
      if (signupRes.ok) {
        console.log('✅ Patient signup successful!');
        
        // Test Patient Login
        await testLogin('Patient', {
          email: 'test_patient@example.com',
          password: 'password123'
        });
      } else {
        console.log(`❌ Patient signup failed: ${JSON.stringify(signupData)}`);
      }
    } else {
      console.log('❌ Failed to unlock portal');
    }
  }
}

runTests();
