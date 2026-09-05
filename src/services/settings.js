export const settingsService = {
  get: () => window.api.settings.get(),
  update: (key, value) => window.api.settings.update(key, value),
};
