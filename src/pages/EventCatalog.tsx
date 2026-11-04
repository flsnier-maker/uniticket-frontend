import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function EventCatalog() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(function() {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await api.get('/events');
      const data = res.data?.events || res.data || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyTicket(batchId) {
    setProcessing(true);
    try {
      const userId = localStorage.getItem('@clubticket:userId') || 'user-default';
      const reserveRes = await api.post('/orders/reserve', { userId, batchId, quantity: 1 });
      const order = reserveRes.data?.order || reserveRes.data || reserveRes.body?.order;
      setSelectedOrder(order);

      const payRes = await api.post('/orders/pay', { orderId: order?.id });
      setQrCode(payRes.data?.ticket?.qrCode || payRes.data?.qrCode);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao processar compra.');
    } finally {
      setProcessing(false);
    }
  }

  function formatPrice(batch) {
    const rawPrice = batch?.priceCents ?? batch?.price ?? 0;
    const numericPrice = Number(rawPrice);
    if (isNaN(numericPrice)) return '0.00';
    return numericPrice > 1000 ? (numericPrice / 100).toFixed(2) : numericPrice.toFixed(2);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-2 text-indigo-400">Eventos Disponíveis</h2>
      <p className="text-slate-400 mb-8">Escolha o seu lote e garanta o seu ingresso em tempo real.</p>

      {loading ? (
        <p className="text-slate-400">Carregando catálogo...</p>
      ) : events.length === 0 ? (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center">
          <p className="text-slate-400">Nenhum evento encontrado no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(function(event) {
            return (
              <div key={event.id || Math.random()} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-between">
                <div className="mb-4">
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full">
                    {event.status || 'PUBLICADO'}
                  </span>
                  <h3 className="text-xl font-bold mt-2">{event.title || 'Evento'}</h3>
                  <p className="text-slate-400 text-sm mt-1">{event.description || ''}</p>
                  <p className="text-slate-500 text-xs mt-2">📍 {event.location || 'Local a definir'}</p>
                </div>

                <div className="space-y-3 mt-4 border-t border-slate-700/60 pt-4">
                  {Array.isArray(event.sectors) && event.sectors.length > 0 ? (
                    event.sectors.map(function(sector) {
                      return Array.isArray(sector.batches) ? (
                        sector.batches.map(function(batch) {
                          const available = batch?.availableQuantity ?? batch?.quantity ?? batch?.totalQuantity ?? 0;
                          return (
                            <div key={batch.id || Math.random()} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700/50">
                              <div>
                                <p className="font-semibold text-sm">{(sector.name || 'Setor') + ' - ' + (batch.name || 'Lote')}</p>
                                <p className="text-xs text-slate-400">Disponíveis: {available}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-emerald-400">R$ {formatPrice(batch)}</p>
                                <button
                                  disabled={processing || available === 0}
                                  onClick={function() { handleBuyTicket(batch.id); }}
                                  className="mt-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  {processing ? 'Comprando...' : 'Garantir'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : null;
                    })
                  ) : (
                    <p className="text-xs text-slate-500">Sem lotes ativos.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && qrCode && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-2xl max-w-sm w-full border border-slate-700 text-center space-y-4">
            <h3 className="text-xl font-bold text-emerald-400">Ingresso Confirmado!</h3>
            <p className="text-slate-300 text-xs font-mono">Código: {selectedOrder.code || selectedOrder.id}</p>
            <div className="bg-white p-4 rounded-xl inline-block mx-auto">
              <img src={qrCode} alt="QR Code Ingresso" className="w-48 h-48 mx-auto" />
            </div>
            <p className="text-slate-400 text-xs">Apresente este QR Code na portaria do evento.</p>
            <button
              onClick={function() { setSelectedOrder(null); setQrCode(null); }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition-colors text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
