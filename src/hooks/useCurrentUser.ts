"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export function useCurrentUser() {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const user = useQuery(api.users.queries.getMe, session ? {} : "skip");

  const isLoading = sessionPending || (!!session && user === undefined);

  return {
    session: session ?? null,
    user: user ?? null,
    isLoading,
    isAuthenticated: !!session && !!user && !user.is_banned,
  };
}
