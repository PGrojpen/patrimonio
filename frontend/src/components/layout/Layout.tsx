import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { DisclaimerBanner } from "./DisclaimerBanner";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <Header />
        <DisclaimerBanner />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        <footer className="border-t px-6 py-3 text-center text-xs text-muted-foreground">
          © 2024 Patrimônio · Educacional · Não é recomendação de investimento
        </footer>
      </div>
    </div>
  );
}
