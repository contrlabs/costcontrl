import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({
  path: "/api/estimate",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { projectId, fileId } = body;

    if (!projectId || !fileId) {
      return new Response(
        JSON.stringify({ error: "Missing projectId or fileId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Schedule the estimation action
    await ctx.scheduler.runAfter(0, api.estimation.processEstimate, {
      projectId,
      fileId,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Estimation started" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }),
});

http.route({
  path: "/api/estimate",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
