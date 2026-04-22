import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { PlanInvite } from "@/lib/api";

export const useInvites = () => {
  const [invites, setInvites] = useState<PlanInvite[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await api.getMyInvites();
      setInvites(res.invites);
    };

    fetch();
  }, []);

  const accept = async (inviteId: string) => {
    await api.acceptInvite(inviteId);
    setInvites(prev => prev.filter(i => i.id !== inviteId));
  };

  return { invites, accept };
};