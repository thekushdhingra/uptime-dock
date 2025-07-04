import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/ui/app-sidebar";
import { ChartBar, Home, Link } from "lucide-react";
import HomePage from "./pages/home";
import { Route, Routes } from "react-router";
import URLSPage from "./pages/urls";
import DataPage from "./pages/data";

function App() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const storedDark = localStorage.getItem("dark");
    if (storedDark === null) {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDark(prefersDark);
    } else {
      setIsDark(storedDark === "true");
    }
  }, []);
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("dark", String(isDark));
  }, [isDark]);

  return (
    <SidebarProvider className="flex w-screen min-h-screen">
      <AppSidebar
        sidebarContents={{
          General: [
            {
              icon: <Home />,
              label: "Home",
              url: "/",
            },
            {
              icon: <Link />,
              label: "Urls",
              url: "/urls",
            },
            {
              icon: <ChartBar />,
              label: "Analysis",
              url: "/data",
            },
          ],
        }}
        isDark={isDark}
        setIsDark={setIsDark}
      />
      <main className="flex-1 bg-background text-foreground">
        <div className="p-4">
          <SidebarTrigger className="hover:bg-accent-foreground border-2" />
        </div>
        <div className="px-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/urls" element={<URLSPage />} />
            <Route path="/data" element={<DataPage />} />
          </Routes>
        </div>
      </main>
    </SidebarProvider>
  );
}

export default App;
