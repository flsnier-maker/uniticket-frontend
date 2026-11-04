const fs = require('fs'); 
const code = `import { useState, useEffect } from 'react'; 
import { api } from './services/api'; 
 
export default function App() { 
  const [view, setView] = useState('catalog'); 
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showModal, setShowModal] = useState(false); 
  const [processing, setProcessing] = useState(false); 
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [qrCode, setQrCode] = useState(null); 
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    location: '', 
    sectorName: 'Pista VIP', 
    batchName: '1§ Lote', 
    priceCents: 15000, 
    totalQuantity: 1000 
  }); 
 
  useEffect(function() { 
    fetchEvents(); 
  }, []); 
 
  async function fetchEvents() { 
    try { 
      const res = await api.get('/events'); 
      setEvents(Array.isArray(data) ? data : []); 
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    } 
  } 
 
  async function handleCreateEvent(e) { 
    e.preventDefault(); 
    setProcessing(true); 
    try { 
      await api.post('/events', form); 
      setShowModal(false); 
      setForm({ title: '', description: '', location: '', sectorName: 'Pista VIP', batchName: '1§ Lote', priceCents: 15000, totalQuantity: 1000 }); 
      fetchEvents(); 
    } catch (err) { 
    } finally { 
      setProcessing(false); 
    } 
  } 
 
  async function handleBuyTicket(batchId) { 
    setProcessing(true); 
    try { 
      const reserveRes = await api.post('/orders/reserve', { userId, batchId, quantity: 1 }); 
      setSelectedOrder(order); 
 
      const payRes = await api.post('/orders/pay', { orderId: order?.id }); 
      fetchEvents(); 
    } catch (err) { 
    } finally { 
      setProcessing(false); 
    } 
  } 
 
  function formatPrice(batch) { 
    const rawPrice = batch?.priceCents ?? batch?.price ?? 0; 
    const numericPrice = Number(rawPrice); 
    if (isNaN(numericPrice)) return '0.00'; 
    return numericPrice  ? (numericPrice / 100).toFixed(2) : numericPrice.toFixed(2); 
  } 
 
  return ( 
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans"> 
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-8 py-4 flex justify-between items-center"> 
        <h1 className="text-xl font-bold text-indigo-400">ClubTicket System</h1> 
        <div className="flex gap-3"> 
          <button onClick={function() { setView('catalog'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg">Cat logo / Bilhetes</button> 
          <button onClick={function() { setShowModal(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg">+ Novo Evento</button> 
        </div> 
      </header> 
 
      <main className="p-8 max-w-5xl mx-auto"> 
        <h2 className="text-3xl font-bold mb-2 text-indigo-400">Eventos Dispon¡veis</h2> 
        <p className="text-slate-400 mb-8">Escolha o seu lote e garanta o seu ingresso em tempo real.</p> 
 
        {loading ? ( 
          <p className="text-slate-400">Carregando cat logo...</p> 
        ) : events.length === 0 ? ( 
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center"> 
            <p className="text-slate-400 mb-4">Nenhum evento encontrado no momento.</p> 
            <button onClick={function() { setShowModal(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-sm"> 
              Cadastrar Primeiro Evento 
            </button> 
          </div> 
        ) : ( 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
            {events.map(function(event) { 
              return ( 
                  <div className="mb-4"> 
                  </div> 
                  <div className="space-y-3 mt-4 border-t border-slate-800 pt-4"> 
                    {Array.isArray(event.sectors) && event.sectors.map(function(sector) { 
                      return Array.isArray(sector.batches) && sector.batches.map(function(batch) { 
                        const available = batch?.availableQuantity ?? batch?.quantity ?? batch?.totalQuantity ?? 0; 
                        return ( 
                            <div> 
                              <p className="text-xs text-slate-400">Dispon¡veis: {available}</p> 
                            </div> 
                            <div className="text-right"> 
                              <p className="font-bold text-emerald-400">R$ {formatPrice(batch)}</p> 
                                {processing ? 'Comprando...' : 'Garantir'} 
                              </button> 
                            </div> 
                          </div> 
                        ); 
                      }); 
                    })} 
                  </div> 
                </div> 
              ); 
            })} 
          </div> 
        )} 
 
        {showModal && ( 
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"> 
            <div className="bg-slate-900 p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4"> 
              <h3 className="text-xl font-bold text-indigo-400">Cadastrar Novo Evento</h3> 
              <form onSubmit={handleCreateEvent} className="space-y-3"> 
                <div> 
                  <label className="text-xs text-slate-400 block mb-1">T¡tulo do Evento</label> 
                  <input required value={form.title} onChange={function(e) { setForm({...form, title: e.target.value}); }} placeholder="Ex: Show de VerÆo 2026" className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white" /> 
                </div> 
                <div> 
                  <label className="text-xs text-slate-400 block mb-1">Descri‡Æo</label> 
                  <input value={form.description} onChange={function(e) { setForm({...form, description: e.target.value}); }} placeholder="Ex: O maior evento da cidade" className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white" /> 
                </div> 
                <div> 
                  <label className="text-xs text-slate-400 block mb-1">Local</label> 
                  <input value={form.location} onChange={function(e) { setForm({...form, location: e.target.value}); }} placeholder="Ex: Est dio Esportivo" className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white" /> 
                </div> 
                <div className="grid grid-cols-2 gap-3"> 
                  <div> 
                    <label className="text-xs text-slate-400 block mb-1">Setor</label> 
                    <input value={form.sectorName} onChange={function(e) { setForm({...form, sectorName: e.target.value}); }} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white" /> 
                  </div> 
                  <div> 
                    <label className="text-xs text-slate-400 block mb-1">Lote</label> 
                    <input value={form.batchName} onChange={function(e) { setForm({...form, batchName: e.target.value}); }} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white" /> 
                  </div> 
                </div> 
                <div className="grid grid-cols-2 gap-3"> 
                  <div> 
                    <label className="text-xs text-slate-400 block mb-1">Pre‡o (Centavos)</label> 
                    <input type="number" value={form.priceCents} onChange={function(e) { setForm({...form, priceCents: Number(e.target.value)}); }} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white" /> 
                  </div> 
                  <div> 
                    <label className="text-xs text-slate-400 block mb-1">Qtd Ingressos</label> 
                    <input type="number" value={form.totalQuantity} onChange={function(e) { setForm({...form, totalQuantity: Number(e.target.value)}); }} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white" /> 
                  </div> 
                </div> 
                <div className="flex gap-3 pt-2"> 
                  <button type="button" onClick={function() { setShowModal(false); }} className="w-1/2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-sm">Cancelar</button> 
                  <button type="submit" disabled={processing} className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-sm">{processing ? 'Salvando...' : 'Criar Evento'}</button> 
                </div> 
              </form> 
            </div> 
          </div> 
        )} 
 
        {selectedOrder && qrCode && ( 
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"> 
            <div className="bg-slate-900 p-6 rounded-2xl max-w-sm w-full border border-slate-800 text-center space-y-4"> 
              <h3 className="text-xl font-bold text-emerald-400">Ingresso Confirmado!</h3> 
              <div className="bg-white p-4 rounded-xl inline-block mx-auto"> 
                <img src={qrCode} alt="QR Code Ingresso" className="w-48 h-48 mx-auto" /> 
              </div> 
              <button onClick={function() { setSelectedOrder(null); setQrCode(null); }} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg text-sm"> 
                Fechar 
              </button> 
            </div> 
          </div> 
        )} 
      </main> 
    </div> 
  ); 
} 
\`; fs.writeFileSync('src/App.tsx', code, 'utf8'); console.log('Sucesso ao atualizar App.tsx'); 
