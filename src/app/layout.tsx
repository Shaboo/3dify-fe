import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";
export const metadata: Metadata = {
  title: { default: "3dify — Photos into 3D", template: "%s · 3dify" },
  description:
    "Generate 3D models from your photos. Follow jobs and download GLB and USDZ files.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
