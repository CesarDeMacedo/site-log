import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Oswald } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "RFI Log — Construction Administration Tracker",
  description: "Track RFIs across construction projects.",
};

// Data is fetched fresh on every request (no caching yet).
export const dynamic = "force-dynamic";

async function fetchProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await getSupabase()
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true })
      .returns<Project[]>();
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const projects = await fetchProjects();
  return (
    <html lang="en">
      <body
        className={`${oswald.variable} ${plexSans.variable} ${plexMono.variable}`}
      >
        <div className="flex min-h-screen">
          <Sidebar projects={projects} />
          <main className="max-w-[1360px] flex-1 px-[30px] pb-10 pt-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
