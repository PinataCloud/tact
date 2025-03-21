import { Context } from "hono";
import { PinataSDK } from "pinata";

export const getPinataClient = async (c: Context) => {
  return new PinataSDK({
    pinataJwt: c.env.PINATA_JWT,
    pinataGateway: c.env.PINATA_GATEWAY_URL,
  });
};
