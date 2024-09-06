"use client";

import { UserButton } from "@/features/auth/components/user-button";
import { useCreateWorkspaceModal } from "@/features/workspace/store/use-create-workspace-modal";
import { useGetWorkspaces } from "@/features/workspace/api/use-get-workspaces";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [open, setOpen] = useCreateWorkspaceModal();
  const router = useRouter();

  const { data, isLoading } =  useGetWorkspaces();

  const workspaceId = useMemo(() => data?.[0]?._id, [data]);

  useEffect(() => {
    if(isLoading) return;

    if(workspaceId) {
      router.replace(`/workspace/${workspaceId}`);
    } else if(!open){
      setOpen(true);
    }
  }, [workspaceId, isLoading, open, setOpen, router])
  return (
    <div>
      <UserButton />
    </div>
  );
}
