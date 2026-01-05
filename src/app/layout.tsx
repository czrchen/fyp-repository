import "./globals.css";
import AppProviders from "@/providers/AppProviders"; //  import the client wrapper

export const metadata = {
  title: "ShopHub",
  description: "AI-driven e-commerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
