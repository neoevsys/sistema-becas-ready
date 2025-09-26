import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Páginas que no necesitan el layout completo
  const noLayoutPages = ['/admin/login'];
  const isAdminPage = location.pathname.startsWith('/admin');
  const hideLayout = noLayoutPages.includes(location.pathname);
  
  // Si es una página sin layout, renderizar solo children
  if (hideLayout) {
    return children;
  }
  
  // Si es página admin (excepto login), no mostrar navbar/footer
  if (isAdminPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }
  
  // Layout normal con navbar y footer
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
