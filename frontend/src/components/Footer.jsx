const Footer = () => {
  return (
    <footer className="bg-secondary-50 border-t border-secondary-200 mt-auto">
      <div className="container-app py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo y descripción */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">B</span>
              </div>
              <span className="text-lg font-semibold text-secondary-900">
                Sistema de Becas
              </span>
            </div>
            <p className="text-secondary-600 text-sm">
              Plataforma de gestión de becas universitarias que conecta estudiantes 
              con oportunidades de financiamiento educativo.
            </p>
          </div>

          {/* Enlaces útiles */}
          <div>
            <h3 className="font-semibold text-secondary-900 mb-4">Enlaces</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-secondary-600 hover:text-primary-600 transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/scholarships" className="text-secondary-600 hover:text-primary-600 transition-colors">
                  Becas Disponibles
                </a>
              </li>
              <li>
                <a href="/admin" className="text-secondary-600 hover:text-primary-600 transition-colors">
                  Administración
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-secondary-900 mb-4">Contacto</h3>
            <div className="space-y-2 text-sm text-secondary-600">
              <p>Email: becas@universidad.edu.co</p>
              <p>Teléfono: +57 (1) 234 5678</p>
              <p>Horario: Lun - Vie 8:00 AM - 5:00 PM</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-secondary-200 mt-8 pt-8 text-center">
          <p className="text-secondary-500 text-sm">
            © {new Date().getFullYear()} Sistema de Becas. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
