// Supabase Client Configuration
const SUPABASE_URL = 'https://imqcifvmklkccwagpkee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWNpZnZta2xrY2N3YWdwa2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjMzNDIsImV4cCI6MjA4NDY5OTM0Mn0.fP4S0VfaC823LKUvh6HcybS_ze9uWWrBKgC4SsQBiRU';

// Inicializar cliente de Supabase
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ Supabase inicializado correctamente');
      console.log('URL:', SUPABASE_URL);
      return true;
    } catch (err) {
      console.error('❌ Error al inicializar Supabase:', err);
      return false;
    }
  }
  console.warn('⚠️ Supabase SDK no cargado. Verifica que el script esté incluido.');
  return false;
}

// Sistema de Reservas con Supabase
const ReservationSystem = {
  // Guardar una nueva reserva
  async createReservation(reservationData) {
    if (!supabaseClient) {
      console.error('Supabase no está inicializado');
      return { success: false, error: 'Supabase no configurado' };
    }

    try {
      // Preparar datos, convirtiendo strings vacíos a null para campos opcionales
      const insertData = {
        nombre: reservationData.nombre,
        email: reservationData.email,
        telefono: reservationData.telefono || null,
        fecha: reservationData.fecha,
        hora_entrada: reservationData.horaEntrada || null,
        hora_salida: reservationData.horaSalida || null,
        personas: parseInt(reservationData.personas) || 1,
        mesa: reservationData.mesa || null,
        comentarios: reservationData.comentarios || null,
        estado: 'pendiente',
        created_at: new Date().toISOString()
      };
      
      console.log('Datos a insertar:', insertData);
      
      const { data, error } = await supabaseClient
        .from('reservations')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Error al crear reserva:', error);
        return { success: false, error: error.message };
      }

      console.log('Reserva creada:', data);
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error inesperado:', err);
      return { success: false, error: err.message };
    }
  },

  // Obtener todas las reservas (para admin)
  async getReservations() {
    if (!supabaseClient) {
      return { success: false, error: 'Supabase no configurado' };
    }

    try {
      const { data, error } = await supabaseClient
        .from('reservations')
        .select('*')
        .order('fecha', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Verificar disponibilidad de mesa
  async checkTableAvailability(fecha, horaEntrada, horaSalida, mesa) {
    if (!supabaseClient) {
      return { available: true }; // Si no hay Supabase, asumimos disponible
    }

    try {
      const { data, error } = await supabaseClient
        .from('reservations')
        .select('*')
        .eq('fecha', fecha)
        .eq('mesa', mesa)
        .neq('estado', 'cancelada');

      if (error) {
        return { available: true, error: error.message };
      }

      // Verificar si hay conflicto de horarios
      const hasConflict = data.some(reservation => {
        const existingStart = reservation.hora_entrada;
        const existingEnd = reservation.hora_salida;
        return (horaEntrada < existingEnd && horaSalida > existingStart);
      });

      return { available: !hasConflict };
    } catch (err) {
      return { available: true, error: err.message };
    }
  },

  // Actualizar estado de reserva
  async updateReservationStatus(reservationId, newStatus) {
    if (!supabaseClient) {
      return { success: false, error: 'Supabase no configurado' };
    }

    try {
      const { data, error } = await supabaseClient
        .from('reservations')
        .update({ estado: newStatus })
        .eq('id', reservationId)
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

// Manejar el formulario de reservas
function setupReservationForm() {
  const form = document.querySelector('#reservas form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const reservationData = {
      nombre: document.getElementById('nombre')?.value || '',
      email: document.getElementById('email')?.value || '',
      telefono: document.getElementById('telefono')?.value || '',
      fecha: document.getElementById('fecha')?.value || '',
      horaEntrada: document.getElementById('hora-entrada')?.value || '',
      horaSalida: document.getElementById('hora-salida')?.value || '',
      personas: document.getElementById('personas')?.value || '1',
      mesa: window.selectedTable || null,
      comentarios: document.getElementById('comentarios')?.value || ''
    };

    // Validar campos requeridos
    if (!reservationData.nombre || !reservationData.email || !reservationData.fecha) {
      showNotification('Por favor, completa todos los campos requeridos', 'error');
      return;
    }

    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Procesando...</span>';
    submitBtn.disabled = true;

    // Verificar disponibilidad si hay mesa seleccionada
    if (reservationData.mesa) {
      const availability = await ReservationSystem.checkTableAvailability(
        reservationData.fecha,
        reservationData.horaEntrada,
        reservationData.horaSalida,
        reservationData.mesa
      );

      if (!availability.available) {
        showNotification('La mesa seleccionada no está disponible en ese horario', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
      }
    }

    // Crear reserva
    console.log('Enviando reserva a Supabase:', reservationData);
    const result = await ReservationSystem.createReservation(reservationData);
    console.log('Resultado de Supabase:', result);

    if (result.success) {
      showNotification('¡Reserva realizada con éxito! Te contactaremos pronto.', 'success');
      form.reset();
      window.selectedTable = null;
      // Limpiar selección de mesa visualmente
      document.querySelectorAll('.table-selected').forEach(el => el.classList.remove('table-selected'));
    } else {
      console.error('Error detallado:', result.error);
      showNotification(`Error: ${result.error || 'Error desconocido'}`, 'error');
    }

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  });
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-[10000] p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
  
  if (type === 'success') {
    notification.classList.add('bg-green-500', 'text-white');
  } else if (type === 'error') {
    notification.classList.add('bg-red-500', 'text-white');
  } else {
    notification.classList.add('bg-blue-500', 'text-white');
  }

  notification.innerHTML = `
    <div class="flex items-center">
      <span>${message}</span>
      <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Animar entrada
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 10);

  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Configurar selección de mesas
function setupTableSelection() {
  const tables = document.querySelectorAll('#reservas .bg-white.p-3');
  
  tables.forEach((table, index) => {
    const tableNumber = index + 1;
    const isOccupied = table.querySelector('.text-red-500');
    
    if (!isOccupied) {
      table.addEventListener('click', () => {
        // Remover selección anterior
        tables.forEach(t => t.classList.remove('ring-2', 'ring-amber-500', 'table-selected'));
        
        // Seleccionar esta mesa
        table.classList.add('ring-2', 'ring-amber-500', 'table-selected');
        window.selectedTable = tableNumber;
        
        showNotification(`Mesa ${tableNumber} seleccionada`, 'info');
      });
    }
  });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  setupReservationForm();
  setupTableSelection();
});

// Exportar para uso global
window.ReservationSystem = ReservationSystem;
window.showNotification = showNotification;
