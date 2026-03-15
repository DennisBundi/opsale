import WhatsAppWidget from '@/components/whatsapp/WhatsAppWidget';
import CartDrawer from '@/components/cart/CartDrawer';
import CartAnimationProvider from '@/components/cart/CartAnimationProvider';
import Header from '@/components/navigation/Header';
import Footer from '@/components/navigation/Footer';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartAnimationProvider>
      <Header />
      {children}
      <Footer />
      <WhatsAppWidget />
      <CartDrawer />
    </CartAnimationProvider>
  );
}

