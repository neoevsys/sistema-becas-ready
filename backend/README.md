# Sistema de Becas - Backend API

## Descripción

Backend RESTful API para el sistema de gestión de becas, construido con Node.js, Express y MongoDB.

## 🚀 Características

- **Arquitectura limpia** con separación de capas (config, models, middlewares, controllers, routes, utils)
- **Seguridad robusta** con helmet, CORS, rate limiting y sanitización de datos
- **Autenticación JWT** para control de acceso
- **Validaciones** con express-validator
- **Logging** profesional con Winston
- **Manejo de errores** centralizado
- **Healthcheck** endpoint para monitoreo
- **Docker** ready para despliegue
- **Seeding** automático de datos iniciales

## 📋 Requisitos Previos

- Node.js >= 22.0.0
- MongoDB
- Docker (opcional)

## 🛠️ Instalación

### Opción 1: Desarrollo Local

#### Prerequisitos
- Node.js >= 20.0.0
- MongoDB instalado y ejecutándose
- Git

#### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sistema-becas/backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```bash
# Obligatorias
JWT_SECRET=tu_jwt_secret_super_seguro_cambiar_en_produccion
ADMIN_DEFAULT_EMAIL=admin@becas.com
ADMIN_DEFAULT_PASSWORD=Admin123!

# Opcional (tiene valores por defecto)
PORT=5000
MONGO_URI=mongodb://localhost:27017/becasdb
NODE_ENV=development
```

4. **Instalar dependencias de linting**
```bash
# Las dependencias ya están en package.json
npm install
```

5. **Ejecutar linting y formateo**
```bash
npm run lint          # Ejecutar ESLint y corregir automáticamente
npm run format        # Formatear código con Prettier
npm run lint:check    # Solo verificar sin corregir
npm run format:check  # Solo verificar formato sin cambiar
```

6. **Ejecutar seeding (crear admin por defecto)**
```bash
npm run seed
```

7. **Iniciar en modo desarrollo**
```bash
npm run dev     # Con nodemon (recarga automática)
# O
npm start       # Modo producción
```

8. **Verificar que funciona**
```bash
curl http://localhost:5000/health
```

### Opción 2: Con Docker (Recomendado)

#### Prerequisitos
- Docker y Docker Compose instalados
- Puerto 3000, 5000 y 27017 disponibles

#### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sistema-becas
```

2. **Configurar variables de entorno (opcional)**
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend  
cp frontend/.env.example frontend/.env
```

3. **Construir y levantar todos los servicios**
```bash
# Construcción completa y inicio
docker-compose up --build

# En modo detached (background)
docker-compose up --build -d

# Ver logs
docker-compose logs -f backend
```

4. **Verificar que todos los servicios están corriendo**
```bash
docker-compose ps
```

Deberías ver:
```
NAME                IMAGE               STATUS              PORTS
becas-backend       sistema-becas-backend   Up          0.0.0.0:5000->5000/tcp
becas-frontend      sistema-becas-frontend  Up          0.0.0.0:3000->3000/tcp  
becas-mongo         mongo:7.0               Up (healthy) 0.0.0.0:27017->27017/tcp
```

5. **Verificar funcionamiento**
```bash
# Backend API
curl http://localhost:5000/health

# Frontend (abrir navegador)
open http://localhost:3000
```

6. **Ejecutar seeding en contenedor**
```bash
docker-compose exec backend npm run seed
```

#### Comandos Docker Útiles

```bash
# Parar todos los servicios
docker-compose down

# Parar y eliminar volúmenes
docker-compose down -v

# Reconstruir solo backend
docker-compose build backend

# Ejecutar comando en contenedor
docker-compose exec backend npm test
docker-compose exec backend npm run lint

# Ver logs en tiempo real
docker-compose logs -f backend

# Acceder al shell del contenedor
docker-compose exec backend sh
```

### Opción 3: Desarrollo Híbrido

Si prefieres tener la base de datos en Docker pero el backend en local:

```bash
# 1. Solo levantar MongoDB
docker-compose up mongo -d

# 2. En el backend, configurar .env
MONGO_URI=mongodb://localhost:27017/becasdb

# 3. Instalar y ejecutar backend local
cd backend
npm install
npm run dev
```

## ⚙️ Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | `5000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `MONGO_URI` | URI de conexión a MongoDB | `mongodb://mongo:27017/becasdb` |
| `JWT_SECRET` | Secreto para firmar JWT | *(requerido)* |
| `JWT_EXPIRES` | Tiempo de expiración JWT | `7d` |
| `CORS_ORIGINS` | Orígenes permitidos para CORS | `http://localhost:3000,http://localhost:3001` |
| `MAX_UPLOAD_MB` | Tamaño máximo de archivos (MB) | `10` |
| `FILE_STORAGE` | Tipo de almacenamiento de archivos | `local` |
| `ADMIN_DEFAULT_EMAIL` | Email del admin por defecto | *(requerido)* |
| `ADMIN_DEFAULT_PASSWORD` | Contraseña del admin por defecto | *(requerido)* |
| `RATE_LIMIT_WINDOW_MS` | Ventana de tiempo para rate limiting (ms) | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Máximo de requests por ventana | `100` |

## 📚 Scripts NPM

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Ejecutar en modo desarrollo con nodemon |
| `npm start` | Ejecutar en modo producción |
| `npm test` | Ejecutar tests con Jest |
| `npm run test:watch` | Ejecutar tests en modo watch |
| `npm run seed` | Ejecutar seeding de datos iniciales |
| `npm run seed:admin` | Crear admin por defecto |

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuraciones (DB, etc.)
│   ├── controllers/     # Controladores de rutas
│   ├── middlewares/     # Middlewares personalizados
│   ├── models/         # Modelos de Mongoose
│   ├── routes/         # Definición de rutas
│   ├── utils/          # Utilidades (logger, etc.)
│   ├── app.js          # Configuración de Express
│   └── server.js       # Punto de entrada
├── scripts/            # Scripts de utilidad
├── tests/              # Tests
├── .env                # Variables de entorno
├── Dockerfile          # Configuración Docker
└── package.json        # Dependencias y scripts
```

## 🛣️ Endpoints API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión como admin |
| `GET` | `/api/auth/me` | Obtener información del admin autenticado |

### Becas Públicas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/scholarships` | Listar becas con filtros y paginación |
| `GET` | `/api/scholarships/:identifier` | Obtener detalle de beca por slug o ID |

### Postulaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/applications` | Crear nueva postulación a una beca |

### Upload de Archivos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/uploads` | Subir archivos de soporte (PDF, DOC, JPG, PNG) |
| `GET` | `/api/uploads/info` | Obtener información de configuración de uploads |

### Salud del Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Verificar estado del sistema y BD |
| `GET` | `/` | Información básica de la API |

### Ejemplos de Autenticación

#### Login de Admin

```bash
# POST /api/auth/login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@becas.com",
    "password": "Admin123!"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d",
    "admin": {
      "id": "64f8a1234567890abcdef123",
      "email": "admin@becas.com",
      "role": "admin",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

#### Obtener información del admin autenticado

```bash
# GET /api/auth/me
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "64f8a1234567890abcdef123",
      "email": "admin@becas.com",
      "role": "admin",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

#### Uso del Token en otras APIs

Para endpoints protegidos, incluir el token en el header:

```bash
curl -X GET http://localhost:5000/api/protected-endpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Ejemplos de Upload de Archivos y Postulaciones

#### 1. Subir archivos de soporte

```bash
# POST /api/uploads - Subir múltiples archivos
curl -X POST http://localhost:5000/api/uploads \
  -F "files=@cv.pdf" \
  -F "files=@certificate.jpg" \
  -F "files=@transcript.pdf" \
  -F "kind=academic_docs"
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "3 archivo(s) subido(s) exitosamente",
  "data": {
    "files": [
      {
        "kind": "academic_docs",
        "filename": "cv-1704067200000-a1b2c3d4.pdf",
        "originalname": "cv.pdf",
        "mimetype": "application/pdf",
        "sizeBytes": 1024000,
        "urlOrPath": "/uploads/cv-1704067200000-a1b2c3d4.pdf"
      },
      {
        "kind": "academic_docs", 
        "filename": "certificate-1704067201000-e5f6g7h8.jpg",
        "originalname": "certificate.jpg",
        "mimetype": "image/jpeg",
        "sizeBytes": 512000,
        "urlOrPath": "/uploads/certificate-1704067201000-e5f6g7h8.jpg"
      },
      {
        "kind": "academic_docs",
        "filename": "transcript-1704067202000-i9j0k1l2.pdf", 
        "originalname": "transcript.pdf",
        "mimetype": "application/pdf",
        "sizeBytes": 2048000,
        "urlOrPath": "/uploads/transcript-1704067202000-i9j0k1l2.pdf"
      }
    ],
    "uploadedAt": "2024-01-01T12:00:00.000Z",
    "storageInfo": {
      "storageType": "local",
      "maxSizeMB": 10,
      "maxFiles": 10
    }
  }
}
```

#### 2. Crear postulación con archivos subidos

```bash
# POST /api/applications - Crear postulación referenciando archivos subidos
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -H "x-utm-source: google" \
  -H "x-utm-campaign: becas2024" \
  -d '{
    "scholarshipId": "64f8a1234567890abcdef123",
    "docType": "cedula",
    "docNumber": "12345678",
    "firstName": "Juan",
    "lastName": "Pérez",
    "nationality": "Colombiano",
    "gender": "masculino",
    "birthDate": "1995-05-15",
    "maritalStatus": "soltero",
    "birthCity": "Bogotá",
    "residenceCity": "Medellín",
    "email": "juan.perez@email.com",
    "phone": "+57 300 123 4567",
    "hasDisability": false,
    "isIndigenous": false,
    "university": "Universidad Nacional de Colombia",
    "universityType": "publica",
    "major": "Ingeniería de Sistemas",
    "academicStatus": "estudiante",
    "level": "pregrado",
    "campusCity": "Medellín",
    "gpa": 4.2,
    "credits": 120,
    "entryYear": 2020,
    "graduationYear": 2024,
    "sourceInfo": "sitio_web_universidad",
    "motivation": "Estoy muy interesado en obtener esta beca porque me permitirá continuar mis estudios sin preocupaciones económicas...",
    "files": [
      {
        "kind": "academic_docs",
        "filename": "cv-1704067200000-a1b2c3d4.pdf", 
        "mimetype": "application/pdf",
        "sizeBytes": 1024000,
        "urlOrPath": "/uploads/cv-1704067200000-a1b2c3d4.pdf"
      },
      {
        "kind": "academic_docs",
        "filename": "certificate-1704067201000-e5f6g7h8.jpg",
        "mimetype": "image/jpeg", 
        "sizeBytes": 512000,
        "urlOrPath": "/uploads/certificate-1704067201000-e5f6g7h8.jpg"
      }
    ],
    "acceptRequirements": "true",
    "commitToProcess": "true",
    "acceptPrivacy": "true"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Postulación creada exitosamente",
  "data": {
    "applicationId": "64f8b9876543210fedcba987",
    "status": "submitted",
    "submittedAt": "2024-01-01T12:05:00.000Z",
    "scholarshipTitle": "Beca de Excelencia Académica"
  }
}
```

#### 3. Flujo completo con JavaScript

```javascript
// 1. Subir archivos
const uploadFiles = async (files, kind = 'academic_docs') => {
  const formData = new FormData();
  
  // Agregar archivos al FormData
  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('kind', kind);
  
  const response = await fetch('/api/uploads', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// 2. Crear postulación con archivos
const createApplication = async (applicationData, uploadedFiles) => {
  const dataWithFiles = {
    ...applicationData,
    files: uploadedFiles.map(file => ({
      kind: file.kind,
      filename: file.filename,
      mimetype: file.mimetype,
      sizeBytes: file.sizeBytes,
      urlOrPath: file.urlOrPath
    }))
  };
  
  const response = await fetch('/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-utm-source': 'website',
      'x-utm-campaign': 'becas2024'
    },
    body: JSON.stringify(dataWithFiles)
  });
  
  return response.json();
};

// 3. Uso completo
const submitApplication = async (applicationData, files) => {
  try {
    // Paso 1: Subir archivos
    const uploadResult = await uploadFiles(files, 'academic_docs');
    if (!uploadResult.success) {
      throw new Error('Error subiendo archivos');
    }
    
    // Paso 2: Crear postulación con referencias a archivos
    const applicationResult = await createApplication(
      applicationData, 
      uploadResult.data.files
    );
    
    if (!applicationResult.success) {
      throw new Error('Error creando postulación');
    }
    
    console.log('Postulación creada:', applicationResult.data.applicationId);
    return applicationResult;
    
  } catch (error) {
    console.error('Error en el proceso:', error);
    throw error;
  }
};
```

#### Configuración de Upload

```bash
# GET /api/uploads/info - Obtener configuración
curl -X GET http://localhost:5000/api/uploads/info
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "storageType": "local",
    "maxSizeMB": 10,
    "allowedTypes": [
      "application/pdf",
      "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png"
    ],
    "allowedExtensions": [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
    "maxFiles": 10,
    "endpoint": "/api/uploads",
    "fieldName": "files",
    "supportedFormats": {
      "documents": ["PDF", "DOC", "DOCX"],
      "images": ["JPG", "JPEG", "PNG"]
    }
  }
}
```

### Respuesta de Health Check

```json
{
  "success": true,
  "uptime": 123.45,
  "message": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "status": "conectado",
    "connection": "mongo"
  },
  "memory": {
    "used": 45.2,
    "total": 128.0,
    "external": 2.1
  }
}
```

## 🔒 Seguridad Implementada

- **Helmet.js**: Headers de seguridad avanzados con HSTS
- **CORS**: Control de acceso con lista blanca configurable
- **Rate Limiting**: Global (100/15min) + Login específico (5/15min) 
- **Sanitización**: Prevención de inyección NoSQL con reemplazo
- **Validación**: Input validation centralizado con express-validator
- **JWT**: Autenticación basada en tokens con expiración
- **Bcrypt**: Hash seguro de contraseñas con salt 12
- **Payload Limits**: JSON 2MB, parámetros limitados

## ⚠️ Códigos de Error HTTP

La API devuelve errores estructurados con códigos HTTP estándar:

### **400 - Bad Request**
**Descripción:** Solicitud malformada o parámetros inválidos
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Los datos enviados son inválidos",
  "errors": [
    {
      "field": "email",
      "message": "Email debe ser válido",
      "value": "email-invalido",
      "location": "body"
    }
  ]
}
```
**Casos comunes:**
- Parámetros de query inválidos (page < 1, limit > 100)
- Fechas en formato incorrecto
- IDs de MongoDB inválidos
- Campos requeridos faltantes

### **401 - Unauthorized**  
**Descripción:** Falta autenticación o token inválido
```json
{
  "success": false,
  "error": "Unauthorized", 
  "message": "Token de acceso requerido"
}
```
**Casos comunes:**
- Header Authorization faltante
- Token JWT expirado o inválido
- Token malformado
- Acceso sin autenticar a rutas protegidas

### **403 - Forbidden**
**Descripción:** Usuario autenticado pero sin permisos suficientes
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Acceso denegado. Se requieren privilegios de administrador"
}
```
**Casos comunes:**
- Usuario normal intentando acceder a rutas admin
- Token válido pero rol insuficiente
- Operaciones no permitidas para el nivel de usuario

### **404 - Not Found**
**Descripción:** Recurso no encontrado
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Beca no encontrada"
}
```
**Casos comunes:**
- ID de beca/postulación inexistente
- Slug de beca no encontrado
- Ruta API inexistente
- Archivos de upload no encontrados

### **409 - Conflict**
**Descripción:** Conflicto con el estado actual del recurso
```json
{
  "success": false,
  "error": "Conflict", 
  "message": "Ya existe una postulación con este documento para esta beca"
}
```
**Casos comunes:**
- Postulación duplicada (mismo documento + beca)
- Slug de beca duplicado
- Email de admin ya registrado
- Conflictos de estado en transiciones

### **422 - Unprocessable Entity**
**Descripción:** Errores de validación semántica
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Error en campo 'closeAt': La fecha de cierre debe ser posterior a la fecha de apertura",
  "errors": [
    {
      "field": "closeAt",
      "message": "La fecha de cierre debe ser posterior a la fecha de apertura",
      "value": "2024-01-01",
      "location": "body"
    }
  ]
}
```
**Casos comunes:**
- Fechas con lógica incorrecta (cierre < apertura)
- Transiciones de estado inválidas
- Reglas de negocio violadas
- Validaciones complejas fallidas

### **429 - Too Many Requests**
**Descripción:** Límite de velocidad excedido
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Límite de velocidad excedido. Intente de nuevo más tarde.",
  "retryAfter": 900
}
```
**Casos comunes:**
- Rate limiting global: 100 requests/15min
- Rate limiting login: 5 intentos/15min  
- Rate limiting admin: 200 requests/5min
- Rate limiting exports: 10 exports/15min

### **500 - Internal Server Error**
**Descripción:** Error interno del servidor
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Error interno del servidor"
}
```
**Casos comunes:**
- Errores de conexión a base de datos
- Fallos en servicios externos
- Errores no controlados en el código
- Problemas de infraestructura

## 🎯 Manejo de Errores en Cliente

### **Verificar Status Code:**
```javascript
const response = await fetch('/api/scholarships');
if (!response.ok) {
  const error = await response.json();
  console.error(`Error ${response.status}:`, error.message);
}
```

### **Manejar Errores de Validación:**
```javascript
try {
  const response = await createApplication(data);
} catch (error) {
  if (error.status === 422 && error.errors) {
    error.errors.forEach(validationError => {
      showFieldError(validationError.field, validationError.message);
    });
  }
}
```

### **Retry en Rate Limiting:**
```javascript
const makeRequest = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }
    
    return response;
  }
  throw new Error('Max retries exceeded');
};
```

## 📊 Logging

- **Desarrollo**: Logs coloridos en consola con timestamps
- **Producción**: Logs estructurados en JSON + archivos
- **Archivos de log** (solo producción):
  - `logs/combined.log`: Todos los logs
  - `logs/error.log`: Solo errores

## 🗄️ Base de Datos

### Modelos Implementados

#### User
```javascript
{
  name: String,        // Nombre del usuario
  email: String,       // Email único
  password: String,    // Contraseña hasheada
  role: String,        // 'user' | 'admin'
  isActive: Boolean,   // Estado activo/inactivo
  createdAt: Date,     // Fecha de creación
  updatedAt: Date      // Fecha de actualización
}
```

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Docker
```bash
docker-compose up -d
```

## 🧪 Testing

```bash
# Ejecutar tests una vez
npm test

# Ejecutar tests en modo watch
npm run test:watch
```

## 📝 Logs y Monitoreo

- **Health Check**: `GET /health` para verificar estado
- **Logs estructurados**: Winston para logging profesional
- **Métricas de memoria**: Incluidas en health check
- **Estado de BD**: Monitoreo de conexión MongoDB

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

ISC

## 🆘 Soporte

Para soporte o preguntas:
- Crear issue en el repositorio
- Revisar logs en `logs/` (producción)
- Verificar health check en `/health`

---

**Nota**: Asegurar cambiar `JWT_SECRET`, `ADMIN_DEFAULT_EMAIL` y `ADMIN_DEFAULT_PASSWORD` en producción.
