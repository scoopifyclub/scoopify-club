import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export { DashboardLayout };
