import { v } from "convex/values";
import { mutation, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

function getMember(ctx: QueryCtx, workspaceId: Id<"workspaces">, userId: Id<"users">) {
  return ctx.db.query("members").withIndex("By_workspace_id_user_id", (q) => q.eq("workspaceId", workspaceId).eq("userId", userId)).unique();
}
export const create = mutation({
  args: {
    body: v.string(),
    workspaceId: v.id("workspaces"),
    image: v.optional(v.id("_storage")),
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    parentMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if(!userId) {
      return new Error("Unauthorized");
    }
    const member = await getMember(ctx, args.workspaceId, userId);

    if(!member) {
      return new Error("Unauthorized");
    }
    
    let _conversationId = args.conversationId;
    // Only when we are relying a thread in 1:1 conversation
    if(!args.conversationId && !args.channelId && args.parentMessageId) {
      const parentMessage = await ctx.db.get(args.parentMessageId);
      if(!parentMessage) {
        throw new Error("Parent message not found");
      }
      _conversationId = parentMessage?.conversationId;
    }
    const messageId = await ctx.db.insert("messages", {
      body: args.body,
      image: args.image,
      memberId: member._id,
      workspaceId: args.workspaceId,
      channelId: args.channelId,
      parentMessageId: args.parentMessageId,
      conversationId: _conversationId,
      updatedAt: Date.now()
    });
    return messageId;
  }
})
