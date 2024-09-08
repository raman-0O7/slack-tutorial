"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sidebar } from "./_components/sidebar";
import { Toolbar } from "./_components/toolbar";
import { WorkspaceSidebar } from "./_components/workspace-sidebar";

interface Props {
  children: React.ReactNode
}
const WorkspaceIdLayout = ({ children }: Props) => {
  return ( 
    <div className="h-full">
      <Toolbar />
      <div className="flex h-[calc(100vh-40px)]">
        <Sidebar />
        <ResizablePanelGroup 
          direction="horizontal"
          autoSaveId="workspace-sidebar"
        >
          <ResizablePanel
            defaultSize={20}
            minSize={11}
            className="bg-[#5E2C5F]"
          >
            <WorkspaceSidebar />
          </ResizablePanel>
          <ResizableHandle withHandle/>
          <ResizablePanel
            minSize={20}
          >
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default WorkspaceIdLayout;