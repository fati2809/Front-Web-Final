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

-- 4. Tabla de Usuarios (Compatible con Supabase Auth)
CREATE TABLE usuarios (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_user VARCHAR(255) NOT NULL,
    email_user VARCHAR(255) NOT NULL UNIQUE,
    pass_user VARCHAR(255),  -- Opcional: NULL para usuarios OAuth
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
    id_user UUID REFERENCES usuarios(id_user)
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

-- Nota: Para crear un administrador, usa el registro normal o OAuth
-- y luego actualiza su rol con:
-- UPDATE usuarios SET id_rol = 1 WHERE email_user = 'tu-email@gmail.com';

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

Iniciar
npm run dev