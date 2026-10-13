-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "ajustes" JSONB NOT NULL DEFAULT '{}',
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejercicios" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "musculos" TEXT[],
    "descripcion" TEXT NOT NULL DEFAULT '',
    "consejos" TEXT[],
    "errores" TEXT[],
    "variantes" TEXT[],
    "imagen" TEXT,
    "personalizado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutinas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL DEFAULT '',
    "dias_por_semana" INTEGER NOT NULL,
    "dias" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "rutinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrenamientos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "duracion_seg" INTEGER NOT NULL,
    "rutina_id" INTEGER,
    "rutina_nombre" TEXT NOT NULL DEFAULT '',
    "dia_indice" INTEGER NOT NULL DEFAULT 0,
    "dia_nombre" TEXT NOT NULL DEFAULT '',
    "volumen" INTEGER NOT NULL DEFAULT 0,
    "ejercicios" JSONB NOT NULL DEFAULT '[]',
    "demo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "entrenamientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "ejercicios_usuario_id_idx" ON "ejercicios"("usuario_id");

-- CreateIndex
CREATE INDEX "rutinas_usuario_id_idx" ON "rutinas"("usuario_id");

-- CreateIndex
CREATE INDEX "entrenamientos_usuario_id_inicio_idx" ON "entrenamientos"("usuario_id", "inicio");

-- AddForeignKey
ALTER TABLE "ejercicios" ADD CONSTRAINT "ejercicios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrenamientos" ADD CONSTRAINT "entrenamientos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
