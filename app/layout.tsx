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
  title: "Site Log — Construction Administration Tracker",
  description:
    "Track RFIs, Submittals, and Change Orders on a construction project.",
};

// Data is fetched fresh on every request (single-project MVP, no caching yet).
export const dynamic = "force-dynamic";

async function fetchProject(): Promise<Project | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await getSupabase()
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return (data as Project | null) ?? null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const project = await fetchProject();
  return (
    <html lang="en">
      <body
        className={`${oswald.variable} ${plexSans.variable} ${plexMono.variable}`}
      >
        <div className="flex min-h-screen">
          <Sidebar project={project} />
          <main className="max-w-[1360px] flex-1 px-[30px] pb-10 pt-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
