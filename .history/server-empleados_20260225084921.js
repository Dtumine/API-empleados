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

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  connectionStatus = 'connected';
} else {
  connectionStatus = 'error-config';
}

// --- Rutas ---

// Estado de conexión
app.get('/api/status', async (req, res) => {
  try {
    if (connectionStatus === 'error-config') {
      return res.status(500).json({
        status: 'error',
        message: 'Configuración de Supabase incompleta',
        details: 'Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_KEY'
      });
    }
    const { data, error } = await supabase.from('empleados').select('*').limit(1);
    if (error) throw error;

    res.json({ status: 'success', message: 'Conexión exitosa con Supabase', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error en el servidor', details: error.message });
  }
});

// Obtener todos los empleados
app.get('/api/empleados', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('empleados')
      .select('id_empleado, nombre, apellido, puesto, fecha_ingreso, activo')
      .order('id_empleado', { ascending: true });
    if (error) throw error;

    res.json({ status: 'success', total: data.length, data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener empleados', details: error.message });
  }
});

// Obtener un empleado por ID
app.get('/api/empleados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .eq('id_empleado', id)
      .single();
    if (error) return res.status(404).json({ status: 'error', message: 'Empleado no encontrado', details: error.message });

    res.json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error en el servidor', details: error.message });
  }
});

// Crear empleado
app.post('/api/empleados', async (req, res) => {
  try {
    const { nombre, apellido, puesto, fecha_ingreso, activo } = req.body;

    if (!nombre || !apellido || !puesto) {
      return res.status(400).json({ status: 'error', message: 'Los campos nombre, apellido y puesto son obligatorios' });
    }

    const { data, error } = await supabase
      .from('empleados')
      .insert([{
        nombre,
        apellido,
        puesto,
        fecha_ingreso: fecha_ingreso || new Date().toISOString(),
        activo: activo !== undefined ? activo : true
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ status: 'success', message: 'Empleado creado exitosamente', data: data[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error en el servidor', details: error.message });
  }
});

// Actualizar empleado
app.put('/api/empleados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, puesto, activo } = req.body;

    const { data, error } = await supabase
      .from('empleados')
      .update({ nombre, apellido, puesto, activo })
      .eq('id_empleado', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ status: 'error', message: 'Empleado no encontrado' });

    res.json({ status: 'success', message: 'Empleado actualizado exitosamente', data: data[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error en el servidor', details: error.message });
  }
});

// Eliminar empleado
app.delete('/api/empleados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('empleados')
      .delete()
      .eq('id_empleado', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ status: 'error', message: 'Empleado no encontrado' });

    res.json({ status: 'success', message: 'Empleado eliminado exitosamente', data: data[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error en el servidor', details: error.message });
  }
});

// Error general
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Error interno del servidor', details: err.message });
});

// Puerto
const PORT = process.env.PORT_EMPLEADOS || 3090;
app.listen(PORT, () => console.log(`✅ API Empleados ejecutándose en http://localhost:${PORT} | Estado: ${connectionStatus}`));