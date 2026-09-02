export const backupService = {
  create: (passphrase) => window.api.backup.create(passphrase),
  restore: (passphrase) => window.api.backup.restore(passphrase),
  list: () => window.api.backup.list(),
};
