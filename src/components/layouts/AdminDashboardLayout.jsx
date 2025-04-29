import Footer from '@/components/Footer';
export function AdminDashboardLayout({ children }) {
    return (<div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex">
          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>);
}
