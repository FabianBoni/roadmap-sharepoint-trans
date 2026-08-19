import 'dotenv/config';
import { ensureKerberosTicket } from '../utils/kerberosTicket';
import { getPrimaryCredentials } from '../utils/userCredentials';

void (async () => {
  if (process.platform !== 'linux') {
    throw new Error('The production Kerberos ticket smoke test must run on Linux.');
  }

  const credentials = getPrimaryCredentials();
  if (!credentials) throw new Error('Kerberos service credentials are missing.');

  await ensureKerberosTicket({
    username: credentials.username,
    password: credentials.password,
    realmHint: process.env.SP_KERBEROS_REALM || process.env.SP_ONPREM_DOMAIN,
    force: true,
  });

  // Do not print the principal, credential-cache path, or any secret-derived value.
  // eslint-disable-next-line no-console
  console.log('Kerberos service ticket acquired successfully.');
})().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Kerberos ticket verification failed.');
  process.exitCode = 1;
});
