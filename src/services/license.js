export const licenseService = {
  status: () => window.api.license.status(),
  activate: (licenseKey) => window.api.license.activate(licenseKey),
};
