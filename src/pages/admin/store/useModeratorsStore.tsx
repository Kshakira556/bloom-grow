import { useEffect, useState } from "react";
import * as api from "@/lib/api";

export type Moderator = {
  id: string;
  name: string;
  email: string;
  role: string;
  privileges?: string[];
};

let moderatorsStore: Moderator[] = [];
let listeners: Array<(mods: Moderator[]) => void> = [];
let hasLoaded = false;

const notify = () => {
  listeners.forEach((l) => l([...moderatorsStore]));
};

const loadModerators = async () => {
  try {
    const users = await api.getUsers();
    moderatorsStore = users
      .filter((u) => u.role === "mediator" || u.role === "admin")
      .map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        privileges: [],
      }));
    notify();
  } catch {
    // leave store empty on failure
  }
};

export const useModeratorsStore = () => {
  const [moderators, setLocalModerators] = useState(moderatorsStore);

  useEffect(() => {
    const listener = (mods: Moderator[]) => setLocalModerators(mods);
    listeners.push(listener);

    if (!hasLoaded) {
      hasLoaded = true;
      loadModerators();
    }

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const setModerators = (updater: Moderator[] | ((prev: Moderator[]) => Moderator[])) => {
    moderatorsStore =
      typeof updater === "function" ? updater(moderatorsStore) : updater;

    notify();
  };

  return { moderators, setModerators };
};

