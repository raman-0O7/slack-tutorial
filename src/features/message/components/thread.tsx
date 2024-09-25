import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel"
import { AlertTriangle, Loader, XIcon } from "lucide-react";
import { useGetMessage } from "../api/use-get-message";
import { Message } from "@/components/message";
import { useState } from "react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/member/api/use-current-member";

interface ThreadProps {
  messageId: Id<"messages">;
  onClose: () => void;
}
export const Thread = ({ messageId, onClose }: ThreadProps ) => {
  const workspaceId = useWorkspaceId();
  const {data: currentMember} = useCurrentMember({ workspaceId });
  const [edittingId, setEdittingId] = useState<Id<"messages"> | null>(null);
  const { data: message, isLoading: loadingMessage } = useGetMessage({ id: messageId});

  if(loadingMessage) {
    return (<div className="h-full flex flex-col ">
      <div className="flex h-[49px] justify-between items-center px-4 border-b">
        <p className="font-bold text-lg">Thread</p>
        <Button
          variant={"ghost"}
          size="iconSm"
          onClick={onClose}
        >
          <XIcon className="size-5 stroke-[1.5]"/>
        </Button>
      </div>
      <div className="h-full flex items-center justify-center">
        <Loader className="size-5 animate-spin  text-muted-foreground"/>
      </div>
    </div>)
  }

  if(!message) {
    return (<div className="h-full flex flex-col ">
      <div className="flex h-[49px] justify-between items-center px-4 border-b">
        <p className="font-bold text-lg">Thread</p>
        <Button
          variant={"ghost"}
          size="iconSm"
          onClick={onClose}
        >
          <XIcon className="size-5 stroke-[1.5]"/>
        </Button>
      </div>
      <div className="h-full flex flex-col items-center justify-center gap-y-2">
        <AlertTriangle className="size-5 text-muted-foreground"/>
        <p className="text-xs text-muted-foreground">Message not found</p>
      </div>
    </div>)
  }
  return (
    <div className="h-full flex flex-col ">
      <div className="flex h-[49px] justify-between items-center px-4 border-b">
        <p className="font-bold text-lg">Thread</p>
        <Button
          variant={"ghost"}
          size="iconSm"
          onClick={onClose}
        >
          <XIcon className="size-5 stroke-[1.5]"/>
        </Button>
      </div>
      <div>
        <Message 
          hideThreadButton
          body={message.body}
          image={message.image}
          isAuthor={currentMember?._id === message.memberId}
          id={message._id}
          createdAt={message._creationTime}
          updatedAt={message.updatedAt}
          isEditting={edittingId === message._id}
          setEdittingId={setEdittingId}
          memberId={message.memberId}
          authorName={message.user.name}
          authorImage={message.user.image}
          reactions={message.reactions}
        />
      </div>
    </div>
  )
}