import { useCurrentMember } from "@/features/member/api/use-current-member";
import { useGetWorkspace } from "@/features/workspace/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { AlertTriangle, Loader } from "lucide-react";
import { WorkspaceHeader } from "./workspace-header";


export const WorkspaceSidebar = () => {
  const workspaceId = useWorkspaceId();
  const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });

  if(memberLoading || workspaceLoading) {
    return (
      <div className="h-full flex items-center justify-center flex-col bg-[#5E2C5F] ">
        <Loader className="size-5 animate-spin text-white"/>
      </div>
  )};
  if(!workspace || !member) {
    return (
      <div className="h-full flex items-center justify-center flex-col bg-[#5E2C5F] text-center">
        <AlertTriangle className="size-5 text-white"/>
        <p className="text-sm text-white">
          Workspace not found
        </p>
      </div>
  )};

  return (
    <div className="h-full flex  flex-col bg-[#5E2C5F]">
      <WorkspaceHeader workspace={workspace} isAdmin={member.role === "admin"} />
    </div>
  )
}