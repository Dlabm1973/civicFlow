import { env } from "cloudflare:workers";

export function requireStaff(request: Request) {
  const userId = request.headers.get("oai-authenticated-user-id");
  if (!userId && env.ENVIRONMENT === "development") return "local-sandbox-user";
  if (!userId) {
    throw new Response("Staff sign-in required", { status: 401 });
  }
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  const staff = (env.STAFF_USER_EMAILS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!email || !staff.includes(email)) {
    throw new Response("Staff access has not been granted to this account", { status: 403 });
  }
  return userId;
}
