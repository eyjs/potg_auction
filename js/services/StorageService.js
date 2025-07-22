export const StorageService = {
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  load(key, defaultValue = []) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return data || defaultValue;
    } catch {
      return defaultValue;
    }
  },

  saveSession(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  loadSession(key, defaultValue = null) {
    try {
      const data = JSON.parse(sessionStorage.getItem(key));
      return data || defaultValue;
    } catch {
      return defaultValue;
    }
  },
};
