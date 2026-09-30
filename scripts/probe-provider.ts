import net from 'net';

async function testTcpHandshake(host: string, port: number, timeoutMs = 2000): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeoutMs);

    socket.connect(port, host, () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ success: true, latencyMs });
    });

    socket.on('error', (err) => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ success: false, latencyMs, error: err.message });
    });

    socket.on('timeout', () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ success: false, latencyMs, error: 'Connection timed out' });
    });
  });
}

async function main() {
  const host = '95.154.228.78';
  console.log(`Checking connection to provider host ${host}...`);

  // Check which port might be open (e.g. 2775, 80, etc.)
  const candidatePorts = [2775, 80, 443, 8080];
  let activePort: number | null = null;

  for (const p of candidatePorts) {
    const res = await testTcpHandshake(host, p, 1500);
    console.log(`Probe ${host}:${p} -> ${res.success ? 'OPEN' : 'CLOSED (' + res.error + ')'}`);
    if (res.success) {
      activePort = p;
      break;
    }
  }

  console.log('Done probing.');
}

main().catch(console.error);
