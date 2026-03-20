import fetch from 'node-fetch';

async function test() {
  const url = 'https://healthwatch-backend-new.vercel.app/api/portals';
  console.log(`Fetching ${url}...`);
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
