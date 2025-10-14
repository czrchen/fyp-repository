import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
        <ChatbotWidget />
      </body>
    </html>
  );
}
