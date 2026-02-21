import { query } from "../_generated/server";
import { getAppUser } from "./helpers";

/**
 * Récupère le profil de l'utilisateur connecté.
 * Retourne null si non authentifié.
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getAppUser(ctx);
  },
});
