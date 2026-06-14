const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


// 1. CONEXIÓN A BASE DE DATOS AWS RDS
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(() => console.log('✅ Conexión exitosa a la base de datos AWS RDS'))
    .catch(err => console.error('❌ Error conectando a RDS:', err.stack));


// ==========================================
// 2. RUTAS PÚBLICAS Y GENERACIÓN DE JWT
// ==========================================
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;

    // Validación simulada de credenciales para el requerimiento de seguridad
    if (usuario === 'admin' && password === 'acme2026') {
        
        // Se genera el token firmado con la clave secreta
        const token = jwt.sign(
            { usuario: usuario, rol: 'administrador' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '2h' } // El token expirará en 2 horas
        );
        
        res.json({ 
            mensaje: 'Autenticación exitosa', 
            token: token 
        });
    } else {
        res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
});


// ==========================================
// 3. MIDDLEWARE DE SEGURIDAD (El Guardia)
// ==========================================
const verificarToken = (req, res, next) => {
    // Busca el token en la cabecera 'Authorization'
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere un token JWT.' });
    }

    try {
        // Extrae el token limpiando la palabra "Bearer "
        const tokenLimpio = authHeader.split(" ")[1];
        
        // Verifica la firma del token
        const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        
        // Si es válido, guarda los datos del usuario en la petición y permite continuar
        req.usuario = verificado;
        next(); 
    } catch (error) {
        res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};


// ==========================================
// 4. RUTAS PRIVADAS (Protegidas por JWT)
// ==========================================
app.get('/api/acme/datos', verificarToken, (req, res) => {
    res.json({
        mensaje: `¡Bienvenido al sistema ERP de ACME, ${req.usuario.usuario}!`,
        datos: "Esta información es confidencial y solo es visible si tienes un token válido.",
        estado_servidor: "Operativo y Seguro"
    });
});


// ==========================================
// 5. INICIALIZACIÓN DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ACME ERP corriendo de forma segura en el puerto ${PORT}`);
});