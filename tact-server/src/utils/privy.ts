import { PrivyClient } from "@privy-io/server-auth";
import { Context } from "hono";

export const getPrivyClient = (c: Context) => {
  return new PrivyClient(c.env.PRIVY_APP_ID, c.env.PRIVY_APP_SECRET);
};
