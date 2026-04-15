import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, Plus, Search, ChevronDown, ChevronRight, LogOut, Menu, X, Eye, Edit2, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, UserPlus, ClipboardList, BarChart3, Hash, Phone, MapPin, Calendar, Clock, Truck, FileText, Send, Calculator, Save, ExternalLink, Copy, Check, Zap, Target, Tag, Cloud, CloudOff, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useCloudState } from "./useCloudState";

// ═══════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════
const TALLAS = ["S", "M", "L"];
const COLORES_POLO = ["Verde Botella", "Blanco y Negro", "Guinda"];
const METODOS_PAGO = ["Yape", "Plin", "Efectivo", "Transferencia"];
const ESTADOS_VENTA = ["Pendiente", "Pagado", "Enviado", "Entregado", "Cancelado"];
const ESTADOS_COBRADOS = ["Pagado", "Enviado", "Entregado"]; // Solo estos cuentan como ingreso real
const CIUDADES_PERU = ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Cusco", "Piura", "Huancayo", "Ica", "Tacna", "Cajamarca", "Callao", "Huánuco", "Puno", "Chimbote", "Ayacucho"];
const WHATSAPP_NUM = "51934357309";

// Ofertas combo
const OFERTAS = [
  { cantidad: 3, precio: 120, label: "3 x S/ 120", ahorro: "Ahorras S/ 30" },
  { cantidad: 2, precio: 90, label: "2 x S/ 90", ahorro: "Ahorras S/ 10" },
];

const calcularTotalConOfertas = (items) => {
  const totalItems = items.reduce((s, it) => s + it.cantidad, 0);
  let remaining = totalItems;
  let total = 0;
  let ofertaAplicada = null;
  
  for (const oferta of OFERTAS) {
    const sets = Math.floor(remaining / oferta.cantidad);
    if (sets > 0) {
      total += sets * oferta.precio;
      remaining -= sets * oferta.cantidad;
      if (!ofertaAplicada) ofertaAplicada = { ...oferta, sets };
    }
  }
  if (remaining > 0) {
    total += remaining * 50;
  }
  
  const totalSinOferta = totalItems * 50;
  const descuento = totalSinOferta - total;
  
  return { total, totalSinOferta, descuento, ofertaAplicada, totalItems };
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
const formatCurrency = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const formatDate = (d) => new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
const formatDateTime = (d) => new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const today = new Date();
const isSameDay = (d1, d2) => new Date(d1).toDateString() === new Date(d2).toDateString();
const withinDays = (d, n) => (today - new Date(d)) / 86400000 <= n;
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const inMonth = (fecha, year, month) => { const d = new Date(fecha); return d.getFullYear() === year && d.getMonth() === month; };
const getAvailableYears = (ventas, compras) => {
  const all = [...ventas.map(v => new Date(v.fecha).getFullYear()), ...compras.map(c => new Date(c.fecha).getFullYear()), today.getFullYear()];
  return [...new Set(all)].sort((a, b) => b - a);
};

const DEFAULT_PRODUCTOS = [
  { id: "p1", nombre: "BOXYFIT Stylum Green", categoria: "BOXYFIT", precio: 50, costo: 18, sku: "STY-BF-GREEN", imagen: "💚", variantes: [{ talla: "S", color: "Verde Botella", stock: 0 }, { talla: "M", color: "Verde Botella", stock: 0 }, { talla: "L", color: "Verde Botella", stock: 0 }] },
  { id: "p2", nombre: "BOXYFIT White & Black", categoria: "BOXYFIT", precio: 50, costo: 18, sku: "STY-BF-WB", imagen: "🤍", variantes: [{ talla: "S", color: "Blanco y Negro", stock: 0 }, { talla: "M", color: "Blanco y Negro", stock: 0 }, { talla: "L", color: "Blanco y Negro", stock: 0 }] },
  { id: "p3", nombre: "BOXYFIT Stone Guinda", categoria: "BOXYFIT", precio: 50, costo: 18, sku: "STY-BF-GUINDA", imagen: "❤️", variantes: [{ talla: "S", color: "Guinda", stock: 0 }, { talla: "M", color: "Guinda", stock: 0 }, { talla: "L", color: "Guinda", stock: 0 }] },
];

// ═══════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════
const Badge = ({ children, variant = "default" }) => {
  const s = { default: "bg-neutral-800 text-neutral-300", success: "bg-emerald-950/80 text-emerald-400 border border-emerald-900", warning: "bg-amber-950/80 text-amber-400 border border-amber-900", danger: "bg-red-950/80 text-red-400 border border-red-900", info: "bg-sky-950/80 text-sky-400 border border-sky-900", neutral: "bg-neutral-900 text-neutral-400 border border-neutral-700", vip: "bg-yellow-950/80 text-yellow-400 border border-yellow-800" };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium tracking-wide uppercase ${s[variant]}`}>{children}</span>;
};
const estadoBadge = (e) => { const m = { Pendiente: "warning", Pagado: "info", Enviado: "neutral", Entregado: "success", Cancelado: "danger", "En tránsito": "warning", Recibido: "success" }; return <Badge variant={m[e] || "default"}>{e}</Badge>; };
const tipoBadge = (t) => { const m = { VIP: "vip", Frecuente: "success", Regular: "info", Nuevo: "neutral" }; return <Badge variant={m[t] || "default"}>{t}</Badge>; };

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col gap-3 hover:border-neutral-600 transition-all">
    <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center"><Icon size={18} className="text-neutral-400" /></div>
    <div><p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">{label}</p><p className="text-2xl font-light tracking-tight text-white">{value}</p></div>
    {sub && <p className="text-xs text-neutral-600">{sub}</p>}
  </div>
);

const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className={`relative bg-neutral-950 border border-neutral-800 rounded-2xl ${wide ? "max-w-3xl" : "max-w-lg"} w-full max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 sticky top-0 bg-neutral-950 z-10 rounded-t-2xl"><h3 className="text-base font-medium tracking-wide text-white">{title}</h3><button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors"><X size={18} /></button></div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (<div className="flex flex-col gap-1.5">{label && <label className="text-xs text-neutral-500 uppercase tracking-widest">{label}</label>}<input {...props} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors w-full" /></div>);
const Select = ({ label, options, ...props }) => (<div className="flex flex-col gap-1.5">{label && <label className="text-xs text-neutral-500 uppercase tracking-widest">{label}</label>}<select {...props} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors w-full appearance-none">{options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}</select></div>);

const Btn = ({ children, variant = "primary", size = "md", ...props }) => {
  const base = "font-medium tracking-wide uppercase transition-all duration-200 rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 whitespace-nowrap";
  const v = { primary: "bg-white text-black hover:bg-neutral-200", secondary: "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700", ghost: "text-neutral-400 hover:text-white hover:bg-neutral-800", danger: "bg-red-900/50 text-red-300 hover:bg-red-800/50 border border-red-800", whatsapp: "bg-emerald-700 text-white hover:bg-emerald-600" };
  const s = { sm: "text-xs px-3 py-1.5", md: "text-xs px-4 py-2.5", lg: "text-sm px-6 py-3" };
  return <button className={`${base} ${v[variant]} ${s[size]}`} {...props}>{children}</button>;
};

const EmptyState = ({ icon: Icon, title, sub, action, actionLabel }) => (<div className="flex flex-col items-center justify-center py-16 text-center"><div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4"><Icon size={24} className="text-neutral-600" /></div><p className="text-sm text-neutral-400 mb-1">{title}</p><p className="text-xs text-neutral-600 mb-4">{sub}</p>{action && <Btn size="sm" onClick={action}><Plus size={14} />{actionLabel}</Btn>}</div>);
const SearchBar = ({ value, onChange, placeholder }) => (<div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" /><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 w-full transition-colors" /></div>);
const Toast = ({ message, onClose }) => { useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []); return <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-2xl"><Check size={16} />{message}</div>; };

// Cloud sync status indicator
const SyncIndicator = ({ status }) => {
  const configs = {
    synced: { icon: Cloud, color: "text-emerald-400", bg: "bg-emerald-400", label: "Sincronizado", pulse: false },
    syncing: { icon: RefreshCw, color: "text-amber-400", bg: "bg-amber-400", label: "Guardando...", pulse: true },
    offline: { icon: CloudOff, color: "text-red-400", bg: "bg-red-400", label: "Sin conexión", pulse: false },
    local: { icon: WifiOff, color: "text-neutral-500", bg: "bg-neutral-500", label: "Solo local", pulse: false },
  };
  const c = configs[status] || configs.local;
  return (
    <div className="hidden sm:flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5" title={status === 'local' ? 'Configura Supabase para sincronizar en la nube' : c.label}>
      <div className={`w-2 h-2 rounded-full ${c.bg} ${c.pulse ? "animate-pulse" : ""}`} />
      <span className={`text-xs ${c.color}`}>{c.label}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════
// WHATSAPP & BOLETA
// ═══════════════════════════════════════════════
const generateWhatsAppLink = (venta, clienteTel) => {
  const items = venta.items.map(it => `• ${it.nombre} (${it.talla}) x${it.cantidad}`).join("\n");
  const descTxt = venta.descuento > 0 ? `\nOferta aplicada: -${formatCurrency(venta.descuento)} 🔥` : "";
  const msg = `¡Hola! 👋 Soy de *STYLUM* 🖤\n\nTu pedido:\n\n${items}${descTxt}\n\n*Total: ${formatCurrency(venta.total)}*\nPago: ${venta.metodoPago}\n\n¿Confirmamos? 🔥\nwww.stylum.pe`;
  const tel = clienteTel ? (clienteTel.startsWith("51") ? clienteTel : `51${clienteTel}`) : WHATSAPP_NUM;
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
};

const BoletaModal = ({ venta, onClose }) => {
  if (!venta) return null;
  
  const printBoleta = () => {
    const descuentoHtml = venta.descuento > 0 ? `
      <tr><td style="padding:8px 0;color:#999;border-top:1px solid #eee">Subtotal</td><td style="padding:8px 0;text-align:right;color:#999;border-top:1px solid #eee;text-decoration:line-through">${formatCurrency(venta.totalSinOferta || venta.total)}</td></tr>
      <tr class="discount"><td style="padding:4px 0">Descuento oferta</td><td style="padding:4px 0;text-align:right">- ${formatCurrency(venta.descuento)}</td></tr>` : '';
    
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Boleta STYLUM</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Syne',sans-serif;background:#f5f5f5;color:#111;display:flex;justify-content:center;padding:20px}
      .boleta{width:380px;background:#fff;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
      .header{padding:32px 24px 24px;text-align:center;border-bottom:1px solid #eee}
      .logo{font-size:28px;font-weight:700;letter-spacing:0.3em;color:#000;margin-bottom:4px}
      .tagline{font-size:9px;color:#999;letter-spacing:0.4em;text-transform:uppercase}
      .info{padding:20px 24px;border-bottom:1px solid #eee}
      .info-row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px}
      .info-label{color:#999}
      .info-value{color:#333;font-weight:500}
      .items{padding:20px 24px;border-bottom:1px solid #eee}
      .items-title{font-size:9px;color:#999;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:12px}
      .item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0}
      .item:last-of-type{border:none}
      .item-name{font-size:13px;color:#111;font-weight:500}
      .item-detail{font-size:10px;color:#999;margin-top:2px}
      .item-price{font-size:13px;color:#111;font-weight:600}
      .total-section{padding:20px 24px;border-bottom:1px solid #eee}
      .total-section table{width:100%}
      .total-section td{font-size:12px;padding:4px 0;color:#666}
      .total-row td{padding-top:12px !important;font-size:18px !important;font-weight:700 !important;color:#000 !important;border-top:2px solid #111}
      .discount td{color:#16a34a !important}
      .footer{padding:24px;text-align:center}
      .footer p{font-size:10px;color:#aaa;line-height:1.8}
      .footer .web{color:#666;letter-spacing:0.2em;font-weight:500}
      @media print{body{background:#fff;padding:0}@page{margin:10mm}.print-btn{display:none !important}.boleta{box-shadow:none;border:none}}
      .print-btn{position:fixed;bottom:20px;right:20px;background:#000;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-family:'Syne';font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer}
      .print-btn:hover{background:#333}
    </style></head><body>
    <div class="boleta">
      <div class="header">
        <div class="logo">STYLUM</div>
        <div class="tagline">Streetwear con actitud · Lima, Perú</div>
      </div>
      <div class="info">
        <div class="info-row"><span class="info-label">Boleta Nº</span><span class="info-value">${venta.id.slice(0,8).toUpperCase()}</span></div>
        <div class="info-row"><span class="info-label">Fecha</span><span class="info-value">${formatDateTime(venta.fecha)}</span></div>
        <div class="info-row"><span class="info-label">Cliente</span><span class="info-value">${venta.cliente}</span></div>
        <div class="info-row"><span class="info-label">Método de pago</span><span class="info-value">${venta.metodoPago}</span></div>
      </div>
      <div class="items">
        <div class="items-title">Detalle del pedido</div>
        ${venta.items.map(it => `<div class="item"><div><div class="item-name">${it.nombre}</div><div class="item-detail">Talla ${it.talla} · ${it.color} · x${it.cantidad}</div></div><div class="item-price">${formatCurrency(it.precio * it.cantidad)}</div></div>`).join('')}
      </div>
      <div class="total-section">
        <table>
          ${descuentoHtml}
          <tr class="total-row"><td style="padding:12px 0">TOTAL</td><td style="padding:12px 0;text-align:right">${formatCurrency(venta.total)}</td></tr>
        </table>
      </div>
      <div class="footer">
        <p class="web">www.stylum.pe</p>
        <p style="margin-top:8px">¡Gracias por tu compra! 🖤</p>
        <p style="margin-top:4px">@stylum.oficial · +51 934 357 309</p>
      </div>
    </div>
    <button class="print-btn" onclick="window.print()">Guardar PDF / Imprimir</button>
    </body></html>`;
    
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  return (
    <Modal open={true} onClose={onClose} title="Boleta de Venta">
      <div className="space-y-4">
        {/* Preview */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="text-center mb-3"><p className="text-lg font-bold tracking-[0.3em]">STYLUM</p><p className="text-[9px] text-neutral-600 uppercase tracking-[0.3em]">Boleta Nº {venta.id.slice(0,8).toUpperCase()}</p></div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-neutral-500">Cliente</span><span className="text-white">{venta.cliente}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Fecha</span><span className="text-white">{formatDateTime(venta.fecha)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Pago</span><span className="text-white">{venta.metodoPago}</span></div>
          </div>
          <div className="border-t border-neutral-800 pt-3 space-y-2">
            {venta.items.map((it, i) => <div key={i} className="flex justify-between text-xs"><span className="text-neutral-300">{it.nombre} · {it.talla} x{it.cantidad}</span><span className="text-white">{formatCurrency(it.precio * it.cantidad)}</span></div>)}
          </div>
          {venta.descuento > 0 && <div className="flex justify-between text-xs pt-2 border-t border-neutral-800"><span className="text-emerald-400">Descuento oferta</span><span className="text-emerald-400">- {formatCurrency(venta.descuento)}</span></div>}
          <div className="flex justify-between pt-2 border-t border-neutral-700"><span className="text-sm text-neutral-400">TOTAL</span><span className="text-lg font-medium text-white">{formatCurrency(venta.total)}</span></div>
        </div>
        <div className="flex gap-2">
          <Btn onClick={printBoleta}><FileText size={14} />Abrir PDF</Btn>
          <Btn variant="whatsapp" onClick={() => window.open(generateWhatsAppLink(venta, ""), "_blank")}><Send size={14} />WhatsApp</Btn>
        </div>
        <p className="text-xs text-neutral-600 text-center">Al abrir el PDF, usa "Guardar como PDF" en la ventana de impresión</p>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
const Dashboard = ({ ventas, productos, clientes, compras }) => {
  const [selYear, setSelYear] = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const years = getAvailableYears(ventas, compras);

  // Datos del mes seleccionado
  const vm = ventas.filter(v => inMonth(v.fecha, selYear, selMonth) && ESTADOS_COBRADOS.includes(v.estado));
  const vmAll = ventas.filter(v => inMonth(v.fecha, selYear, selMonth));
  const vPend = ventas.filter(v => inMonth(v.fecha, selYear, selMonth) && v.estado === "Pendiente");
  const im = vm.reduce((s, v) => s + v.total, 0);
  const pendienteTotal = vPend.reduce((s, v) => s + v.total, 0);
  
  // Hoy
  const vh = ventas.filter(v => isSameDay(v.fecha, today) && ESTADOS_COBRADOS.includes(v.estado));
  const ih = vh.reduce((s, v) => s + v.total, 0);
  
  const ts = productos.reduce((s, p) => s + p.variantes.reduce((ss, v) => ss + v.stock, 0), 0);
  const sc = []; const sn = [];
  productos.forEach(p => p.variantes.forEach(v => { if (v.stock === 0) sn.push({ ...v, producto: p.nombre }); else if (v.stock <= 3) sc.push({ ...v, producto: p.nombre }); }));
  const noData = ventas.length === 0;
  
  const egresosMes = compras.filter(c => inMonth(c.fecha, selYear, selMonth)).reduce((s, c) => s + c.costoTotal, 0);
  const gananciaReal = im - egresosMes;

  // Datos por día del mes seleccionado
  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const vpd = useMemo(() => {
    const weeks = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(selYear, selMonth, d);
      const weekLabel = `Sem ${Math.ceil(d / 7)}`;
      if (!weeks[weekLabel]) weeks[weekLabel] = 0;
      const dayVentas = ventas.filter(v => isSameDay(v.fecha, date) && ESTADOS_COBRADOS.includes(v.estado));
      weeks[weekLabel] += dayVentas.reduce((s, v) => s + v.total, 0);
    }
    return Object.entries(weeks).map(([dia, ingresos]) => ({ dia, ingresos }));
  }, [ventas, selYear, selMonth]);

  const pmv = useMemo(() => { const m = {}; vmAll.filter(v => v.estado !== "Cancelado").forEach(v => v.items.forEach(it => { m[it.nombre] = (m[it.nombre] || 0) + it.cantidad; })); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 22) + "…" : name, value })); }, [vmAll]);
  const vpm = useMemo(() => { const m = {}; vm.forEach(v => { m[v.metodoPago] = (m[v.metodoPago] || 0) + 1; }); return Object.entries(m).map(([name, value]) => ({ name, value })); }, [vm]);
  const CC = ["#fff", "#a0a0a0", "#606060", "#404040"];
  const isCurrentMonth = selYear === today.getFullYear() && selMonth === today.getMonth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-end justify-between gap-3">
        <div><h2 className="text-2xl font-light tracking-tight text-white">Dashboard</h2><p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">{today.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
        <div className="flex gap-2">
          <select value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white uppercase tracking-widest appearance-none">{MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
          <select value={selYear} onChange={e => setSelYear(parseInt(e.target.value))} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white tracking-widest appearance-none">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
        </div>
      </div>

      {noData && <div className="bg-neutral-900 border border-dashed border-neutral-700 rounded-xl p-6 flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0"><Zap size={20} className="text-amber-400" /></div><div><p className="text-sm text-white font-medium mb-1">¡Bienvenido a STYLUM CRM!</p><p className="text-xs text-neutral-400 leading-relaxed">Tu sistema está listo. Empieza registrando tu <strong>stock actual</strong> en Inventario. Tus datos se sincronizan en la nube automáticamente. 🔥</p></div></div>}

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3"><Tag size={16} className="text-emerald-400" /><span className="text-sm text-neutral-300">Ofertas activas:</span></div>
        <div className="flex gap-3">{OFERTAS.map(o => <span key={o.cantidad} className="text-xs bg-emerald-950/50 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-lg">{o.label}</span>)}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isCurrentMonth && <StatCard icon={DollarSign} label="Hoy" value={formatCurrency(ih)} sub={`${vh.length} ventas cobradas`} />}
        <StatCard icon={TrendingUp} label={`${MESES[selMonth]} ${selYear}`} value={formatCurrency(im)} sub={`${vm.length} ventas cobradas`} />
        <StatCard icon={Clock} label="Pendientes" value={formatCurrency(pendienteTotal)} sub={`${vPend.length} por cobrar`} />
        <StatCard icon={Package} label="Stock Total" value={ts} sub={`${sc.length} bajo stock`} />
        {!isCurrentMonth && <StatCard icon={Users} label="Clientes" value={clientes.length} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Ingresos — {MESES[selMonth]}</h3><span className="text-lg font-light text-white">{formatCurrency(im)}</span></div>
          {vm.length === 0 ? <div className="flex items-center justify-center h-48 text-neutral-600 text-xs uppercase tracking-widest">Sin ventas este mes</div> :
          <ResponsiveContainer width="100%" height={220}><AreaChart data={vpd}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0.15} /><stop offset="100%" stopColor="#fff" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#262626" /><XAxis dataKey="dia" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `S/${v}`} /><Tooltip contentStyle={{ background: "#171717", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} formatter={v => [formatCurrency(v), "Ingresos"]} /><Area type="monotone" dataKey="ingresos" stroke="#fff" strokeWidth={2} fill="url(#g)" /></AreaChart></ResponsiveContainer>}
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">Métodos de Pago</h3>
          {vpm.length === 0 ? <div className="flex items-center justify-center h-48 text-neutral-600 text-xs">—</div> : <><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={vpm} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">{vpm.map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}</Pie><Tooltip contentStyle={{ background: "#171717", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="flex flex-wrap gap-3 mt-2 justify-center">{vpm.map((m, i) => <span key={m.name} className="flex items-center gap-1.5 text-xs text-neutral-400"><span className="w-2 h-2 rounded-full" style={{ background: CC[i % CC.length] }} />{m.name}</span>)}</div></>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">Más Vendidos — {MESES[selMonth]}</h3>
          {pmv.length === 0 ? <div className="py-8 text-center text-xs text-neutral-600">Sin ventas este mes</div> :
          <ResponsiveContainer width="100%" height={180}><BarChart data={pmv} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} /><XAxis type="number" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fill: "#999", fontSize: 10 }} axisLine={false} tickLine={false} width={140} /><Tooltip contentStyle={{ background: "#171717", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} /><Bar dataKey="value" fill="#fff" radius={[0, 4, 4, 0]} barSize={14} /></BarChart></ResponsiveContainer>}
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">Resumen {MESES[selMonth]} {selYear}</h3>
          <div className="space-y-3">
            {[["Ingresos cobrados", formatCurrency(im), "text-white"], ["Pendientes de cobro", formatCurrency(pendienteTotal), "text-amber-400"], ["Egresos del mes", `- ${formatCurrency(egresosMes)}`, "text-red-400"], ["Utilidad real", formatCurrency(gananciaReal), gananciaReal >= 0 ? "text-emerald-400" : "text-red-400"]].map(([l, v, c]) => (
              <div key={l} className="flex items-center justify-between py-2.5 border-b border-neutral-800 last:border-0"><span className="text-sm text-neutral-500">{l}</span><span className={`text-sm font-medium ${c}`}>{v}</span></div>
            ))}
          </div>
        </div>
      </div>

      {(sc.length > 0 || sn.length > 0) && <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-5"><div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-amber-400" /><h3 className="text-sm font-medium text-amber-400 uppercase tracking-widest">Alertas Stock</h3></div><div className="space-y-2">{sn.map((v, i) => <div key={`n${i}`} className="flex items-center justify-between py-1.5 text-xs"><span className="text-neutral-300">{v.producto} — {v.talla} / {v.color}</span><Badge variant="danger">Sin stock</Badge></div>)}{sc.map((v, i) => <div key={`c${i}`} className="flex items-center justify-between py-1.5 text-xs"><span className="text-neutral-300">{v.producto} — {v.talla} / {v.color}</span><Badge variant="warning">{v.stock} uds</Badge></div>)}</div></div>}
    </div>
  );
};

// ═══════════════════════════════════════════════
// VENTAS
// ═══════════════════════════════════════════════
const VentasModule = ({ ventas, setVentas, productos, setProductos, clientes, setClientes, kardex, setKardex }) => {
  const [search, setSearch] = useState(""); const [filtro, setFiltro] = useState("Todos"); const [showModal, setShowModal] = useState(false); const [showDetalle, setShowDetalle] = useState(null); const [showBoleta, setShowBoleta] = useState(null); const [toast, setToast] = useState("");
  const [form, setForm] = useState({ clienteId: "", clienteNuevo: "", telefonoNuevo: "", ciudadNuevo: "Lima", items: [], metodoPago: "Yape", notas: "" });
  const [itemForm, setItemForm] = useState({ productoId: "", talla: "", color: "", cantidad: 1 });
  const [modoCliente, setModoCliente] = useState("existente");
  const filtered = ventas.filter(v => (v.cliente.toLowerCase().includes(search.toLowerCase()) || v.id.includes(search)) && (filtro === "Todos" || v.estado === filtro)).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const addItem = () => { const prod = productos.find(p => p.id === itemForm.productoId); if (!prod || !itemForm.talla || !itemForm.color) return; const vr = prod.variantes.find(v => v.talla === itemForm.talla && v.color === itemForm.color); if (!vr || vr.stock < itemForm.cantidad) return; setForm(f => ({ ...f, items: [...f.items, { ...itemForm, nombre: prod.nombre, precio: prod.precio }] })); setItemForm({ productoId: "", talla: "", color: "", cantidad: 1 }); };

  const crearVenta = () => {
    let cId, cNombre, cTel;
    if (modoCliente === "nuevo" && form.clienteNuevo) { const nc = { id: generateId(), nombre: form.clienteNuevo, telefono: form.telefonoNuevo, ciudad: form.ciudadNuevo, instagram: "", tipo: "Nuevo", totalCompras: 0, totalGastado: 0, fechaRegistro: new Date().toISOString() }; setClientes(p => [nc, ...p]); cId = nc.id; cNombre = nc.nombre; cTel = nc.telefono; }
    else { const cl = clientes.find(c => c.id === form.clienteId); if (!cl) return; cId = cl.id; cNombre = cl.nombre; cTel = cl.telefono; }
    if (form.items.length === 0) return;
    const calc = calcularTotalConOfertas(form.items);
    const nv = { id: generateId(), clienteId: cId, cliente: cNombre, items: form.items, total: calc.total, totalSinOferta: calc.totalSinOferta, descuento: calc.descuento, estado: "Pendiente", metodoPago: form.metodoPago, fecha: new Date().toISOString(), notas: form.notas };
    setVentas(p => [nv, ...p]);
    const np = JSON.parse(JSON.stringify(productos));
    form.items.forEach(it => { const pi = np.findIndex(p => p.id === it.productoId); if (pi >= 0) { const vi = np[pi].variantes.findIndex(v => v.talla === it.talla && v.color === it.color); if (vi >= 0) np[pi].variantes[vi].stock = Math.max(0, np[pi].variantes[vi].stock - it.cantidad); } });
    setProductos(np);
    form.items.forEach(it => { setKardex(p => [{ id: generateId(), tipo: "Salida", producto: it.nombre, cantidad: it.cantidad, fecha: new Date().toISOString(), referencia: `Venta ${nv.id.slice(0,6)}`, nota: `${cNombre} — ${it.talla}` }, ...p]); });
    setClientes(p => p.map(c => c.id === cId ? { ...c, totalCompras: c.totalCompras + 1, totalGastado: c.totalGastado + calc.total } : c));
    setForm({ clienteId: "", clienteNuevo: "", telefonoNuevo: "", ciudadNuevo: "Lima", items: [], metodoPago: "Yape", notas: "" }); setShowModal(false); setToast("¡Venta registrada!");
    setTimeout(() => window.open(generateWhatsAppLink(nv, cTel), "_blank"), 500);
  };
  const cambiarEstado = (id, ne) => {
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;
    // Si se cancela, devolver stock
    if (ne === "Cancelado" && venta.estado !== "Cancelado") {
      const np = JSON.parse(JSON.stringify(productos));
      venta.items.forEach(it => {
        const pi = np.findIndex(p => p.id === it.productoId);
        if (pi >= 0) { const vi = np[pi].variantes.findIndex(v => v.talla === it.talla && v.color === it.color); if (vi >= 0) np[pi].variantes[vi].stock += it.cantidad; }
      });
      setProductos(np);
      venta.items.forEach(it => { setKardex(p => [{ id: generateId(), tipo: "Entrada", producto: it.nombre, cantidad: it.cantidad, fecha: new Date().toISOString(), referencia: `Cancelación ${id.slice(0,6)}`, nota: "Venta cancelada — stock devuelto" }, ...p]); });
    }
    setVentas(p => p.map(v => v.id === id ? { ...v, estado: ne } : v));
  };
  const sp = productos.find(p => p.id === itemForm.productoId);
  const at = sp ? [...new Set(sp.variantes.filter(v => v.stock > 0).map(v => v.talla))] : [];
  const ac = sp && itemForm.talla ? sp.variantes.filter(v => v.talla === itemForm.talla && v.stock > 0).map(v => v.color) : [];

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"><div><h2 className="text-2xl font-light tracking-tight text-white">Ventas</h2><p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">{ventas.length} registros</p></div><Btn onClick={() => setShowModal(true)}><Plus size={14} /> Nueva Venta</Btn></div>
      <div className="flex flex-col sm:flex-row gap-3"><div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Buscar cliente..." /></div><Select value={filtro} onChange={e => setFiltro(e.target.value)} options={["Todos", ...ESTADOS_VENTA]} /></div>
      {ventas.length === 0 ? <EmptyState icon={ShoppingCart} title="Sin ventas aún" sub="Registra tu primera venta" action={() => setShowModal(true)} actionLabel="Nueva Venta" /> :
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-neutral-800">{["Cliente","Productos","Total","Estado","Pago","Fecha",""].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-neutral-500 uppercase tracking-widest font-medium">{h}</th>)}</tr></thead><tbody>{filtered.map(v=>(<tr key={v.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"><td className="px-4 py-3 text-white">{v.cliente}</td><td className="px-4 py-3 text-neutral-400 text-xs">{v.items.map(i=>i.nombre.replace("BOXYFIT ","")).join(", ")}</td><td className="px-4 py-3 text-white font-medium">{formatCurrency(v.total)}{v.descuento > 0 && <span className="ml-1 text-emerald-400 text-xs">-{formatCurrency(v.descuento)}</span>}</td><td className="px-4 py-3">{estadoBadge(v.estado)}</td><td className="px-4 py-3 text-neutral-400">{v.metodoPago}</td><td className="px-4 py-3 text-neutral-500 text-xs">{formatDateTime(v.fecha)}</td><td className="px-4 py-3"><div className="flex gap-1"><button onClick={()=>setShowDetalle(v)} className="p-1.5 text-neutral-500 hover:text-white"><Eye size={14}/></button><button onClick={()=>setShowBoleta(v)} className="p-1.5 text-neutral-500 hover:text-white"><FileText size={14}/></button><button onClick={()=>window.open(generateWhatsAppLink(v,clientes.find(c=>c.id===v.clienteId)?.telefono||""),"_blank")} className="p-1.5 text-neutral-500 hover:text-emerald-400"><Send size={14}/></button></div></td></tr>))}</tbody></table></div></div>}

      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Nueva Venta" wide><div className="space-y-4">
        <div className="flex gap-2 mb-1">{["existente","nuevo"].map(m=><button key={m} onClick={()=>setModoCliente(m)} className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest transition-all ${modoCliente===m?"bg-white text-black":"bg-neutral-800 text-neutral-400"}`}>{m==="existente"?"Cliente existente":"Nuevo cliente"}</button>)}</div>
        {modoCliente==="existente"?<Select label="Cliente" value={form.clienteId} onChange={e=>setForm({...form,clienteId:e.target.value})} options={[{value:"",label:"Seleccionar..."},...clientes.map(c=>({value:c.id,label:`${c.nombre} — ${c.ciudad}`}))]}/>:<div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Input label="Nombre" value={form.clienteNuevo} onChange={e=>setForm({...form,clienteNuevo:e.target.value})}/><Input label="Teléfono" value={form.telefonoNuevo} onChange={e=>setForm({...form,telefonoNuevo:e.target.value})} placeholder="9XXXXXXXX"/><Select label="Ciudad" value={form.ciudadNuevo} onChange={e=>setForm({...form,ciudadNuevo:e.target.value})} options={CIUDADES_PERU}/></div>}
        <div className="border border-neutral-800 rounded-lg p-4 space-y-3"><p className="text-xs text-neutral-500 uppercase tracking-widest">Productos</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Select label="Producto" value={itemForm.productoId} onChange={e=>setItemForm({...itemForm,productoId:e.target.value,talla:"",color:""})} options={[{value:"",label:"Elegir..."},...productos.map(p=>({value:p.id,label:`${p.imagen} ${p.nombre}`}))]}/><Select label="Talla" value={itemForm.talla} onChange={e=>setItemForm({...itemForm,talla:e.target.value,color:""})} options={[{value:"",label:"—"},...at.map(t=>({value:t,label:t}))]}/><Select label="Color" value={itemForm.color} onChange={e=>setItemForm({...itemForm,color:e.target.value})} options={[{value:"",label:"—"},...ac.map(c=>({value:c,label:c}))]}/><div className="flex items-end"><Btn variant="secondary" onClick={addItem}><Plus size={14}/></Btn></div></div>
          {sp&&itemForm.talla&&itemForm.color&&(()=>{const vr=sp.variantes.find(v=>v.talla===itemForm.talla&&v.color===itemForm.color);return vr?<p className="text-xs text-neutral-500">Stock: <span className={vr.stock<=3?"text-amber-400":"text-emerald-400"}>{vr.stock}</span></p>:null;})()}
          {form.items.length>0&&<div className="mt-3 space-y-2">{form.items.map((it,i)=><div key={i} className="flex items-center justify-between bg-neutral-800 rounded-lg px-3 py-2 text-sm"><span className="text-neutral-300">{it.nombre} — {it.talla}</span><div className="flex items-center gap-3"><span className="text-white">{formatCurrency(it.precio)}</span><button onClick={()=>setForm(f=>({...f,items:f.items.filter((_,j)=>j!==i)}))} className="text-neutral-500 hover:text-red-400"><X size={14}/></button></div></div>)}
            {(() => { const calc = calcularTotalConOfertas(form.items); return (<div className="pt-3 border-t border-neutral-700 space-y-2">
              {calc.descuento > 0 && <div className="flex justify-between text-xs"><span className="text-neutral-500">Subtotal ({calc.totalItems} polos)</span><span className="text-neutral-500 line-through">{formatCurrency(calc.totalSinOferta)}</span></div>}
              {calc.descuento > 0 && <div className="flex justify-between text-xs"><span className="text-emerald-400">🔥 Oferta aplicada</span><span className="text-emerald-400">- {formatCurrency(calc.descuento)}</span></div>}
              <div className="flex justify-between items-center"><span className="text-sm text-neutral-400">Total</span><span className="text-white font-medium text-lg">{formatCurrency(calc.total)}</span></div>
              {calc.totalItems === 1 && <p className="text-xs text-amber-400/80 text-center">💡 Agrega 1 polo más y aplica oferta 2 x S/ 90</p>}
              {calc.totalItems === 2 && calc.descuento > 0 && <p className="text-xs text-emerald-400/80 text-center">✅ Oferta 2 x S/ 90 aplicada · Agrega 1 más para 3 x S/ 120</p>}
              {calc.totalItems >= 3 && calc.descuento > 0 && <p className="text-xs text-emerald-400/80 text-center">✅ Oferta 3 x S/ 120 aplicada</p>}
            </div>); })()}
          </div>}
        </div>
        <div className="grid grid-cols-2 gap-3"><Select label="Método de Pago" value={form.metodoPago} onChange={e=>setForm({...form,metodoPago:e.target.value})} options={METODOS_PAGO}/><Input label="Notas" value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Opcional..."/></div>
        <div className="bg-neutral-800/50 rounded-lg p-3 flex items-center gap-2 text-xs text-neutral-400"><Send size={14} className="text-emerald-400 flex-shrink-0"/>Se abrirá WhatsApp para enviar resumen al cliente</div>
        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800"><Btn variant="secondary" onClick={()=>setShowModal(false)}>Cancelar</Btn><Btn onClick={crearVenta} disabled={(modoCliente==="existente"&&!form.clienteId)||(modoCliente==="nuevo"&&!form.clienteNuevo)||form.items.length===0}><ShoppingCart size={14}/> Registrar</Btn></div>
      </div></Modal>

      <Modal open={!!showDetalle} onClose={()=>setShowDetalle(null)} title={`Venta — ${showDetalle?.cliente||""}`} wide>{showDetalle&&<div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">{[["Cliente",showDetalle.cliente],["Fecha",formatDateTime(showDetalle.fecha)],["Pago",showDetalle.metodoPago]].map(([l,v])=><div key={l}><span className="text-neutral-500">{l}:</span><span className="text-white ml-2">{v}</span></div>)}<div><span className="text-neutral-500">Estado:</span><span className="ml-2">{estadoBadge(showDetalle.estado)}</span></div></div>
        <div className="border border-neutral-800 rounded-lg overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-neutral-800">{["Producto","Talla","Color","Precio"].map(h=><th key={h} className="text-left px-4 py-2 text-xs text-neutral-500 uppercase tracking-widest">{h}</th>)}</tr></thead><tbody>{showDetalle.items.map((it,i)=><tr key={i} className="border-b border-neutral-800/50"><td className="px-4 py-2 text-white">{it.nombre}</td><td className="px-4 py-2 text-neutral-400">{it.talla}</td><td className="px-4 py-2 text-neutral-400">{it.color}</td><td className="px-4 py-2 text-white">{formatCurrency(it.precio)}</td></tr>)}</tbody></table></div>
        <div className="flex justify-between items-center"><span className="text-neutral-500">Total</span><span className="text-xl font-light text-white">{formatCurrency(showDetalle.total)}</span></div>
        {showDetalle.descuento > 0 && <div className="flex justify-between items-center text-xs"><span className="text-emerald-400">🔥 Oferta aplicada</span><span className="text-emerald-400">Ahorraste {formatCurrency(showDetalle.descuento)}</span></div>}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-800"><p className="text-xs text-neutral-500 uppercase tracking-widest w-full mb-1">Cambiar estado:</p>{ESTADOS_VENTA.filter(e=>e!==showDetalle.estado).map(e=><Btn key={e} variant="secondary" size="sm" onClick={()=>{cambiarEstado(showDetalle.id,e);setShowDetalle({...showDetalle,estado:e});setToast(`Estado → ${e}`);}}>{e}</Btn>)}</div>
        <div className="flex gap-2 pt-3 border-t border-neutral-800"><Btn variant="secondary" size="sm" onClick={()=>{setShowDetalle(null);setShowBoleta(showDetalle);}}><FileText size={14}/>Boleta</Btn><Btn variant="whatsapp" size="sm" onClick={()=>window.open(generateWhatsAppLink(showDetalle,clientes.find(c=>c.id===showDetalle.clienteId)?.telefono||""),"_blank")}><Send size={14}/>WhatsApp</Btn></div>
      </div>}</Modal>
      {showBoleta&&<BoletaModal venta={showBoleta} onClose={()=>setShowBoleta(null)}/>}
    </div>
  );
};

// ═══════════════════════════════════════════════
// INVENTARIO
// ═══════════════════════════════════════════════
const InventarioModule = ({ productos, setProductos, kardex, setKardex }) => {
  const [expandedId, setExpandedId] = useState(null); const [showKardex, setShowKardex] = useState(false); const [showStock, setShowStock] = useState(null); const [showModal, setShowModal] = useState(false); const [toast, setToast] = useState(""); const [stockEdit, setStockEdit] = useState({});
  const [form, setForm] = useState({ nombre: "", categoria: "BOXYFIT", precio: "50", costo: "18", sku: "", variantes: [{ talla: "M", color: "Verde Botella", stock: 0 }] });

  const openStockModal = (p) => { const se = {}; p.variantes.forEach((v, i) => { se[i] = v.stock; }); setStockEdit(se); setShowStock(p); };
  const guardarStock = () => {
    if (!showStock) return;
    const old = showStock.variantes.map(v => v.stock);
    setProductos(prev => prev.map(p => { if (p.id !== showStock.id) return p; return { ...p, variantes: p.variantes.map((v, i) => ({ ...v, stock: parseInt(stockEdit[i]) || 0 })) }; }));
    showStock.variantes.forEach((v, i) => { const diff = (parseInt(stockEdit[i]) || 0) - old[i]; if (diff !== 0) setKardex(prev => [{ id: generateId(), tipo: diff > 0 ? "Entrada" : "Salida", producto: showStock.nombre, cantidad: Math.abs(diff), fecha: new Date().toISOString(), referencia: "Ajuste manual", nota: `${v.talla} / ${v.color}` }, ...prev]); });
    setShowStock(null); setToast("Stock actualizado y sincronizado ☁️");
  };
  const crearProducto = () => {
    if (!form.nombre || !form.precio) return;
    const np = { id: generateId(), nombre: form.nombre, categoria: form.categoria, precio: parseFloat(form.precio), costo: parseFloat(form.costo) || 0, sku: form.sku || `STY-${generateId().slice(0, 5).toUpperCase()}`, imagen: "🖤", variantes: form.variantes.map(v => ({ ...v, stock: parseInt(v.stock) || 0 })) };
    setProductos(prev => [...prev, np]); const ti = np.variantes.reduce((s, v) => s + v.stock, 0);
    if (ti > 0) setKardex(prev => [{ id: generateId(), tipo: "Entrada", producto: np.nombre, cantidad: ti, fecha: new Date().toISOString(), referencia: "Stock inicial", nota: "Nuevo producto" }, ...prev]);
    setForm({ nombre: "", categoria: "BOXYFIT", precio: "50", costo: "18", sku: "", variantes: [{ talla: "M", color: "Verde Botella", stock: 0 }] }); setShowModal(false); setToast("Producto creado");
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"><div><h2 className="text-2xl font-light tracking-tight text-white">Inventario</h2><p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">{productos.length} productos · {productos.reduce((s, p) => s + p.variantes.reduce((ss, v) => ss + v.stock, 0), 0)} uds</p></div><div className="flex gap-2"><Btn variant="secondary" onClick={() => setShowKardex(true)}><ClipboardList size={14} /> Kardex</Btn><Btn onClick={() => setShowModal(true)}><Plus size={14} /> Nuevo</Btn></div></div>
      <div className="space-y-3">{productos.map(p => { const ts = p.variantes.reduce((s, v) => s + v.stock, 0); return (<div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors"><div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}><div className="flex items-center gap-4"><span className="text-2xl">{p.imagen}</span><div><p className="text-sm text-white font-medium">{p.nombre}</p><p className="text-xs text-neutral-500">{p.sku}</p></div></div><div className="flex items-center gap-4"><div className="text-right hidden sm:block"><p className="text-sm text-white">{formatCurrency(p.precio)}</p><p className="text-xs text-neutral-500">Costo: {formatCurrency(p.costo)}</p></div><p className={`text-sm font-medium ${ts === 0 ? "text-red-400" : ts <= 5 ? "text-amber-400" : "text-white"}`}>{ts} uds</p><ChevronDown size={16} className={`text-neutral-500 transition-transform ${expandedId === p.id ? "rotate-180" : ""}`} /></div></div>
        {expandedId === p.id && <div className="border-t border-neutral-800 p-4"><div className="grid grid-cols-3 gap-2 mb-3">{p.variantes.map((v, i) => <div key={i} className={`rounded-lg p-3 text-center ${v.stock === 0 ? "bg-red-950/30 border border-red-900/40" : v.stock <= 3 ? "bg-amber-950/30 border border-amber-900/40" : "bg-neutral-800 border border-neutral-700"}`}><p className="text-xs text-neutral-400">{v.talla} / {v.color}</p><p className={`text-lg font-light mt-1 ${v.stock === 0 ? "text-red-400" : v.stock <= 3 ? "text-amber-400" : "text-white"}`}>{v.stock}</p></div>)}</div><div className="flex items-center justify-between pt-3 border-t border-neutral-800"><span className="text-xs text-neutral-500">Margen: {formatCurrency(p.precio - p.costo)} ({((p.precio - p.costo) / p.precio * 100).toFixed(0)}%)</span><div className="flex gap-2"><Btn variant="danger" size="sm" onClick={e => { e.stopPropagation(); if(confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) { setProductos(prev => prev.filter(pr => pr.id !== p.id)); setToast("Producto eliminado"); } }}><Trash2 size={12} /> Eliminar</Btn><Btn variant="secondary" size="sm" onClick={e => { e.stopPropagation(); openStockModal(p); }}><Edit2 size={12} /> Editar Stock</Btn></div></div></div>}
      </div>); })}</div>

      <Modal open={!!showStock} onClose={() => setShowStock(null)} title={`Stock — ${showStock?.nombre || ""}`}>{showStock && <div className="space-y-4"><p className="text-xs text-neutral-500">Ingresa stock actual. Se sincroniza automáticamente en la nube.</p><div className="space-y-3">{showStock.variantes.map((v, i) => <div key={i} className="flex items-center justify-between bg-neutral-800 rounded-lg px-4 py-3"><span className="text-sm text-neutral-300">{v.talla} / {v.color}</span><div className="flex items-center gap-2"><span className="text-xs text-neutral-600">Actual: {v.stock}</span><input type="number" min="0" value={stockEdit[i] ?? v.stock} onChange={e => setStockEdit({ ...stockEdit, [i]: e.target.value })} className="w-20 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-white" /></div></div>)}</div><div className="flex justify-end gap-3 pt-3 border-t border-neutral-800"><Btn variant="secondary" onClick={() => setShowStock(null)}>Cancelar</Btn><Btn onClick={guardarStock}><Save size={14} /> Guardar</Btn></div></div>}</Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Producto" wide><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Input label="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="BOXYFIT Night" /><Input label="Categoría" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} /></div><div className="grid grid-cols-3 gap-3"><Input label="Precio (S/)" type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} /><Input label="Costo (S/)" type="number" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} /><Input label="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Auto" /></div>
        <div className="border border-neutral-800 rounded-lg p-4 space-y-3"><div className="flex items-center justify-between"><p className="text-xs text-neutral-500 uppercase tracking-widest">Variantes</p><Btn variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, variantes: [...f.variantes, { talla: "M", color: "Verde Botella", stock: 0 }] }))}><Plus size={12} /></Btn></div>{form.variantes.map((v, i) => <div key={i} className="grid grid-cols-4 gap-2 items-end"><Select label={i===0?"Talla":undefined} value={v.talla} onChange={e=>{const nv=[...form.variantes];nv[i].talla=e.target.value;setForm({...form,variantes:nv});}} options={TALLAS}/><Select label={i===0?"Color":undefined} value={v.color} onChange={e=>{const nv=[...form.variantes];nv[i].color=e.target.value;setForm({...form,variantes:nv});}} options={COLORES_POLO}/><Input label={i===0?"Stock":undefined} type="number" value={v.stock} onChange={e=>{const nv=[...form.variantes];nv[i].stock=e.target.value;setForm({...form,variantes:nv});}}/><button onClick={()=>setForm(f=>({...f,variantes:f.variantes.filter((_,j)=>j!==i)}))} className="p-2 text-neutral-500 hover:text-red-400"><X size={14}/></button></div>)}</div>
        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800"><Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn><Btn onClick={crearProducto} disabled={!form.nombre || !form.precio}>Crear</Btn></div></div></Modal>

      <Modal open={showKardex} onClose={() => setShowKardex(false)} title="Kardex" wide>{kardex.length === 0 ? <EmptyState icon={ClipboardList} title="Kardex vacío" sub="Los movimientos se registran automáticamente" /> : <div className="space-y-2">{kardex.map(k => <div key={k.id} className="flex items-center justify-between bg-neutral-800 rounded-lg px-4 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.tipo === "Entrada" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>{k.tipo === "Entrada" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}</div><div><p className="text-sm text-white">{k.producto}</p><p className="text-xs text-neutral-500">{k.referencia} · {k.nota}</p></div></div><div className="text-right"><p className={`text-sm font-medium ${k.tipo === "Entrada" ? "text-emerald-400" : "text-red-400"}`}>{k.tipo === "Entrada" ? "+" : "-"}{k.cantidad}</p><p className="text-xs text-neutral-500">{formatDate(k.fecha)}</p></div></div>)}</div>}</Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════
const ClientesModule = ({ clientes, setClientes, ventas }) => {
  const [search, setSearch] = useState(""); const [filtro, setFiltro] = useState("Todos"); const [showModal, setShowModal] = useState(false); const [showDetalle, setShowDetalle] = useState(null); const [toast, setToast] = useState("");
  const [form, setForm] = useState({ nombre: "", telefono: "", ciudad: "Lima", instagram: "", tipo: "Nuevo" });
  const filtered = clientes.filter(c => (c.nombre.toLowerCase().includes(search.toLowerCase()) || c.telefono.includes(search)) && (filtro === "Todos" || c.tipo === filtro));
  const crearCliente = () => { if (!form.nombre) return; setClientes(p => [{ id: generateId(), ...form, totalCompras: 0, totalGastado: 0, fechaRegistro: new Date().toISOString() }, ...p]); setForm({ nombre: "", telefono: "", ciudad: "Lima", instagram: "", tipo: "Nuevo" }); setShowModal(false); setToast("Cliente agregado"); };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"><div><h2 className="text-2xl font-light tracking-tight text-white">Clientes</h2><p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">{clientes.length} registrados</p></div><Btn onClick={() => setShowModal(true)}><UserPlus size={14} /> Nuevo</Btn></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{["VIP","Frecuente","Regular","Nuevo"].map(t=><div key={t} onClick={()=>setFiltro(filtro===t?"Todos":t)} className={`bg-neutral-900 border rounded-xl p-4 cursor-pointer transition-all ${filtro===t?"border-white":"border-neutral-800 hover:border-neutral-700"}`}><p className="text-xs text-neutral-500 uppercase tracking-widest">{t}</p><p className="text-xl font-light text-white mt-1">{clientes.filter(c=>c.tipo===t).length}</p></div>)}</div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar cliente..." />
      {clientes.length === 0 ? <EmptyState icon={Users} title="Sin clientes" sub="Se crean automáticamente al registrar ventas" action={() => setShowModal(true)} actionLabel="Nuevo Cliente" /> :
      <div className="space-y-2">{filtered.map(c=><div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between hover:border-neutral-700 transition-colors cursor-pointer" onClick={()=>setShowDetalle(c)}><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-medium text-white">{c.nombre.split(" ").map(n=>n[0]).join("").slice(0,2)}</div><div><p className="text-sm text-white font-medium">{c.nombre}</p><div className="flex items-center gap-3 mt-0.5"><span className="text-xs text-neutral-500 flex items-center gap-1"><Phone size={10}/>{c.telefono||"—"}</span><span className="text-xs text-neutral-500 flex items-center gap-1"><MapPin size={10}/>{c.ciudad}</span></div></div></div><div className="flex items-center gap-4">{tipoBadge(c.tipo)}<div className="text-right hidden sm:block"><p className="text-sm text-white">{formatCurrency(c.totalGastado)}</p><p className="text-xs text-neutral-500">{c.totalCompras} compras</p></div><ChevronRight size={16} className="text-neutral-600"/></div></div>)}</div>}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Cliente"><div className="space-y-3"><Input label="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /><div className="grid grid-cols-2 gap-3"><Input label="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="9XXXXXXXX" /><Select label="Ciudad" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} options={CIUDADES_PERU} /></div><Input label="Instagram" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" /><div className="flex justify-end gap-3 pt-3 border-t border-neutral-800"><Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn><Btn onClick={crearCliente} disabled={!form.nombre}>Crear</Btn></div></div></Modal>

      <Modal open={!!showDetalle} onClose={() => setShowDetalle(null)} title={showDetalle?.nombre || ""} wide>{showDetalle && <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[["Compras",showDetalle.totalCompras],["Gastado",formatCurrency(showDetalle.totalGastado)],["Ticket prom.",formatCurrency(showDetalle.totalCompras>0?showDetalle.totalGastado/showDetalle.totalCompras:0)]].map(([l,v])=><div key={l} className="bg-neutral-800 rounded-lg p-3 text-center"><p className="text-xs text-neutral-500">{l}</p><p className="text-lg font-light text-white mt-1">{v}</p></div>)}<div className="bg-neutral-800 rounded-lg p-3 text-center"><p className="text-xs text-neutral-500 mb-2">Tipo</p><div className="flex flex-wrap gap-1 justify-center">{["Nuevo","Regular","Frecuente","VIP"].map(t=><button key={t} onClick={()=>{setClientes(p=>p.map(c=>c.id===showDetalle.id?{...c,tipo:t}:c));setShowDetalle({...showDetalle,tipo:t});setToast(`Cliente → ${t}`);}} className={`px-2 py-0.5 rounded text-xs transition-all ${showDetalle.tipo===t?"bg-white text-black font-medium":"bg-neutral-700 text-neutral-400 hover:bg-neutral-600"}`}>{t}</button>)}</div></div></div>
        <div className="grid grid-cols-2 gap-3 text-sm"><div className="flex items-center gap-2 text-neutral-400"><Phone size={14}/>{showDetalle.telefono||"—"}</div><div className="flex items-center gap-2 text-neutral-400"><MapPin size={14}/>{showDetalle.ciudad}</div>{showDetalle.instagram&&<div className="flex items-center gap-2 text-neutral-400"><Hash size={14}/>{showDetalle.instagram}</div>}<div className="flex items-center gap-2 text-neutral-400"><Calendar size={14}/>{formatDate(showDetalle.fechaRegistro)}</div></div>
        {showDetalle.telefono&&<Btn variant="whatsapp" size="sm" onClick={()=>window.open(`https://wa.me/51${showDetalle.telefono}?text=${encodeURIComponent("¡Hola! 👋 Soy de STYLUM 🖤")}`,"_blank")}><Send size={14}/>WhatsApp</Btn>}
        <div><p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Historial</p>{ventas.filter(v=>v.clienteId===showDetalle.id).length===0?<p className="text-xs text-neutral-600 py-4 text-center">Sin compras</p>:<div className="space-y-2">{ventas.filter(v=>v.clienteId===showDetalle.id).map(v=><div key={v.id} className="flex items-center justify-between bg-neutral-800 rounded-lg px-4 py-3"><div><p className="text-sm text-white">{v.items.map(it=>it.nombre).join(", ")}</p><p className="text-xs text-neutral-500">{formatDate(v.fecha)}</p></div><div className="flex items-center gap-3">{estadoBadge(v.estado)}<span className="text-sm text-white font-medium">{formatCurrency(v.total)}</span></div></div>)}</div>}</div>
      </div>}</Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════
// COMPRAS
// ═══════════════════════════════════════════════
const ComprasModule = ({ compras, setCompras, productos, setProductos, kardex, setKardex }) => {
  const [showModal, setShowModal] = useState(false); const [toast, setToast] = useState("");
  const [tipoCompra, setTipoCompra] = useState("producto"); // producto | gasto
  const [form, setForm] = useState({ proveedor: "", items: "", productoId: "", cantidad: "", costoTotal: "", notas: "" });
  
  const crearCompra = () => {
    if (!form.proveedor || !form.costoTotal) return;
    const prod = tipoCompra === "producto" ? productos.find(p => p.id === form.productoId) : null;
    const nc = { id: generateId(), tipo: tipoCompra, proveedor: form.proveedor, items: tipoCompra === "producto" && prod ? `${form.cantidad} uds — ${prod.nombre}` : form.items, productoId: form.productoId || null, productoNombre: prod?.nombre || null, cantidad: parseInt(form.cantidad) || 0, costoTotal: parseFloat(form.costoTotal), fecha: new Date().toISOString(), estado: tipoCompra === "gasto" ? "Recibido" : "En tránsito", notas: form.notas };
    setCompras(p => [nc, ...p]);
    setForm({ proveedor: "", items: "", productoId: "", cantidad: "", costoTotal: "", notas: "" });
    setShowModal(false);
    setToast(tipoCompra === "producto" ? "Compra registrada — cambia a 'Recibido' para actualizar stock" : "Gasto registrado");
  };

  const marcarRecibido = (compra) => {
    if (compra.estado === "Recibido" || compra.tipo === "gasto") return;
    setCompras(p => p.map(c => c.id === compra.id ? { ...c, estado: "Recibido" } : c));
    // Si es compra de producto, aumentar inventario
    if (compra.tipo === "producto" && compra.productoId && compra.cantidad > 0) {
      setProductos(prev => prev.map(p => {
        if (p.id !== compra.productoId) return p;
        // Distribuir equitativamente entre variantes existentes
        const numVariantes = p.variantes.length;
        const perVariante = Math.floor(compra.cantidad / numVariantes);
        const remainder = compra.cantidad % numVariantes;
        return { ...p, variantes: p.variantes.map((v, i) => ({ ...v, stock: v.stock + perVariante + (i < remainder ? 1 : 0) })) };
      }));
      setKardex(prev => [{ id: generateId(), tipo: "Entrada", producto: compra.productoNombre || "Producto", cantidad: compra.cantidad, fecha: new Date().toISOString(), referencia: `Compra ${compra.id.slice(0,6)}`, nota: `${compra.proveedor} — Recibido` }, ...prev]);
      setToast("Recibido — stock actualizado automáticamente ✅");
    } else {
      setToast("Marcado como recibido");
    }
  };

  const tgProductos = compras.filter(c => c.tipo === "producto").reduce((s, c) => s + c.costoTotal, 0);
  const tgGastos = compras.filter(c => c.tipo === "gasto").reduce((s, c) => s + c.costoTotal, 0);
  const tgTotal = compras.reduce((s, c) => s + c.costoTotal, 0);

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"><div><h2 className="text-2xl font-light tracking-tight text-white">Egresos</h2><p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Compras + Gastos operativos</p></div><Btn onClick={() => setShowModal(true)}><Plus size={14} /> Nuevo Egreso</Btn></div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Total Egresos" value={formatCurrency(tgTotal)} />
        <StatCard icon={Package} label="Compras Prod." value={formatCurrency(tgProductos)} sub={`${compras.filter(c => c.tipo === "producto").length} compras`} />
        <StatCard icon={Calculator} label="Gastos Oper." value={formatCurrency(tgGastos)} sub={`${compras.filter(c => c.tipo === "gasto").length} gastos`} />
        <StatCard icon={Truck} label="En Tránsito" value={compras.filter(c => c.estado === "En tránsito").length} sub="Pendientes de recibir" />
      </div>

      {compras.length === 0 ? <EmptyState icon={Truck} title="Sin egresos registrados" sub="Registra compras de productos o gastos operativos" action={() => setShowModal(true)} actionLabel="Nuevo Egreso" /> :
      <div className="space-y-3">{compras.map(c => (
        <div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.tipo === "producto" ? "bg-sky-950 text-sky-400" : "bg-amber-950 text-amber-400"}`}>{c.tipo === "producto" ? <Package size={14} /> : <Calculator size={14} />}</div>
              <div><p className="text-sm text-white font-medium">{c.proveedor}</p><p className="text-xs text-neutral-500 mt-0.5">{c.items}</p></div>
            </div>
            <div className="flex items-center gap-4">
              {c.tipo === "producto" && c.estado !== "Recibido" ? <button onClick={() => marcarRecibido(c)} className="hover:opacity-80 transition-opacity">{estadoBadge(c.estado)}</button> : estadoBadge(c.estado)}
              <div className="text-right"><p className="text-sm text-white font-medium">{formatCurrency(c.costoTotal)}</p><p className="text-xs text-neutral-500">{c.tipo === "producto" ? `${c.cantidad} uds · ` : ""}{formatDate(c.fecha)}</p></div>
            </div>
          </div>
          {c.tipo === "producto" && c.estado === "En tránsito" && <p className="text-xs text-sky-400/70 mt-2 pt-2 border-t border-neutral-800">Haz clic en "En tránsito" para marcar como recibido y actualizar stock</p>}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800">
            {c.notas ? <p className="text-xs text-neutral-600 flex-1">{c.notas}</p> : <span />}
            <button onClick={() => { if(confirm(`¿Eliminar este egreso de ${formatCurrency(c.costoTotal)}?`)) { setCompras(p => p.filter(x => x.id !== c.id)); setToast("Egreso eliminado"); } }} className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0" title="Eliminar"><Trash2 size={13} /></button>
          </div>
        </div>
      ))}</div>}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Egreso" wide>
        <div className="space-y-4">
          <div className="flex gap-2 mb-1">{[{id:"producto",label:"Compra de producto",desc:"Afecta inventario al recibir"},{id:"gasto",label:"Gasto operativo",desc:"Envíos, publicidad, empaque..."}].map(t => (
            <button key={t.id} onClick={() => setTipoCompra(t.id)} className={`flex-1 p-3 rounded-lg text-left transition-all border ${tipoCompra === t.id ? "bg-neutral-800 border-white" : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"}`}>
              <p className={`text-xs uppercase tracking-widest font-medium ${tipoCompra === t.id ? "text-white" : "text-neutral-500"}`}>{t.label}</p>
              <p className="text-xs text-neutral-600 mt-1">{t.desc}</p>
            </button>
          ))}</div>
          
          <Input label="Proveedor / Origen" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} placeholder={tipoCompra === "producto" ? "Textiles San Juan" : "Olva Courier, Meta Ads..."} />
          
          {tipoCompra === "producto" ? <>
            <Select label="Producto destino" value={form.productoId} onChange={e => setForm({ ...form, productoId: e.target.value })} options={[{ value: "", label: "Seleccionar producto..." }, ...productos.map(p => ({ value: p.id, label: `${p.imagen} ${p.nombre}` }))]} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cantidad (unidades)" type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} placeholder="50" />
              <Input label="Costo Total (S/)" type="number" value={form.costoTotal} onChange={e => setForm({ ...form, costoTotal: e.target.value })} />
            </div>
            <p className="text-xs text-neutral-500">Al marcar como "Recibido", el stock del producto se actualiza automáticamente.</p>
          </> : <>
            <Input label="Descripción del gasto" value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} placeholder="Envíos del mes, publicidad Instagram..." />
            <Input label="Monto Total (S/)" type="number" value={form.costoTotal} onChange={e => setForm({ ...form, costoTotal: e.target.value })} />
          </>}
          
          <Input label="Notas" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Opcional..." />
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800"><Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn><Btn onClick={crearCompra} disabled={!form.proveedor || !form.costoTotal || (tipoCompra === "producto" && !form.productoId)}>Registrar</Btn></div>
        </div>
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════
// REPORTES
// ═══════════════════════════════════════════════
const ReportesModule = ({ ventas, productos, clientes, compras }) => {
  const [selYear, setSelYear] = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const years = getAvailableYears(ventas, compras);
  
  const vf = ventas.filter(v => inMonth(v.fecha, selYear, selMonth) && ESTADOS_COBRADOS.includes(v.estado));
  const vfAll = ventas.filter(v => inMonth(v.fecha, selYear, selMonth) && v.estado !== "Cancelado");
  const vPend = ventas.filter(v => inMonth(v.fecha, selYear, selMonth) && v.estado === "Pendiente");
  const ing = vf.reduce((s, v) => s + v.total, 0);
  const pendiente = vPend.reduce((s, v) => s + v.total, 0);
  const comprasMes = compras.filter(c => inMonth(c.fecha, selYear, selMonth));
  const egresos = comprasMes.reduce((s, c) => s + c.costoTotal, 0);
  const egresosProducto = comprasMes.filter(c => c.tipo === "producto").reduce((s, c) => s + c.costoTotal, 0);
  const egresosGasto = comprasMes.filter(c => c.tipo === "gasto" || !c.tipo).reduce((s, c) => s + c.costoTotal, 0);
  const utilidad = ing - egresos;
  const pp = useMemo(() => { const m = {}; vfAll.forEach(v => v.items.forEach(it => { if (!m[it.nombre]) m[it.nombre] = { nombre: it.nombre, cantidad: 0, ingresos: 0 }; m[it.nombre].cantidad += it.cantidad; m[it.nombre].ingresos += it.precio * it.cantidad; })); return Object.values(m).sort((a, b) => b.ingresos - a.ingresos); }, [vfAll]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div><h2 className="text-2xl font-light tracking-tight text-white">Reportes</h2><p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">{MESES[selMonth]} {selYear}</p></div>
        <div className="flex gap-2">
          <select value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white uppercase tracking-widest appearance-none">{MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
          <select value={selYear} onChange={e => setSelYear(parseInt(e.target.value))} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white tracking-widest appearance-none">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Ingresos Cobrados" value={formatCurrency(ing)} sub={`${vf.length} ventas`} />
        <StatCard icon={Clock} label="Pendientes" value={formatCurrency(pendiente)} sub={`${vPend.length} por cobrar`} />
        <StatCard icon={ArrowDownRight} label="Egresos" value={formatCurrency(egresos)} sub={`Prod: ${formatCurrency(egresosProducto)} · Op: ${formatCurrency(egresosGasto)}`} />
        <StatCard icon={TrendingUp} label="Utilidad Real" value={formatCurrency(utilidad)} sub={ing > 0 ? `Margen: ${(utilidad/ing*100).toFixed(0)}%` : "—"} />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">Estado de Resultados — {MESES[selMonth]} {selYear}</h3>
        <div className="space-y-2">
          {[
            ["Ingresos cobrados", formatCurrency(ing), "text-white", true],
            ["Pendientes de cobro", formatCurrency(pendiente), "text-amber-400", false],
            ["(−) Compras de producto", `- ${formatCurrency(egresosProducto)}`, "text-red-400", false],
            ["(−) Gastos operativos", `- ${formatCurrency(egresosGasto)}`, "text-red-400", false],
            ["(−) Total egresos", `- ${formatCurrency(egresos)}`, "text-red-400", true],
            ["UTILIDAD NETA", formatCurrency(utilidad), utilidad >= 0 ? "text-emerald-400" : "text-red-400", true],
          ].map(([l, v, c, bold]) => (
            <div key={l} className={`flex items-center justify-between py-2.5 ${bold ? "border-t border-neutral-700 pt-3" : "border-b border-neutral-800/50"}`}>
              <span className={`text-sm ${bold ? "font-medium text-neutral-300" : "text-neutral-500"}`}>{l}</span>
              <span className={`text-sm font-medium ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5"><h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">Por Producto</h3>{pp.length===0?<div className="py-12 text-center text-xs text-neutral-600">Sin datos en {MESES[selMonth]}</div>:<div className="space-y-3">{pp.map((p,i)=><div key={i}><div className="flex items-center justify-between text-sm mb-1"><span className="text-neutral-300">{p.nombre}</span><span className="text-white">{formatCurrency(p.ingresos)} <span className="text-neutral-600">({p.cantidad})</span></span></div><div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full" style={{width:`${(p.ingresos/(pp[0]?.ingresos||1))*100}%`}}/></div></div>)}</div>}</div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5"><h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">Stock Actual</h3><div className="space-y-2">{productos.map(p=>{const ts=p.variantes.reduce((s,v)=>s+v.stock,0);return <div key={p.id} className="flex items-center justify-between bg-neutral-800 rounded-lg px-4 py-3"><div className="flex items-center gap-3"><span>{p.imagen}</span><div><p className="text-sm text-white">{p.nombre}</p><p className="text-xs text-neutral-500">{p.variantes.map(v=>`${v.talla}:${v.stock}`).join(" · ")}</p></div></div><p className={`text-sm font-medium ${ts===0?"text-red-400":ts<=5?"text-amber-400":"text-white"}`}>{ts}</p></div>;})}</div></div>
      </div>
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5"><h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-4">Márgenes por Producto</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-neutral-800">{["Producto","Precio","Costo","Margen","%","Stock"].map(h=><th key={h} className="text-left px-4 py-2 text-xs text-neutral-500 uppercase tracking-widest font-medium">{h}</th>)}</tr></thead><tbody>{productos.map(p=>{const ts=p.variantes.reduce((s,v)=>s+v.stock,0);const mg=p.precio-p.costo;return <tr key={p.id} className="border-b border-neutral-800/50"><td className="px-4 py-2.5 text-white">{p.imagen} {p.nombre}</td><td className="px-4 py-2.5 text-white">{formatCurrency(p.precio)}</td><td className="px-4 py-2.5 text-neutral-400">{formatCurrency(p.costo)}</td><td className="px-4 py-2.5 text-emerald-400">{formatCurrency(mg)}</td><td className="px-4 py-2.5 text-emerald-400">{(mg/p.precio*100).toFixed(0)}%</td><td className="px-4 py-2.5 text-white">{ts}</td></tr>;})}</tbody></table></div></div>
    </div>
  );
};

// ═══════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════
const LoginScreen = ({ onLogin }) => {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  const go = () => { if (u === "admin" && p === "stylum2026") onLogin(); else { setErr("Credenciales incorrectas"); setTimeout(() => setErr(""), 3000); } };
  return (<div className="min-h-screen bg-black flex items-center justify-center p-4"><div className="w-full max-w-sm"><div className="text-center mb-10"><h1 className="text-4xl font-bold tracking-[0.3em] text-white mb-2">STYLUM</h1><div className="w-12 h-px bg-neutral-700 mx-auto my-4" /><p className="text-xs text-neutral-500 uppercase tracking-[0.4em]">Business Management System</p></div><div className="space-y-4"><input value={u} onChange={e=>setU(e.target.value)} placeholder="Usuario" className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors tracking-wider" onKeyDown={e=>e.key==="Enter"&&go()}/><input value={p} onChange={e=>setP(e.target.value)} type="password" placeholder="Contraseña" className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors tracking-wider" onKeyDown={e=>e.key==="Enter"&&go()}/>{err&&<p className="text-xs text-red-400">{err}</p>}<button onClick={go} className="w-full bg-white text-black py-3 text-xs uppercase tracking-[0.3em] font-medium hover:bg-neutral-200 transition-colors mt-6">Ingresar</button><p className="text-center text-xs text-neutral-700 mt-4 tracking-wider">admin / stylum2026</p></div></div></div>);
};

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
const NAV = [{ id: "dashboard", label: "Dashboard", icon: BarChart3 }, { id: "ventas", label: "Ventas", icon: ShoppingCart }, { id: "inventario", label: "Inventario", icon: Package }, { id: "clientes", label: "Clientes", icon: Users }, { id: "compras", label: "Egresos", icon: Truck }, { id: "reportes", label: "Reportes", icon: FileText }];

export default function App() {
  const [auth, setAuth] = useState(false); const [page, setPage] = useState("dashboard"); const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productos, setProductos, pL, pSync] = useCloudState("productos", DEFAULT_PRODUCTOS);
  const [clientes, setClientes, cL, cSync] = useCloudState("clientes", []);
  const [ventas, setVentas, vL, vSync] = useCloudState("ventas", []);
  const [compras, setCompras, cpL, cpSync] = useCloudState("compras", []);
  const [kardex, setKardex, kL, kSync] = useCloudState("kardex", []);
  const loaded = pL && cL && vL && cpL && kL;

  // Overall sync status: worst status wins
  const syncStatus = [pSync, cSync, vSync, cpSync, kSync].includes('syncing') ? 'syncing'
    : [pSync, cSync, vSync, cpSync, kSync].includes('offline') ? 'offline'
    : [pSync, cSync, vSync, cpSync, kSync].includes('local') ? 'local'
    : 'synced';

  if (!auth) return <LoginScreen onLogin={() => setAuth(true)} />;
  if (!loaded) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-center"><p className="text-xl tracking-[0.3em] text-white mb-3">STYLUM</p><p className="text-xs text-neutral-500 uppercase tracking-widest animate-pulse">Sincronizando datos...</p></div></div>;

  const cur = NAV.find(n => n.id === page);
  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 border-b border-neutral-800"><h1 className="text-xl font-bold tracking-[0.3em] text-white">STYLUM</h1><p className="text-[10px] text-neutral-600 uppercase tracking-[0.3em] mt-1">CRM · ERP</p></div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">{NAV.map(item => <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-widest transition-all ${page === item.id ? "bg-white text-black font-medium" : "text-neutral-500 hover:text-white hover:bg-neutral-800/50"}`}><item.icon size={16} />{item.label}</button>)}</nav>
        <div className="p-3 mx-3 mb-3 bg-neutral-900 border border-neutral-800 rounded-xl"><p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Web</p><a href="https://www.stylum.pe" target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">stylum.pe <ExternalLink size={10} /></a></div>
        <div className="p-4 border-t border-neutral-800"><button onClick={() => setAuth(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-widest text-neutral-600 hover:text-red-400 hover:bg-neutral-800/50"><LogOut size={16} />Salir</button></div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-neutral-800/50 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-neutral-500 hover:text-white"><Menu size={20} /></button><div className="flex items-center gap-2"><cur.icon size={18} className="text-neutral-400" /><span className="text-sm font-medium tracking-wider uppercase text-white">{cur.label}</span></div></div>
          <div className="flex items-center gap-3">
            <SyncIndicator status={syncStatus} />
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">S</div>
          </div>
        </header>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {page === "dashboard" && <Dashboard ventas={ventas} productos={productos} clientes={clientes} compras={compras} />}
          {page === "ventas" && <VentasModule ventas={ventas} setVentas={setVentas} productos={productos} setProductos={setProductos} clientes={clientes} setClientes={setClientes} kardex={kardex} setKardex={setKardex} />}
          {page === "inventario" && <InventarioModule productos={productos} setProductos={setProductos} kardex={kardex} setKardex={setKardex} />}
          {page === "clientes" && <ClientesModule clientes={clientes} setClientes={setClientes} ventas={ventas} />}
          {page === "compras" && <ComprasModule compras={compras} setCompras={setCompras} productos={productos} setProductos={setProductos} kardex={kardex} setKardex={setKardex} />}
          {page === "reportes" && <ReportesModule ventas={ventas} productos={productos} clientes={clientes} compras={compras} />}
        </div>
      </main>
    </div>
  );
}
