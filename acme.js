const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Sirve la interfaz gráfica automáticamente
app.use(express.static('public'));

// 1. Conexión a AWS RDS
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(() => console.log('✅ Conexión exitosa a AWS RDS'))
    .catch(err => console.error('❌ Error conectando a RDS:', err.stack));

// 2. Ruta Pública: Login con MFA Simulado
app.post('/login', (req, res) => {
    const { usuario, password, mfa } = req.body;

    // Validación de Primer Factor
    if (usuario !== 'admin' || password !== 'acme2026') {
        return res.status(401).json({ mensaje: 'Credenciales de acceso inválidas' });
    }

    // Validación de Segundo Factor (MFA)
    if (mfa !== '250424') {
        return res.status(401).json({ mensaje: 'Código MFA incorrecto o expirado' });
    }

    // Generación de JWT si ambos factores son correctos
    const token = jwt.sign(
        { usuario: usuario, rol: 'administrador' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '2h' }
    );
    
    res.json({ mensaje: 'Autenticación de Doble Factor exitosa', token: token });
});

// 3. Middleware de Seguridad JWT
const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(403).json({ mensaje: 'Bloqueado: Se requiere Token JWT.' });

    try {
        const tokenLimpio = authHeader.split(" ")[1];
        const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        req.usuario = verificado;
        next(); 
    } catch (error) {
        res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

// 4. Ruta Privada ERP
app.get('/api/acme/datos', verificarToken, (req, res) => {
    res.json({
        mensaje: `Bienvenido al núcleo del ERP, ${req.usuario.usuario}`,
        datos_confidenciales: [
            { id: 'SRV-01', recurso: 'AWS EC2', estado: 'Activo' },
            { id: 'DB-01', recurso: 'AWS RDS', estado: 'Seguro' }
        ],
        seguridad: "Auditoría MFA y JWT completada"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API ACME corriendo en el puerto ${PORT}`);
});