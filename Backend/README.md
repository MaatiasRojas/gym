# GymTrack – Backend

API en **Node + Express**, con **Prisma** y **PostgreSQL en Neon**. Se publica en **Vercel**.

## Estructura

```
Backend/
├── prisma/
│   ├── schema.prisma         ← las tablas (modelos de Prisma)
│   └── migrations/           ← se crea con la primera migración (subila a Git)
├── scripts/
│   └── crearUsuarioPrueba.js ← npm run usuario-prueba
├── .env                      ← tus claves (NO se sube a Git; copiá .env.example)
└── src/
    ├── index.js              ← arranca Express y conecta las rutas (en Vercel se exporta)
    ├── config.js             ← lee las variables de entorno
    ├── prisma.js             ← cliente de Prisma
    ├── mapeos.js             ← convierte lo de la base al formato del frontend
    ├── seguridad.js          ← contraseñas (scrypt) y sesiones (JWT)
    ├── validacion.js         ← revisa los datos que manda el frontend
    ├── errores.js
    ├── datos/semilla.js      ← ejercicios base y rutina de ejemplo de cada usuario nuevo
    ├── servicios/datosUsuario.js
    └── rutas/                ← auth, ajustes, ejercicios, rutinas, entrenamientos, datos
```

---

## 1. Crear la base en Neon

1. Entrá a [neon.tech](https://neon.tech) y creá una cuenta (el plan gratis alcanza).
2. **New Project** → nombre `gymtrack` → elegí la región más cercana a Vercel (por ejemplo *AWS US East*).
3. En el panel del proyecto tocá **Connect**. Vas a necesitar dos conexiones:
   - Con **Connection pooling activado** → la URL tiene `-pooler` en el host. Esa es `DATABASE_URL`.
   - Con **Connection pooling desactivado** → la misma URL sin `-pooler`. Esa es `DIRECT_URL`.

## 2. Configurar y crear las tablas (en tu compu)

```bash
cd Backend
copy .env.example .env        # en Mac/Linux: cp .env.example .env
```

Abrí `.env` y pegá `DATABASE_URL`, `DIRECT_URL` y un `JWT_SECRET` (el archivo explica cómo generarlo).

```bash
npm install                          # instala Express y Prisma (y genera el cliente)
npm run db:migrar -- --name inicial  # crea las tablas en Neon
npm run dev                          # levanta la API en http://localhost:3001/api
```

`npm run db:migrar` crea la carpeta `prisma/migrations`: **subila a Git**, es el historial de cambios de la base.

Otros comandos útiles:

| Comando | Qué hace |
|---|---|
| `npm run db:ver` | Abre **Prisma Studio** en el navegador para ver y editar las tablas |
| `npm run db:migrar -- --name lo-que-cambiaste` | Después de cambiar `schema.prisma`: crea la migración y la aplica |
| `npm run db:aplicar` | Aplica migraciones pendientes sin crear nuevas (para producción) |
| `npm run usuario-prueba` | Crea **prueba@gymtrack.com / prueba123** con 12 semanas de datos de ejemplo |

## 3. Subir el backend a Vercel

La forma más simple es subir el proyecto a **GitHub** y conectarlo con Vercel, así cada vez que hacés `git push` se actualiza solo.

1. Subí la carpeta `ProyectoGimnasio` a un repositorio de GitHub (con `Frontend` y `Backend` adentro).
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importá el repositorio.
3. En **Root Directory** elegí `Backend`. Vercel detecta Express solo.
4. En **Environment Variables** agregá `DATABASE_URL`, `DIRECT_URL` y `JWT_SECRET` (los mismos valores del `.env`).
5. **Deploy**. Cuando termine, probá `https://TU-BACKEND.vercel.app/api/salud` → tiene que responder `{"ok":true}`.

> Sin GitHub: instalá la CLI (`npm i -g vercel`), parate en `Backend` y corré `vercel` (después `vercel --prod`).
> Las variables se cargan igual, desde el panel del proyecto en Vercel.

## 4. Subir el frontend a Vercel

Es **otro proyecto** dentro de la misma cuenta (el plan gratis permite hasta 200 proyectos).

1. En `Frontend/vercel.json` reemplazá `CAMBIAR-POR-TU-BACKEND.vercel.app` por el dominio de tu backend.
   Así el frontend manda `/api/...` al backend sin problemas de CORS, y las rutas como `/progreso`
   funcionan al recargar la página.
2. En Vercel → **Add New… → Project** → el mismo repositorio → **Root Directory** = `Frontend`.
   Vercel detecta Vite solo. **Deploy**.
3. Abrí la URL del frontend, creá tu cuenta y en *Ajustes → Restaurar una copia* subí tu copia
   (las de la base vieja quedaron en `Backend/data/copias/`).

## Límites a tener en cuenta (plan gratis de Vercel)

- **4,5 MB por petición**: por eso las imágenes de los ejercicios tienen un máximo de 2 MB.
- La API funciona como una función: se "despierta" con la primera petición. Neon en el plan gratis también
  se suspende si no se usa, así que la primera carga después de un rato puede tardar 1 o 2 segundos.

## Endpoints

Todas las rutas (menos `/api/auth/registro`, `/api/auth/login` y `/api/salud`) necesitan el header
`Authorization: Bearer <token>`. Los errores vuelven como `{ "error": "mensaje" }`.

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/registro` | `{ nombre, email, password }` → `{ token, usuario }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, usuario }` |
| GET | `/api/auth/yo` | Usuario de la sesión actual |
| GET / PUT | `/api/ajustes` | Leer / cambiar ajustes (podés mandar solo lo que cambió) |
| GET / POST | `/api/ejercicios` | Listar / crear ejercicio |
| PUT / DELETE | `/api/ejercicios/:id` | Editar / borrar ejercicio |
| GET / POST | `/api/rutinas` | Listar / crear rutina |
| PUT / DELETE | `/api/rutinas/:id` | Editar / borrar rutina |
| GET / POST | `/api/entrenamientos` | Historial / guardar un entrenamiento terminado |
| POST | `/api/entrenamientos/lote` | Guardar varios (datos de ejemplo) |
| DELETE | `/api/entrenamientos/demo` | Borrar los datos de ejemplo |
| DELETE | `/api/entrenamientos/:id` | Borrar un entrenamiento |
| GET | `/api/datos` | Copia de seguridad con todo |
| POST | `/api/datos/restaurar` | Reemplazar todo por una copia |
| DELETE | `/api/datos` | Dejar la cuenta como recién creada |

## Sobre la versión de Prisma

Se usa **Prisma 6** con el cliente clásico (`prisma-client-js`), que funciona directo con JavaScript.
Prisma 7 genera el cliente en TypeScript; si algún día pasás el backend a TypeScript, conviene actualizar.
