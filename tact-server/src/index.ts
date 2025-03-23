import { Hono } from "hono";
import { Bindings, Variables } from "./types";
import { getPrivyClient } from "./utils/privy";
import { getSupabaseClient } from "./utils/supabase";
import { getPinataClient } from "./utils/pinata";
import { MiddlewareHandler } from "hono/types";

const GROUP_ID = "0195b878-390f-7ab6-85d4-710312d2f33d";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(async (c, next) => {
  const privy = await getPrivyClient(c);
  const token = c.req.header("Auth-Token");

  if (!token) {
    return c.json({ message: "Unauthorited" }, 401);
  }

  try {
    const verification = await privy.verifyAuthToken(token);
    console.log(verification);
    c.set("privyId", verification.userId);
    await next();
  } catch (error) {
    console.log(`Token verification failed with error ${error}.`);
    return c.json({ message: "Unauthorited" }, 401);
  }
});

app.post("/users/register", async (c) => {
  try {
    const privyClient = getPrivyClient(c);

    const user = await privyClient.getUserById(c.get("privyId") || "");

    const wallet = user.wallet?.address || user.farcaster?.ownerAddress;

    const supabase = getSupabaseClient(c);

    const { data, error } = await supabase
      .from("users")
      .upsert({ wallet_address: wallet }, { onConflict: "wallet_address" });

    if (error) {
      throw error;
    }

    return c.json({ data }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
});

app.put("/users/profile", async (c) => {
  try {
    const body = await c.req.json();
    const bodyElements = Object.keys(body);
    const allowedEls = [
      "full_name",
      "city",
      "state",
      "country",
      "dob",
      "picture",
      "gender",
      "wallet",
    ];

    bodyElements.forEach((el: string) => {
      console.log(el);
      if (!allowedEls.includes(el)) {
        return c.json({ message: "Invalid profile property provided" }, 400);
      }

      if (el === "dob") {
        body[el] = new Date(body[el]);
      }
    });

    const privyClient = getPrivyClient(c);
    console.log("We're here...");
    const privyId = c.get("privyId");
    console.log(privyId);
    const user = await privyClient.getUserById(privyId || "");
    console.log(user);
    const wallet = user.wallet?.address || user.farcaster?.ownerAddress;
    console.log({ wallet });
    const supabase = getSupabaseClient(c);

    const { data, error } = await supabase
      .from("users")
      .update(body)
      .eq("wallet_address", wallet)
      .select();

    if (error) {
      throw error;
    }

    return c.json({ data }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
});

app.get("/users/profile", async (c) => {
  try {
    const privyClient = await getPrivyClient(c);
    const user = await privyClient.getUserById(c.get("privyId") || "");
    const wallet = user.wallet?.address || user.farcaster?.ownerAddress;

    const supabase = await getSupabaseClient(c);

    let { data: users, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", wallet);

    if (selectError) {
      throw selectError;
    }

    const userFromDb = users && users[0] ? users[0] : null;

    return c.json({ data: userFromDb }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error " }, 500);
  }
});

app.post("/users/responses", async (c) => {
  try {
    const { responses } = await c.req.json();
    console.log(responses);
    const privyClient = getPrivyClient(c);
    const user = await privyClient.getUserById(c.get("privyId") || "");
    const wallet = user.wallet?.address || user.farcaster?.ownerAddress;

    const supabase = await getSupabaseClient(c);

    let { data: users, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", wallet);

    if (selectError) {
      throw selectError;
    }

    const userFromDb = users && users[0] ? users[0] : null;

    if (!userFromDb) {
      return c.json({ message: "No user found" }, 404);
    }

    const username = userFromDb.username;

    const responseKeys = Object.keys(responses);

    let textString = ``;

    for (const responseKey of responseKeys) {
      try {
        textString += `${responseKey}: ${responses[responseKey] ?? "N/A"}\n`;
      } catch (error) {
        console.log("Error looping through user questions");
        throw error;
      }
    }

    const file = new File([textString], username, {
      type: "text/plain",
    });

    const pinata = await getPinataClient(c);

    const { cid } = await pinata.upload.private
      .file(file)
      .group(GROUP_ID)
      .vectorize();

    const { data, error } = await supabase
      .from("users")
      .update({ response_hash: cid })
      .eq("wallet_address", wallet)
      .select();

    if (error) {
      throw error;
    }

    return c.json({ data }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 200);
  }
});

app.post("/users/pfp", async (c) => {
  try {
    const pinata = await getPinataClient(c);

    const signedURL = await pinata.upload.private.createSignedURL({
      expires: 30,
    });

    return c.json({ data: signedURL }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
});

app.get("/matches", async (c) => {
  try {
    const privyClient = getPrivyClient(c);
    const user = await privyClient.getUserById(c.get("privyId") || "");
    const wallet = user.wallet?.address || user.farcaster?.ownerAddress;

    const supabase = getSupabaseClient(c);

    let { data: users, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", wallet);

    if (selectError) {
      throw selectError;
    }

    const userFromDb = users && users[0] ? users[0] : null;

    if (!userFromDb) {
      return c.json({ message: "No user found" }, 404);
    }

    const pinata = await getPinataClient(c);

    const fileData = await pinata.gateways.private.get(
      userFromDb.response_hash
    );
    const raw = fileData.data;

    console.log(raw);

    const results: any = await pinata.files.private.queryVectors({
      groupId: GROUP_ID,
      query: raw as string,
    });

    const matchResults = [];

    for (const match of results.matches) {
      console.log(match)
      const files: any = await pinata.files.private.list().cid(match.cid);
      console.log(files);
      const file = files.files[0];
      console.log(file);
      match.username = file.name;

      const supabase = getSupabaseClient(c);

      let { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", file.name);

      const user = users && users[0] ? users[0] : null;

      match.picture = user?.picture || "";

      if (error) {
        throw error;
      }

      if (!user) {
        console.log("No user found");
      }
    }

    const matchesToReturn = results.matches.filter((a: any) => a.username !== userFromDb.username)
    return c.json({ data: matchesToReturn }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
});

app.post("/matches/:wallet", async (c) => {
  try {
    const { selectedMatchWallet } = await c.req.json();

    const privyClient = await getPrivyClient(c);
    const user = await privyClient.getUserById(c.get("privyId") || "");
    const userWallet = user.wallet?.address || user.farcaster?.ownerAddress;

    //  Do something zk-ish with this
    return c.json({ data: "Success" }, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Server error" }, 500);
  }
});

export default app;
