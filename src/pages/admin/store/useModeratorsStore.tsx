import { useState, useEffect } from "react";

export type Moderator = {
  id: number;
  name: string;
  email: string;
  role: string;
  privileges?: string[];
};

/**
 * Module-level shared state
 */
let moderatorsStore: Moderator[] = [
  {
    id: 1,
    name: "Sarah Mitchell",
    email: "sarah.mitchell@mediator.com",
    role: "Family Mediator",
    privileges: ["View Messages", "Approve Plans"],
  },
  {
    id: 2,
    name: "John Doe",
    email: "john.doe@mediator.com",
    role: "Moderator",
    privileges: ["View Messages"],
  },
];

let listeners: Array<(mods: Moderator[]) => void> = [];

const notify = () => {
  listeners.forEach((l) => l([...moderatorsStore]));
};

export const useModeratorsStore = () => {
  const [moderators, setLocalModerators] = useState(moderatorsStore);

  useEffect(() => {
    const listener = (mods: Moderator[]) => setLocalModerators(mods);
    listeners.push(listener);

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
