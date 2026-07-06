import { redirectLegacyRoute } from "../redirect-helper";

export const dynamic = "force-dynamic";

export default async function LegacyRedirect() {
  await redirectLegacyRoute("/rfis");
}
