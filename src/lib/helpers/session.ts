import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ponytail: cache() deduplicates across layout + page in the same request
export const getServerSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
