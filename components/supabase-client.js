// Supabase Client Configuration
const SUPABASE_URL = 'https://imqcifvmklkccwagpkee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWNpZnZta2xrY2N3YWdwa2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjMzNDIsImV4cCI6MjA4NDY5OTM0Mn0.fP4S0VfaC823LKUvh6HcybS_ze9uWWrBKgC4SsQBiRU';

// Inicializar cliente de Supabase inmediatamente si el SDK está disponible
let supabaseClient = null;

function initSupabase() {
  if (supabaseClient) return true; // Ya inicializado
  
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabaseClient = supabaseClient; // Exponer globalmente
      console.log('✅ Supabase inicializado correctamente');
      try {
        window.dispatchEvent(new CustomEvent('supabase-ready'));
      } catch (e) {}
      return true;
    } catch (err) {
      console.error('❌ Error al inicializar Supabase:', err);
      return false;
    }
  }
  console.warn('⚠️ Supabase SDK no cargado. Verifica que el script esté incluido.');
  return false;
}

// Intentar inicializar inmediatamente
initSupabase();

// Sistema de Reservas con Supabase
const ReservationSystem = {
  // Guardar una nueva reserva
  async createReservation(reservationData) {
    if (!supabaseClient) {
      console.error('Supabase no está inicializado');
      return { success: false, error: 'Supabase no configurado' };
    }

    try {
      const emailNorm = String(reservationData.email || '').trim().toLowerCase();
      // Preparar datos, convirtiendo strings vacíos a null para campos opcionales
      const insertData = {
        nombre: reservationData.nombre,
        email: emailNorm,
        telefono: reservationData.telefono || null,
        fecha: reservationData.fecha,
        hora_entrada: reservationData.horaEntrada || null,
        personas: parseInt(reservationData.personas) || 1,
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

      // Upsert del cliente para panel admin / marketing (best-effort)
      try {
        if (reservationData?.consentNewsletter) {
          await upsertClientFromInteraction({
            nombre: reservationData.nombre,
            email: reservationData.email,
            telefono: reservationData.telefono || null,
            newsletter: true,
            incReservas: 1,
            incPedidos: 0
          });
        } else {
          await upsertClientFromInteraction({
            nombre: reservationData.nombre,
            email: reservationData.email,
            telefono: reservationData.telefono || null,
            newsletter: false,
            incReservas: 1,
            incPedidos: 0
          });
        }
      } catch (e) {
        console.warn('No se pudo actualizar cliente en clients:', e);
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

  const applyLoggedInReservationAutofill = () => {
    const user = window.auth && typeof window.auth.getCurrentUser === 'function' ? window.auth.getCurrentUser() : null;

    const nameInput = document.getElementById('nombre');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('telefono');

    const nameWrap = nameInput ? nameInput.parentElement : null;
    const emailWrap = emailInput ? emailInput.parentElement : null;
    const phoneWrap = phoneInput ? phoneInput.parentElement : null;

    const setVisible = (wrap, input, visible) => {
      if (wrap) wrap.style.display = visible ? '' : 'none';
      if (input) {
        if (visible) {
          input.required = true;
          input.readOnly = false;
          input.classList.remove('bg-gray-50');
        } else {
          input.required = false;
          input.readOnly = true;
          input.classList.add('bg-gray-50');
        }
      }
    };

    if (user?.email) {
      if (nameInput) nameInput.value = String(user.name || '').trim();
      if (emailInput) emailInput.value = String(user.email || '').trim();
      if (phoneInput) phoneInput.value = String(user.phone || '').trim();

      setVisible(nameWrap, nameInput, false);
      setVisible(emailWrap, emailInput, false);
      setVisible(phoneWrap, phoneInput, false);
      return;
    }

    setVisible(nameWrap, nameInput, true);
    setVisible(emailWrap, emailInput, true);
    setVisible(phoneWrap, phoneInput, true);
  };

  applyLoggedInReservationAutofill();
  try {
    window.addEventListener('auth-changed', () => applyLoggedInReservationAutofill());
  } catch (e) {}

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentUser = window.auth && typeof window.auth.getCurrentUser === 'function' ? window.auth.getCurrentUser() : null;

    const reservationData = {
      nombre: (currentUser?.email ? String(currentUser.name || '').trim() : (document.getElementById('nombre')?.value || '')),
      email: (currentUser?.email ? String(currentUser.email || '').trim() : (document.getElementById('email')?.value || '')),
      telefono: (currentUser?.email ? String(currentUser.phone || '').trim() : (document.getElementById('telefono')?.value || '')),
      fecha: document.getElementById('fecha')?.value || '',
      horaEntrada: document.getElementById('hora-entrada')?.value || '',
      personas: document.getElementById('personas')?.value || '1',
      comentarios: document.getElementById('comentarios')?.value || '',
      consentNewsletter: !!document.getElementById('reservas-consent-marketing')?.checked
    };

    const consentConfirm = !!document.getElementById('reservas-consent-confirm')?.checked;
    if (!consentConfirm) {
      showNotification('Debes aceptar el consentimiento de confirmaciones para continuar.', 'error');
      return;
    }

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

    // Crear reserva
    console.log('Enviando reserva a Supabase:', reservationData);
    const result = await ReservationSystem.createReservation(reservationData);
    console.log('Resultado de Supabase:', result);

    if (result.success) {
      showNotification('¡Reserva realizada con éxito! Te contactaremos pronto.', 'success');
      form.reset();
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

async function upsertClientFromInteraction({ nombre, email, telefono, newsletter, incReservas, incPedidos }) {
  if (!supabaseClient || !email) return;

  const { data: existing, error: existingError } = await supabaseClient
    .from('clients')
    .select('id,total_reservas,total_pedidos,newsletter')
    .eq('email', email)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  if (!existing) {
    const { error } = await supabaseClient
      .from('clients')
      .insert([{
        nombre,
        email,
        telefono: telefono || null,
        newsletter: !!newsletter,
        total_reservas: incReservas || 0,
        total_pedidos: incPedidos || 0,
        created_at: new Date().toISOString()
      }]);
    if (error) throw error;
    return;
  }

  const nextReservas = (existing.total_reservas || 0) + (incReservas || 0);
  const nextPedidos = (existing.total_pedidos || 0) + (incPedidos || 0);
  const nextNewsletter = existing.newsletter || !!newsletter;

  const { error } = await supabaseClient
    .from('clients')
    .update({
      nombre,
      telefono: telefono || null,
      newsletter: nextNewsletter,
      total_reservas: nextReservas,
      total_pedidos: nextPedidos
    })
    .eq('id', existing.id);

  if (error) throw error;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  setupReservationForm();
});

// Exportar para uso global
window.ReservationSystem = ReservationSystem;
window.showNotification = showNotification;
