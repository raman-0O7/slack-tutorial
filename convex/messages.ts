import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

async function populateThreads(ctx: QueryCtx, parentMessageId: Id<"messages">) {
  const messages = await ctx.db.query("messages").withIndex("by_parent_message_id", (q) => q.eq("parentMessageId", parentMessageId)).collect();

  if(messages.length === 0) {
    return {
      colut: 0,
      image: undefined,
      timestamp: 0
    }
  }

  const lastMessage = messages[messages.length - 1];
  const lastMember = await populateMember(ctx, lastMessage.memberId);

  if(!lastMember) {
    return {
      count: 0,
      image: undefined,
      timestamp: 0
    }
  }
  const lastUser = await populateUser(ctx, lastMember.userId);

  return {
    count: messages.length,
    image: lastUser?.image,
    timestamp: lastMessage._creationTime
  }
}
function populateUser(ctx: QueryCtx, userId: Id<"users">) {
  return ctx.db.get(userId);
}
function populateMember(ctx: QueryCtx, memberId: Id<"members">) {
  return ctx.db.get(memberId);
}
function popualteReactions(ctx: QueryCtx, messageId: Id<"messages">) {
  return ctx.db.query("reactions").withIndex("by_message_id", (q) => q.eq("messageId", messageId)).collect();
}
function getMember(ctx: QueryCtx, workspaceId: Id<"workspaces">, userId: Id<"users">) {
  return ctx.db.query("members").withIndex("By_workspace_id_user_id", (q) => q.eq("workspaceId", workspaceId).eq("userId", userId)).unique();
}

export const get = query({
  args: {
    channelId: v.optional(v.id("channels")),
    parentMessageId: v.optional(v.id("messages")),
    conversationId: v.optional(v.id("conversations")),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if(!userId) {
      return new Error("Unauthorized");
    }

    let _conversationId = args.conversationId;

    if(!args.conversationId && !args.channelId && args.parentMessageId) {
      const parentMessage = await ctx.db.get(args.parentMessageId);
      if(!parentMessage) {
        return new Error("Parent message not found");
      } 

      _conversationId = parentMessage?.conversationId;
    }

    const results =  await ctx.db.query("messages").withIndex("by_channel_id_parent_message_id_conversation_id", (q) => q.eq("channelId", args.channelId).eq("parentMessageId", args.parentMessageId).eq("conversationId", _conversationId))
              .order("desc")
              .paginate(args.paginationOpts);

    return {
      ...results,
      page: (await Promise.all(
        results.page.map(async (message) => {
          const member = await populateMember(ctx, message.memberId);

          const user = member? await populateUser(ctx, member.userId) : null;
          if(!member || !user) {
            return null;  
          }
          const image = message.image ? await ctx.storage.getUrl(message.image): undefined;
          
          const reactions = await popualteReactions(ctx, message._id);
          const thread = await populateThreads(ctx, message._id);

          const reactionWithCount = reactions.map(reaction => {
            return {
              ...reaction,
              count: reactions.filter(r => r.value === reaction.value).length
            }
          });

          const dedupedReactions = reactionWithCount.reduce((acc, reaction) => {
            const existingReaction = acc.find(r => r.value === reaction.value);
            if(existingReaction) {
              existingReaction.memberIds = Array.from(
                new Set([...existingReaction.memberIds, reaction.memberId])
              )
            } else {
              acc.push({ ...reaction, memberIds: [reaction.memberId] });
            }
            return acc;
          }, [] as (Doc<"reactions"> & {
            count: number;
            memberIds: Id<"members">[]
            })[]
          );

          const reactionsWithoutMemberId = dedupedReactions.map(({ memberId, ...rest}) => rest);

          return {
            ...message,
            image,
            member,
            user,
            reactions: reactionsWithoutMemberId,
            threadCount: thread.count,
            threadImage: thread.image,
            threadTimestamp: thread.timestamp
          }
        })
      )
      ).filter((message): message is NonNullable<typeof message> => message !== null)
    };
  },
});
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
    });
    return messageId;
  }
})
