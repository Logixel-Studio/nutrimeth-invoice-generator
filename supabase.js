/* ─────────────────────────────────────────
   SUPABASE CONFIG
───────────────────────────────────────── */
const SUPABASE_URL = 'https://nzvnhyfwzsonqgqvhjlu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_g8sFBJTr6NpoBJf-PasHOQ_S4tuYUQz';

const supabaseHeaders = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

/* ─────────────────────────────────────────
   SAVE INVOICE
───────────────────────────────────────── */
async function saveInvoiceToSupabase(data) {
  try {
    const payload = {
      invoice_number: data.invoiceNumber,
      invoice_date: data.invoiceDate,
      due_date: data.dueDate || null,
      client_name: data.clientName,
      client_number: data.clientPhone || '',
      client_address: data.clientAddress || '',
      payment_status: data.paymentStatus || 'Unpaid',
      total_price: data.grandTotal || 0,
      product_details: data.rows.map(r => ({
        name: r.product,
        size: r.size || '',
        qty: r.qty,
        price: r.price,
        total: r.price * r.qty
      })),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Supabase save error:', err);
      return { success: false, error: err };
    }
    return { success: true };
  } catch (e) {
    console.error('Supabase save exception:', e);
    return { success: false, error: e.message };
  }
}

/* ─────────────────────────────────────────
   FETCH INVOICES
───────────────────────────────────────── */
async function fetchInvoices({ search = '', searchType = 'client' } = {}) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/invoices?order=created_at.desc`;
    if (search) {
      if (searchType === 'client') {
        url += `&client_name=ilike.*${encodeURIComponent(search)}*`;
      } else {
        url += `&invoice_number=ilike.*${encodeURIComponent(search)}*`;
      }
    }
    const res = await fetch(url, { headers: supabaseHeaders });
    if (!res.ok) throw new Error(await res.text());
    return { success: true, data: await res.json() };
  } catch (e) {
    return { success: false, error: e.message, data: [] };
  }
}

/* ─────────────────────────────────────────
   GLOBAL CONFIG (products, sizes, contact)
───────────────────────────────────────── */
async function loadGlobalConfig() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/global_config?order=id.desc&limit=1`, {
      headers: supabaseHeaders
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length ? rows[0] : null;
  } catch (e) {
    console.error('loadGlobalConfig error:', e);
    return null;
  }
}

async function saveGlobalConfig(config) {
  try {
    // Upsert with id=1
    const payload = { id: 1, ...config };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/global_config`, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('saveGlobalConfig error:', err);
      return { success: false, error: err };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
