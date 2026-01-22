# Configuración del Sistema de Pagos y Reservas

## 1. Configuración de Supabase (Reservas)

### Paso 1: Crear cuenta en Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto

### Paso 2: Crear la tabla de reservas
En el SQL Editor de Supabase, ejecuta:

```sql
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  fecha DATE NOT NULL,
  hora_entrada TIME,
  hora_salida TIME,
  personas INTEGER DEFAULT 1,
  mesa INTEGER,
  comentarios TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserciones públicas
CREATE POLICY "Allow public inserts" ON reservations
  FOR INSERT WITH CHECK (true);

-- Política para permitir lectura (solo para admin)
CREATE POLICY "Allow authenticated reads" ON reservations
  FOR SELECT USING (auth.role() = 'authenticated');
```

### Paso 3: Obtener credenciales
1. Ve a Settings > API
2. Copia la **URL** del proyecto
3. Copia la **anon public key**

### Paso 4: Configurar en el código
Edita `components/supabase-client.js`:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
```

---

## 2. Configuración de Stripe (Pagos con BLIK)

### Paso 1: Crear cuenta en Stripe
1. Ve a [https://stripe.com](https://stripe.com)
2. Crea una cuenta
3. Completa la verificación de tu negocio

### Paso 2: Habilitar BLIK
1. Ve a Dashboard > Settings > Payment methods
2. Activa **BLIK** (disponible para Polonia)
3. También activa **Przelewy24 (P24)** si lo deseas

### Paso 3: Obtener claves API
1. Ve a Developers > API keys
2. Copia la **Publishable key** (pk_test_xxx o pk_live_xxx)

### Paso 4: Configurar en el código
Edita `components/stripe-checkout.js`:

```javascript
const STRIPE_PUBLIC_KEY = 'pk_test_tu_clave_publica';
```

### Paso 5: Crear productos en Stripe (Opcional)
Para usar Price IDs predefinidos:
1. Ve a Products en el Dashboard de Stripe
2. Crea productos con sus precios
3. Usa los Price IDs en tu código

---

## 3. Backend para Stripe (Recomendado para Producción)

Para producción, necesitas un backend que cree las sesiones de checkout.

### Opción A: Netlify Functions
Crea `netlify/functions/create-checkout-session.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { lineItems, customerEmail, successUrl, cancelUrl } = JSON.parse(event.body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### Opción B: Vercel Serverless Functions
Crea `api/create-checkout-session.js` con código similar.

---

## 4. Variables de Entorno

### Para desarrollo local:
Crea un archivo `.env`:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

### Para producción (Netlify/Vercel):
Configura las variables en el panel de tu hosting.

---

## 5. Flujo de Uso

### Reservas (sin pago):
1. Usuario llena el formulario de reserva
2. Datos se guardan en Supabase
3. Usuario recibe confirmación visual
4. Admin puede ver reservas en Supabase Dashboard

### Compras (con Stripe):
1. Usuario agrega productos al carrito
2. Click en "Pagar" redirige a Stripe Checkout
3. Usuario paga con BLIK, tarjeta o P24
4. Stripe redirige a `success.html`
5. Carrito se limpia automáticamente

---

## 6. Testing

### Stripe Test Mode:
- Usa tarjeta: `4242 4242 4242 4242`
- Cualquier fecha futura y CVC

### BLIK Test:
- En modo test, BLIK simula el flujo completo

---

## Soporte

- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- BLIK en Stripe: https://stripe.com/docs/payments/blik
