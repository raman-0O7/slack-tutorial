import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function getMember(ctx: QueryCtx, workspaceId: Id<"workspaces">, userId: Id<"users">) {
  return ctx.db.query("members").withIndex("By_workspace_id_user_id", (q) => q.eq("workspaceId", workspaceId).eq("userId", userId)).unique();
}

export const toggle = mutation({
  args: {
    messageId: v.id("messages"),
    value: v.string()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if(!userId) {
      throw new Error("Unauthorized");
    }

    const message = await ctx.db.get(args.messageId);
    if(!message) {
      throw new Error("Message not found");
    }

    const member = await getMember(ctx, message.workspaceId, userId);
    if(!member) {
      throw new Error("Unauthorized");
    }
    const existingReactionWithUserId = await ctx.db.query("reactions")
                                              .filter((q) => 
                                                q.and(
                                                  q.eq(q.field("messageId"), args.messageId),
                                                  q.eq(q.field("memberId"), member._id),
                                                  q.eq(q.field("value"), args.value),
                                                  q.eq(q.field("workspaceId"), message.workspaceId)
                                                )
                                              ).first();
                                      
    if(existingReactionWithUserId) {
      await ctx.db.delete(existingReactionWithUserId._id);
      return existingReactionWithUserId._id;
    } else {
      const reactionId = await ctx.db.insert("reactions", {
        value: args.value,
        memberId: member._id,
        messageId: args.messageId,
        workspaceId: message.workspaceId
      });
      return reactionId;
    }
  },
});