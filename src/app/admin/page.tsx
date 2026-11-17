import type { Metadata } from "next";
import { ContentDashboard } from "@/modules/admin/dashboard";
export const metadata: Metadata = { title: "Contenido | Lisi & Co", robots: { index: false, follow: false } };
export default function AdminPage() { return <ContentDashboard />; }
