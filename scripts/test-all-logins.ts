async function testLogin(username: string) {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password: '11223344',
    }),
  });

  const data = await res.json();
  if (res.ok && data.success) {
    console.log(`[PASS] Login SUCCESS for "${username}": Role = ${data.data?.user?.role?.name}, Token length = ${data.data?.token?.length}`);
  } else {
    console.error(`[FAIL] Login FAILED for "${username}":`, data);
  }
}

async function main() {
  console.log('Testing authentication for all 4 exact users...');
  await testLogin('Abuzar');
  await testLogin('abuzar'); // lowercase test
  await testLogin('Zubair');
  await testLogin('zubair');
  await testLogin('Muddasir');
  await testLogin('muddasir');
  await testLogin('Hamza');
  await testLogin('hamza');
}

main().catch(console.error);
