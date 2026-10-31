import {
  Advisory,
  Incident,
  Notification,
  PestEntry,
  Recommendation,
  UserProfile,
} from "./types";

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

function upsert<T extends { id: string }>(key: string, item: T): T[] {
  const all = read<T>(key);
  const index = all.findIndex((x) => x.id === item.id);
  if (index >= 0) {
    all[index] = item;
  } else {
    all.unshift(item);
  }
  write(key, all);
  return all;
}

function remove<T extends { id: string }>(key: string, id: string): T[] {
  const all = read<T>(key).filter((x) => x.id !== id);
  write(key, all);
  return all;
}

export const localStore = {
  users: {
    getAll: () => read<UserProfile>("agricare_all_users"),
    setAll: (v: UserProfile[]) => write("agricare_all_users", v),
    upsert: (u: UserProfile) => upsert<UserProfile>("agricare_all_users", u),
    remove: (id: string) => remove<UserProfile>("agricare_all_users", id),
  },
  incidents: {
    getAll: () => read<Incident>("agricare_incidents"),
    setAll: (v: Incident[]) => write("agricare_incidents", v),
    upsert: (i: Incident) => upsert<Incident>("agricare_incidents", i),
    remove: (id: string) => remove<Incident>("agricare_incidents", id),
  },
  recommendations: {
    getAll: () => read<Recommendation>("agricare_recommendations"),
    setAll: (v: Recommendation[]) => write("agricare_recommendations", v),
    upsert: (r: Recommendation) =>
      upsert<Recommendation>("agricare_recommendations", r),
    remove: (id: string) => remove<Recommendation>("agricare_recommendations", id),
  },
  advisories: {
    getAll: () => read<Advisory>("agricare_advisories"),
    setAll: (v: Advisory[]) => write("agricare_advisories", v),
    upsert: (a: Advisory) => upsert<Advisory>("agricare_advisories", a),
    remove: (id: string) => remove<Advisory>("agricare_advisories", id),
  },
  pests: {
    getAll: () => read<PestEntry>("agricare_pests"),
    setAll: (v: PestEntry[]) => write("agricare_pests", v),
    upsert: (p: PestEntry) => upsert<PestEntry>("agricare_pests", p),
    remove: (id: string) => remove<PestEntry>("agricare_pests", id),
  },
  notifications: {
    getAll: () => read<Notification>("agricare_notifications"),
    setAll: (v: Notification[]) => write("agricare_notifications", v),
    upsert: (n: Notification) =>
      upsert<Notification>("agricare_notifications", n),
  },
};
