import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/Toast";
import { getCurrentUser } from "@/lib/user";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <Sidebar user={user} />
      <div
        className="flex flex-col min-h-screen"
        style={{ marginRight: "var(--sidebar-width)" }}
      >
        <Header user={user} />
        {children}
      </div>
      <Toaster position="bottom-left" />
    </>
  );
}
