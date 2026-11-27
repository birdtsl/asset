import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthSessionProvider } from "@/components/providers/session-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <AuthSessionProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar permissions={session.user.permissions} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            fullName={session.user.name ?? session.user.username}
            username={session.user.username}
            roles={session.user.roles}
            departmentName={session.user.departmentName}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
