import { setupExactUsers } from './setup-exact-users';

setupExactUsers()
  .then((users) => {
    console.log(`[Success] Finished setting up ${users.length} exact users.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Error] Setup failed:', err);
    process.exit(1);
  });
