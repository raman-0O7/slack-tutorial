import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    workspaceName: v.string()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if(!userId) {
      return new Error("Unauthorized");
    }
    const joinCode = "123456";
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.workspaceName,
      userId: userId,
      joinId: joinCode
    });

    return workspaceId;
  }
})
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("workspaces").collect()
  }
});

export const getById = query({ 
  args: {
    id: v.id("workspaces")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if(userId == null) return new Error("Unauthorized");
    return await ctx.db.get(args.id)
  }
})