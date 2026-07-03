import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
