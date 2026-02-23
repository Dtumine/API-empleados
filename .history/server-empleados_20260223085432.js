const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
let connectionStatus = 'not-initialized';

// Inicializar Supabase
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  connectionStatus = 'connected';
} else {
  connectionStatus = 'error-config';
}

// Rutas

// 1. Ruta de estado de conexión
app.get('/api/status', async (req, res) => {
  try {
    if (connectionStatus === 'error-config') {
      return res.status(500).json({
        status: 'error',
        message: 'Configuración de Supabase incompleta',
        details: 'Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_KEY'
      });
    }

    // Intentar una consulta simple para verificar la conexión
    const { data, error } = await supabase.from('empleados').select('*').limit(1);
    
    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al conectar con Supabase',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      message: 'Conexión exitosa con Supabase (Tabla empleados)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 2. Ruta para obtener todos los empleados
app.get('/api/empleados', async (req, res) => {
  try {
    if (connectionStatus === 'error-config') {
      return res.status(500).json({
        status: 'error',
        message: 'Configuración incompleta'
      });
    }

    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('id_empleado', { ascending: true });
    
    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener empleados',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      total: data ? data.length : 0,
      data: data || []
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 3. Ruta para obtener un empleado por ID
app.get('/api/empleados/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .eq('id_empleado', id)
      .single();
    
    if (error) {
      return res.status(404).json({
        status: 'error',
        message: 'Empleado no encontrado',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 4. Ruta para crear un empleado
app.post('/api/empleados', async (req, res) => {
  try {
    const { nombre, apellido, puesto } = req.body;

    // Validación
    if (!nombre || !apellido || !puesto) {
      return res.status(400).json({
        status: 'error',
        message: 'Los campos nombre, apellido y puesto son obligatorios'
      });
    }

    const { data, error } = await supabase
      .from('empleados')
      .insert([
        {
          nombre,
          apellido,
          puesto
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al crear empleado',
        details: error.message
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Empleado creado exitosamente',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 5. Ruta para actualizar un empleado
app.put('/api/empleados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, puesto } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('empleados')
      .update({
        nombre,
        apellido,
        puesto
      })
      .eq('id_empleado', id)
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al actualizar empleado',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Empleado no encontrado'
      });
    }

    res.json({
      status: 'success',
      message: 'Empleado actualizado exitosamente',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// 6. Ruta para eliminar un empleado
app.delete('/api/empleados/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('empleados')
      .delete()
      .eq('id_empleado', id)
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al eliminar empleado',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Empleado no encontrado'
      });
    }

    res.json({
      status: 'success',
      message: 'Empleado eliminado exitosamente',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
    details: err.message
  });
});

// Puerto (Render y plataformas similares exponen `process.env.PORT`)
const DEFAULT_PORT = 3090;
const PORT = parseInt(process.env.PORT, 10) || parseInt(process.env.PORT_EMPLEADOS, 10) || DEFAULT_PORT;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  const hostDisplay = HOST === '0.0.0.0' ? '0.0.0.0' : HOST;
  console.log(`✅ API Empleados ejecutándose en puerto ${PORT} (host ${hostDisplay})`);
  console.log(`Estado de conexión: ${connectionStatus}`);
});

// Graceful shutdown for platforms like Render (they send SIGTERM)
const shutdown = (signal) => {
  console.log(`Received ${signal}. Closing server...`);
  server.close(() => {
    console.log('Server closed. Exiting process.');
    process.exit(0);
  });
  // Force exit if not closed in reasonable time
  setTimeout(() => {
    console.error('Forcing shutdown.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
