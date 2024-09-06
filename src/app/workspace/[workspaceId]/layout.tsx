"use client";

import { Sidebar } from "./_components/sidebar";
import { Toolbar } from "./_components/toolbar";

interface Props {
  children: React.ReactNode
}
const WorkspaceIdLayout = ({ children }: Props) => {
  return ( 
    <div className="h-full">
      <Toolbar />
      <div className="flex h-[calc(100vh-40px)]">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}

export default WorkspaceIdLayout;