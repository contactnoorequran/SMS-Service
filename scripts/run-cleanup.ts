import 'dotenv/config';
import { cleanupDemoAccounts } from './cleanup-demo-users';

cleanupDemoAccounts()
  .then((res) => {
    console.log('Cleanup finished:', res);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
