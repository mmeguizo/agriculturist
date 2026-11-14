import {
  Advisory,
  Incident,
  InventoryProduct,
  Notification,
  PestEntry,
  Recommendation,
  UserProfile,
} from "./types";
import { INITIAL_INVENTORY_PRODUCTS } from "./inventory-seed";

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
    findByEmail: (email: string) =>
      read<UserProfile>("agricare_all_users").find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      ),
    resetPassword: (email: string, _newPassword?: string) => {
      const users = read<UserProfile>("agricare_all_users");
      const user = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (user) {
        // Record timestamp of password reset
        localStorage.setItem(
          `agricare_pwd_reset_${user.id}`,
          new Date().toISOString()
        );
        return true;
      }
      return false;
    },
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
  inventory: {
    getAll: (): InventoryProduct[] => {
      const stored = read<InventoryProduct>("agricare_inventory");
      if (stored && stored.length > 0) return stored;
      if (typeof window !== "undefined") {
        write("agricare_inventory", INITIAL_INVENTORY_PRODUCTS);
      }
      return INITIAL_INVENTORY_PRODUCTS;
    },
    setAll: (v: InventoryProduct[]) => write("agricare_inventory", v),
    upsert: (p: InventoryProduct) => {
      const all = localStore.inventory.getAll();
      const idx = all.findIndex((x) => x.id === p.id);
      if (idx >= 0) all[idx] = p;
      else all.unshift(p);
      write("agricare_inventory", all);
      return all;
    },
    remove: (id: string) => {
      const all = localStore.inventory.getAll().filter((x) => x.id !== id);
      write("agricare_inventory", all);
      return all;
    },
  },
};
