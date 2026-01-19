# Coffee Shop Backend API

Backend API para sistema de gestión de Coffee Shop con autenticación JWT, gestión de productos, ventas y dashboard de métricas.

## 🚀 Tecnologías

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL (Supabase)
- **Almacenamiento:** Supabase Storage
- **Autenticación:** JWT (Access + Refresh Tokens)
- **Validación:** Zod

## 📁 Estructura del Proyecto

```
coffee-shop-backend/
├── src/
│   ├── config/              # Configuración
│   │   ├── env.ts           # Validación de variables de entorno
│   │   └── supabase.ts      # Cliente de Supabase
│   ├── modules/             # Módulos de la aplicación
│   │   ├── auth/            # Autenticación y autorización
│   │   ├── products/        # Gestión de productos
│   │   ├── sales/           # Procesamiento de ventas
│   │   ├── customers/       # Gestión de clientes
│   │   └── dashboard/       # Métricas y analíticas
│   ├── shared/              # Código compartido
│   │   ├── middleware/      # Middlewares globales
│   │   ├── utils/           # Utilidades
│   │   └── types/           # Tipos TypeScript
│   ├── app.ts               # Configuración de Express
│   └── server.ts            # Punto de entrada
├── database/                # Migraciones SQL
│   └── migrations/          # Archivos de migración
├── .env.example             # Ejemplo de variables de entorno
├── package.json
├── tsconfig.json
└── README.md
```

## ⚙️ Variables de Entorno

Copia `.env.example` a `.env` y configura las siguientes variables:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3001` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Clave anónima de Supabase | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase | `eyJhbGc...` |
| `JWT_SECRET` | Secret para access tokens (32+ chars) | `your-secret-key` |
| `JWT_EXPIRES_IN` | Expiración del access token | `15m` |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens (32+ chars) | `your-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Expiración del refresh token | `7d` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:5173` |

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd coffee-shop-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Ejecutar el servidor

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 📚 API Endpoints

### Auth (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Registrar nuevo usuario | No |
| POST | `/login` | Iniciar sesión | No |
| POST | `/refresh` | Renovar access token | No |
| POST | `/logout` | Cerrar sesión | Sí |
| GET | `/me` | Obtener perfil del usuario | Sí |

### Products (`/api/products`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar productos (filtros, paginación) | No |
| GET | `/:id` | Obtener producto por ID | No |
| POST | `/` | Crear producto (con imagen) | Sí |
| PUT | `/:id` | Actualizar producto (con imagen) | Sí |
| DELETE | `/:id` | Eliminar producto (soft delete) | Sí |

### Sales (`/api/sales`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear venta (público) | No |
| GET | `/` | Listar ventas (filtros) | Sí |
| GET | `/:id` | Obtener venta con items | Sí |

### Customers (`/api/customers`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar clientes (búsqueda) | Sí |
| GET | `/:id` | Obtener cliente con stats | Sí |
| GET | `/:id/purchases` | Historial de compras | Sí |

### Dashboard (`/api/dashboard`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/summary` | Métricas generales | Sí |
| GET | `/top-products` | Top productos por ingresos | Sí |
| GET | `/top-customers` | Top clientes por gastos | Sí |
| GET | `/low-stock` | Productos con stock bajo | Sí |
| GET | `/sales-chart` | Ventas por día | Sí |

## 🔒 Autenticación

El sistema utiliza **JWT con Access y Refresh Tokens**:

1. **Registro/Login**: Retorna `accessToken` (15min) y `refreshToken` (7 días)
2. **Requests autenticados**: Incluir header `Authorization: Bearer <accessToken>`
3. **Renovar token**: POST `/api/auth/refresh` con `{ refreshToken }`
4. **Logout**: Invalida el refresh token en la base de datos

## 🗄️ Base de Datos

### Tablas principales:

- **users** - Usuarios del sistema (admins)
- **products** - Productos del café (con imagen en Storage)
- **customers** - Clientes que realizan compras
- **sales** - Ventas realizadas
- **sale_items** - Items individuales de cada venta

### Función RPC:

- **process_sale** - Procesa ventas de forma atómica:
  - Valida productos y stock
  - Crea/actualiza cliente
  - Crea venta y items
  - Actualiza stock automáticamente
  - Todo en una transacción (rollback automático si falla)

##  Mejoras Futuras

- [ ] Tests unitarios e integración
- [ ] Documentación Swagger/OpenAPI
- [ ] Cache con Redis
- [ ] Webhooks para eventos
- [ ] Reportes exportables (PDF/Excel)

##  Autor

Kevin - Full Stack Developer
