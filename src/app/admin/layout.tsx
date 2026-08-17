import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 print:block print:h-auto print:overflow-visible">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">{children}</main>
    </div>
  );
}
