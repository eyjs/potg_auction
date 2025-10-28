const safeParse = (v, fallback) => {
  try {
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};

export const ls = {
  get(key, fallback = null) {
    return safeParse(localStorage.getItem(key), fallback);
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  },
};

export const ss = {
  get(key, fallback = null) {
    return safeParse(sessionStorage.getItem(key), fallback);
  },
  set(key, val) {
    sessionStorage.setItem(key, JSON.stringify(val));
  },
  remove(key) {
    sessionStorage.removeItem(key);
  },
  clear() {
    sessionStorage.clear();
  },
};

export function onStorageChange(keys, cb) {
  window.addEventListener('storage', (e) => {
    if (!e.key || !keys.includes(e.key)) return;
    cb(e.key);
  });
}
