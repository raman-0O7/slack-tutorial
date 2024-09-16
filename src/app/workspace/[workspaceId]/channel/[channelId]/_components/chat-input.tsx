import { useCreateMessage } from "@/features/message/api/use-create-message";
import { useChannelId } from "@/hooks/use-channel-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });
interface ChatInputProps {
  placeholder: string;

}

type RequestValueType = {
  workspaceId: Id<"workspaces">;
  channelId: Id<"channels">;
  body: string;
  image?: Id<"_storage">;
}
export const ChatInput = ({ placeholder }: ChatInputProps) => {
  const editorRef = useRef<Quill | null>(null) ;
  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const { mutate: createMessage} = useCreateMessage();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  async function handleSubmit({ body, image }: { body: string; image: File | null }) {
    try {
      setIsPending(true);
      editorRef?.current?.enable(false);
      const values: RequestValueType = {
        workspaceId,
        channelId,
        body,
        image: undefined
      };

      if(image) {
        const url = await generateUploadUrl({}, { throwError: true });
        if(!url) {
          throw new Error("Failed to generate upload url");
        }
        console.log(url)
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image
        });
        
        if(!result.ok) {
          throw new Error("failed to send message");
        }
        const { storageId } = await result.json();

        values.image = storageId;
      }
      createMessage(values, { throwError: true });

    } catch (e) {
      toast.error("Failed to send message");
    } finally {
      setIsPending(false);
      editorRef?.current?.enable(true);

      setEditorKey(prevKey => prevKey + 1); 
    }
  }
  return (
    <div className="px-5 w-full">
      <Editor
        key={editorKey}
        placeholder={placeholder}
        onSubmit={handleSubmit}
        innerRef={editorRef}
        disabled={isPending}
      />
    </div>
  )
}