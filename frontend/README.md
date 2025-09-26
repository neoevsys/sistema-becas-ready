# Sistema de Becas - Frontend

Sistema web para gestión de becas educativas desarrollado con React, Vite, Tailwind CSS y React Query.

## 🚀 Stack Tecnológico

- **React 18** - Framework frontend
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework CSS utilitario
- **React Query (TanStack)** - Estado del servidor y cache
- **React Router** - Navegación SPA
- **Formik + Yup** - Formularios y validación
- **Axios** - Cliente HTTP
- **React Toastify** - Notificaciones

## 📦 Instalación y Configuración

### Prerequisitos
- Node.js 18+ 
- npm 8+

### Variables de Entorno

#### Desarrollo (.env)
```bash
VITE_API_URL=http://localhost:5000/api
```

#### Producción (.env.production)
```bash
VITE_API_URL=https://TU-DOMINIO/api
```

### Instalación Local
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Docker
```bash
# Con docker-compose (frontend + backend + mongo)
docker compose up --build

# Solo frontend
cd frontend
docker build -t becas-frontend .
docker run -p 3000:3000 becas-frontend
```

## 🔧 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo en http://localhost:3002 |
| `npm run build` | Construye la aplicación para producción |
| `npm run preview` | Previsualiza el build de producción localmente |
| `npm run lint` | Ejecuta ESLint |

## 📋 QA Checklist - Lista de Verificación

### ✅ Configuración y Entorno
- [x] Variables de entorno configuradas (VITE_API_URL en dev/prod)
- [x] Build finaliza sin warnings críticos (`npm run build`)
- [x] Preview local funciona correctamente (`npm run preview`)
- [x] Docker compose levanta correctamente con backend

### ✅ Funcionalidades Públicas
- [x] **Landing Page**: Lista becas con filtros de búsqueda y featured
- [x] **Búsqueda**: Filtro por texto (q) funciona correctamente
- [x] **Paginación**: Navegación anterior/siguiente operativa
- [x] **Detalle de Beca**: Muestra información completa
- [x] **CTA Condicional**: "Postular ahora" solo visible según fechas (openAt ≤ now ≤ closeAt)
- [x] **Estados de Beca**: "Abre pronto" / "Abierta" / "Cerrada" con colores apropiados
- [x] **Navegación**: Links /scholarships/:slug funcionan correctamente

### ✅ Sistema de Autenticación
- [x] **Login Admin**: Formulario Formik + Yup con validaciones
- [x] **Token Storage**: accessToken guardado en localStorage (admin_token)
- [x] **Auto-login**: Redirección automática si ya está autenticado
- [x] **Logout**: Limpia localStorage y redirige a /admin/login
- [x] **Navbar Reactivo**: Muestra email y botón logout cuando hay sesión
- [x] **Rutas Protegidas**: ProtectedRoute funciona correctamente

### ✅ Panel de Administración
- [x] **CRUD Becas**: Crear, leer, actualizar funcionan
- [x] **Formulario Completo**: Todos los campos implementados (title, status, fechas, etc.)
- [x] **Validaciones de Fechas**: closeAt > openAt, examAt > closeAt, resultsAt > examAt
- [x] **Acciones Rápidas**: Publicar, Cerrar, Archivar operativos
- [x] **Estados Visuales**: Draft (gris), Published (verde), Closed (rojo), Archived (amarillo)
- [x] **Filtros Admin**: Búsqueda por texto y estado
- [x] **Arrays Dinámicos**: Beneficios, requisitos, documentos, niveles elegibles

### ✅ Formulario de Postulación
- [x] **Validaciones**: Todos los campos requeridos con Yup
- [x] **Subida de Documentos**: FileInput component implementado
- [x] **Envío**: POST /api/applications funciona
- [x] **Manejo 409**: Conflictos (ya postulado) con toast error
- [x] **Estados UI**: Loading, success, error apropiados

### ✅ Gestión de Postulaciones (Admin)
- [x] **Listado**: Filtros por estado y búsqueda
- [x] **Detalle**: Vista completa de postulación
- [x] **Cambio Estado**: Aprobar/rechazar/pendiente
- [x] **Export CSV**: Descarga de postulaciones
- [x] **Paginación**: Navegación entre páginas

### ✅ Manejo de Errores
- [x] **401 Unauthorized**: Redirige automáticamente a login y limpia token
- [x] **Interceptores**: Request (añade token) y response (maneja 401) configurados
- [x] **Toast Notifications**: Éxito (verde) y error (rojo) apropiados
- [x] **Estados Error**: Loading, retry, empty states implementados
- [x] **Validación Frontend**: Feedback en tiempo real con Formik

### ✅ Responsive Design
- [x] **Mobile (< 768px)**: Layout apilado, navegación touch-friendly
- [x] **Tablet (768px - 1024px)**: Grid 2 columnas, sidebar colapsable
- [x] **Desktop (> 1024px)**: Grid 3 columnas, sidebar fijo
- [x] **Formularios**: Inputs y botones apropiados para cada dispositivo
- [x] **Tablas**: Scroll horizontal en móviles
- [x] **CTA Fijo**: Botones principales siempre accesibles en móvil

### ✅ Performance y UX
- [x] **React Query**: Cache de 5 minutos, stale time apropiado
- [x] **Loading States**: Skeleton/spinner en toda la aplicación
- [x] **Optimistic Updates**: UI reactiva en mutations
- [x] **Lazy Loading**: Componentes y rutas optimizados
- [x] **Error Boundaries**: Manejo global de errores React

### ✅ SEO y Accesibilidad
- [x] **Meta Tags**: Título, descripción, favicon configurados
- [x] **Labels**: Formularios con labels apropiadas
- [x] **Alt Text**: Imágenes con texto alternativo
- [x] **Keyboard Navigation**: Todos los elementos focuseables
- [x] **Color Contrast**: Cumple estándares WCAG

## 📁 Estructura del Proyecto

```
frontend/
├── public/                 # Assets estáticos
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── Layout.jsx    # Layout principal con navbar/footer
│   │   ├── Navbar.jsx    # Navegación con auth state
│   │   ├── Footer.jsx    # Pie de página
│   │   ├── Loader.jsx    # Spinner de carga
│   │   ├── EmptyState.jsx # Estado vacío
│   │   ├── FileInput.jsx # Input de archivos
│   │   ├── ScholarshipCard.jsx # Card de beca
│   │   └── ProtectedRoute.jsx # Protección de rutas
│   ├── hooks/            # Custom hooks
│   │   └── useAuth.jsx   # Hook de autenticación
│   ├── pages/            # Páginas principales
│   │   ├── Landing.jsx          # Página principal
│   │   ├── ScholarshipDetail.jsx # Detalle de beca
│   │   ├── ApplicationForm.jsx   # Formulario postulación
│   │   ├── AdminLogin.jsx        # Login administrador
│   │   ├── AdminDashboard.jsx    # Panel admin
│   │   └── NotFound.jsx         # Error 404
│   ├── routes/           # Configuración de rutas
│   │   └── AppRoutes.jsx # Router principal
│   ├── services/         # Servicios API
│   │   ├── api.js           # Cliente axios configurado
│   │   ├── auth.js          # Servicios autenticación
│   │   ├── scholarships.js  # CRUD becas
│   │   ├── applications.js  # CRUD postulaciones
│   │   └── uploads.js       # Subida de archivos
│   ├── styles/           # Estilos globales
│   │   └── globals.css   # Tailwind + custom CSS
│   ├── App.jsx          # Componente raíz
│   └── main.jsx         # Entry point
├── .env                 # Variables desarrollo
├── .env.production      # Variables producción
├── Dockerfile          # Imagen Docker
├── tailwind.config.js  # Configuración Tailwind
├── vite.config.js      # Configuración Vite
└── package.json        # Dependencias
```

## 🚨 Troubleshooting

### Build Errors
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar variables de entorno
echo $VITE_API_URL
```

### CORS Issues
Verificar que el backend tenga configurado CORS para el dominio del frontend en producción.

### 401 Errors
- Verificar que el token esté en localStorage: `admin_token`
- Comprobar que el backend esté corriendo
- Revisar que las rutas admin tengan el prefijo `/api/admin`

### Docker Issues
```bash
# Rebuild sin cache
docker compose build --no-cache

# Logs de contenedor
docker logs becas-frontend
```

### 404 Errors en Docker (SPA Routing) - SOLUCIONADO ✅
**Problema**: Errores 404 en todas las rutas, incluso en la URL principal `/`
**Causa REAL**: Discrepancia entre carpeta de build de Vite y carpeta que sirve el servidor

**Análisis del Problema:**
```javascript
// vite.config.js (ANTES - INCORRECTO)
build: {
  outDir: 'build'    // ← Vite generaba archivos en /app/build/
}
```

```dockerfile
# Dockerfile
CMD ["serve", "-s", "dist", "-l", "3000"]    // ← serve buscaba en /app/dist/ (vacío)
```

**Resultado**: serve no encontraba `index.html` → 404 en todas las rutas

**Solución Definitiva:**
```javascript
// vite.config.js (AHORA - CORRECTO)
build: {
  outDir: 'dist'     // ← Vite genera archivos en /app/dist/
}
```

```dockerfile
# Dockerfile  
CMD ["serve", "-s", "dist", "-l", "3000"]    // ← serve sirve desde /app/dist/
```

**✅ Ambos usan la misma carpeta → Problema resuelto**

### Otros Problemas de Docker
**Volúmenes de desarrollo**: También removidos del frontend en `docker-compose.yml`
```yaml
frontend:
  build: ./frontend
  ports:
    - "3000:3000"
  # ✅ SIN volúmenes - evita interferencia con build
```

## 🔗 Enlaces Útiles

- **Frontend Local**: http://localhost:3002
- **Backend Local**: http://localhost:5000
- **API Docs**: http://localhost:5000/api/health

## 📝 Notas de Desarrollo

- Utilizar `console.log` solo para debugging, remover en producción
- Seguir convenciones de nombres: camelCase para JS, kebab-case para CSS
- Componentes en PascalCase, archivos en camelCase
- Props opcionales con valores por defecto
- Manejar estados de error en todos los componentes async

## 🏗️ Deploy en Producción

### Variables de Entorno de Producción
1. Copiar `.env.production` y reemplazar `TU-DOMINIO` con el dominio real
2. Configurar CORS en el backend para el dominio de producción
3. Verificar que HTTPS esté configurado correctamente

### Build y Deploy
```bash
# Build optimizado
npm run build

# Test del build localmente
npm run preview

# Deploy con Docker
docker build -t becas-frontend .
docker run -d -p 3000:3000 becas-frontend
```

---

**✅ Proyecto listo para producción**
