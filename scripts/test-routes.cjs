const http = require('http');

const routes = [
  '/',
  '/users',
  '/users/usr-admin-01',
  '/users/invalid',
  '/managers',
  '/managers/mgr-001',
  '/managers/invalid',
  '/agents',
  '/agents/ag-101',
  '/agents/invalid',
  '/clients',
  '/clients/cl-001',
  '/clients/invalid',
  '/providers',
  '/providers/prov-001',
  '/providers/invalid',
  '/numbers',
  '/numbers/num-001',
  '/numbers/invalid',
  '/api/health',
  '/unsupported-route'
];

async function checkRoute(path) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: 'localhost',
      port: 3000,
      path: path,
      timeout: 5000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          path,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          bodyLength: body.length,
          isOk: res.statusCode === 200
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        error: err.message,
        isOk: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        error: 'Timeout',
        isOk: false
      });
    });
  });
}

async function run() {
  console.log('Testing Platform Routes on http://localhost:3000...\n');
  let allPass = true;
  for (const r of routes) {
    const res = await checkRoute(r);
    const mark = res.isOk ? '✓ PASS' : '✗ FAIL';
    console.log(`${mark} [${res.statusCode || 'ERR'}] ${r} (${res.bodyLength || 0} bytes)`);
    if (!res.isOk) allPass = false;
  }
  console.log('\nResult:', allPass ? 'ALL ROUTES RETURNED 200 OK' : 'SOME ROUTES FAILED');
  process.exit(allPass ? 0 : 1);
}

run();
