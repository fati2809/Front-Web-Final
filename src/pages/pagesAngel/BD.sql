-- 1. Tabla de Roles
CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    name_rol VARCHAR(255) NOT NULL
);

-- 2. Tabla de Divisiones
CREATE TABLE divisiones (
    id_div SERIAL PRIMARY KEY,
    name_div VARCHAR(255) NOT NULL
);

-- 3. Tabla de Edificios
CREATE TABLE edificios (
    id_building SERIAL PRIMARY KEY,
    name_building VARCHAR(255) NOT NULL,
    code_building VARCHAR(255),
    imagen_url TEXT, -- Cambiado de BLOB a TEXT para URLs de Supabase Storage
    lat_building DECIMAL(10, 8) NOT NULL,
    lon_building DECIMAL(11, 8) NOT NULL,
    id_div INT REFERENCES divisiones(id_div)
);

-- 4. Tabla de Usuarios
CREATE TABLE usuarios (
    id_user SERIAL PRIMARY KEY,
    name_user VARCHAR(255) NOT NULL,
    email_user VARCHAR(255) NOT NULL UNIQUE,
    pass_user VARCHAR(255) NOT NULL,
    matricula_user INT,
    id_rol INT REFERENCES rol(id_rol)
);

-- 5. Tabla de Profesores
CREATE TABLE profesor (
    id_profe SERIAL PRIMARY KEY,
    nombre_profe VARCHAR(255) NOT NULL,
    id_division INT REFERENCES divisiones(id_div),
    planta_profe VARCHAR(255),
    id_building INT REFERENCES edificios(id_building)
);

-- 6. Tabla de Eventos
CREATE TABLE eventos (
    id_event SERIAL PRIMARY KEY,
    name_event VARCHAR(255) NOT NULL,
    id_building INT REFERENCES edificios(id_building),
    timedate_event TIMESTAMP, -- En Postgres se usa TIMESTAMP
    status_event INT DEFAULT 1,
    id_profe INT REFERENCES profesor(id_profe),
    id_user INT REFERENCES usuarios(id_user)
);

-- 7. Tabla de Horarios del Profesor
CREATE TABLE horarios_profesor (
    id_horario SERIAL PRIMARY KEY,
    id_profe INT NOT NULL REFERENCES profesor(id_profe) ON DELETE CASCADE,
    dia_semana VARCHAR(20) CHECK (dia_semana IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado')),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    id_building INT REFERENCES edificios(id_building),
    aula VARCHAR(50)
);


INSERT INTO rol (name_rol) VALUES 
('Administrador'),
('Usuario'),
('Profesor');

-- Insertar un usuario administrador
INSERT INTO usuarios (name_user, email_user, pass_user, matricula_user, id_rol) 
VALUES 
('Administrador', 'admin@admin.com', 'admin123', 999999, 1);

ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


ALTER TABLE edificios 
ADD capacidad INT NOT NULL DEFAULT 0;

ALTER TABLE eventos 
ADD capacidad_event INT NOT NULL DEFAULT 0,
ADD prioridad_event INT NOT NULL DEFAULT 1;

ALTER TABLE edificios
  ADD COLUMN capacidad_planta_baja INT NOT NULL DEFAULT 0,
  ADD COLUMN capacidad_planta_alta INT NOT NULL DEFAULT 0;

-- Migrar el valor de 'capacidad' que ya tenías a planta baja
UPDATE edificios SET capacidad_planta_baja = capacidad WHERE capacidad > 0;

-- Quitar la columna genérica
ALTER TABLE edificios DROP COLUMN capacidad;

ALTER TABLE eventos ADD COLUMN planta_event ENUM('baja', 'alta') NOT NULL DEFAULT 'baja';

ALTER TABLE eventos 
ADD COLUMN timedate_end_event TIMESTAMP NULL;