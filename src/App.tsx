import { useState, useEffect, useRef } from 'react';
import { api } from './services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function App() {
  const [view, setView] = useState<'catalog' | 'gate'>('catalog');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Estados de Pagamento e Pix
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [issuedTicket, setIssuedTicket] = useState<any>(null);

  // Estados da Portaria
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [checkinResult, setCheckinResult] = useState<any>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: 'Estádio Tiberão',
    sectorName: 'Pista VIP',
    batchName: '1º Lote',
    priceCents: 8000,
    totalQuantity: 1000
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  // Efeito para ativar/desativar o leitor de QR Code da câmara
  useEffect(() => {
    if (view === 'gate' && scannerActive) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          setTicketCodeInput(decodedText);
          executeCheckin(decodedText);
          scanner.clear();
          setScannerActive(false);
        },
        (error) => {
          // Erros de leitura contínuos do frame são ignorados
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [view, scannerActive]);

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

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.post('/events', form);
      setShowModal(false);
      setForm({
        title: '',
        description: '',
        location: 'Estádio Tiberão',
        sectorName: 'Pista VIP',
        batchName: '1º Lote',
        priceCents: 8000,
        totalQuantity: 1000
      });
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao criar evento.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReservePix(batchId: string) {
    setProcessing(true);
    try {
      const userId = localStorage.getItem('@clubticket:userId') || 'user-default';
      const reserveRes = await api.post('/orders/reserve', { userId, batchId, quantity: 1 });
      const order = reserveRes.data?.order || reserveRes.data;
      setPendingOrder(order);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao gerar Pix.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleConfirmPixPayment() {
    if (!pendingOrder) return;
    setProcessing(true);
    try {
      const payRes = await api.post('/orders/webhook', {
        orderId: pendingOrder.id,
        status: 'PAID'
      });
      
      setIssuedTicket(payRes.data?.ticket);
      setPendingOrder(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao confirmar pagamento.');
    } finally {
      setProcessing(false);
    }
  }

  async function executeCheckin(code: string) {
    if (!code) return;
    setProcessing(true);
    setCheckinResult(null);

    try {
      const res = await api.post('/orders/checkin', { ticketCode: code });
      setCheckinResult({ success: true, data: res.data });
    } catch (err: any) {
      setCheckinResult({
        success: false,
        message: err.response?.data?.message || 'Ingresso inválido ou já utilizado.'
      });
    } finally {
      setProcessing(false);
    }
  }

  function handleManualCheckin(e: React.FormEvent) {
    e.preventDefault();
    executeCheckin(ticketCodeInput);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-400">ClubTicket System</h1>
          <p className="text-xs text-slate-400">Gestão e Venda de Ingressos em Tempo Real</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setView('catalog');
              setScannerActive(false);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              view === 'catalog' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Catálogo / Bilhetes
          </button>
          <button
            onClick={() => setView('gate')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              view === 'gate' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Modo Portaria
          </button>
          {view === 'catalog' && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              + Novo Evento
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {view === 'catalog' ? (
          <>
            {loading ? (
              <p className="text-slate-400">A carregar eventos...</p>
            ) : events.length === 0 ? (
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center">
                <p className="text-slate-400 mb-4">Nenhum evento registado no sistema.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-sm cursor-pointer"
                >
                  Cadastrar Primeiro Evento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((ev) => (
                  <div key={ev.id || Math.random()} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-xl">
                    <div>
                      <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                        {ev.status || 'PUBLISHED'}
                      </span>
                      <h3 className="text-xl font-bold mt-2 text-white">{ev.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{ev.description}</p>
                      <p className="text-slate-500 text-xs mt-2">📍 {ev.venueName || ev.location}</p>
                    </div>
                    <div className="mt-4 border-t border-slate-800 pt-4 space-y-2">
                      {ev.sectors?.map((sec: any) =>
                        sec.batches?.map((b: any) => {
                          const available = b.availableQty ?? b.availableQuantity ?? b.totalQuantity ?? 0;
                          const price = b.priceInCents ?? b.priceCents ?? 0;
                          return (
                            <div key={b.id || Math.random()} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                              <div>
                                <p className="text-sm font-semibold text-slate-200">{sec.name} - {b.name}</p>
                                <p className="text-xs text-slate-400">Disponíveis: {available}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-emerald-400">R$ {(price / 100).toFixed(2)}</p>
                                <button
                                  disabled={processing || available === 0}
                                  onClick={() => handleReservePix(b.id)}
                                  className="mt-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                                >
                                  {processing ? 'A gerar Pix...' : 'Pagar via Pix'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Visualização de Validação da Portaria */
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-lg mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400">Validação de Portaria</h2>
            <p className="text-slate-400 text-sm">Escaneie o QR Code com a câmara ou insira o código manualmente.</p>

            {/* Controlo da Câmara */}
            <div className="space-y-4">
              {!scannerActive ? (
                <button
                  onClick={() => setScannerActive(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  📷 Abrir Câmara para Escanear
                </button>
              ) : (
                <div className="space-y-2">
                  <div id="reader" className="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800"></div>
                  <button
                    onClick={() => setScannerActive(false)}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs cursor-pointer"
                  >
                    Fechar Câmara
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="px-3 text-xs text-slate-500 font-bold">OU DIGITE</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleManualCheckin} className="space-y-4">
              <input
                required
                value={ticketCodeInput}
                onChange={(e) => setTicketCodeInput(e.target.value)}
                placeholder="Código do Ingresso (Ex: TCK-XXXX)"
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-center text-lg font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer"
              >
                {processing ? 'A Validar...' : 'Validar Entrada'}
              </button>
            </form>

            {checkinResult && (
              <div className={`p-4 rounded-xl border ${checkinResult.success ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-rose-950/60 border-rose-500 text-rose-300'}`}>
                <h4 className="font-bold text-lg">{checkinResult.success ? 'ENTRADA LIBERADA! ✅' : 'ACESSO NEGADO ❌'}</h4>
                <p className="text-xs mt-1">{checkinResult.success ? 'Ingresso válido e check-in efetuado com sucesso.' : checkinResult.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Modal de Pagamento Pix (Pendente) */}
        {pendingOrder && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 p-6 rounded-2xl max-w-sm w-full border border-slate-800 text-center space-y-4 shadow-2xl">
              <h3 className="text-xl font-bold text-amber-400">Pagamento Pix Gerado</h3>
              <p className="text-slate-400 text-xs">Escaneie o QR Code abaixo com o aplicativo do seu banco para pagar R$ {((pendingOrder.totalInCents || 0) / 100).toFixed(2)}</p>

              <div className="bg-white p-3 rounded-xl inline-block mx-auto">
                <img src={pendingOrder.pixQrCode} alt="QR Code Pix" className="w-48 h-48 mx-auto" />
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-mono break-all text-slate-300">
                {pendingOrder.pixCopiaECola}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleConfirmPixPayment}
                  disabled={processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-sm cursor-pointer"
                >
                  {processing ? 'A processar Webhook...' : 'Simular Confirmação do Pix'}
                </button>
                <button
                  onClick={() => setPendingOrder(null)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal do Bilhete Emitido */}
        {issuedTicket && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 p-6 rounded-2xl max-w-sm w-full border border-slate-800 text-center space-y-4 shadow-2xl">
              <h3 className="text-xl font-bold text-emerald-400">Ingresso Confirmado!</h3>
              <p className="text-slate-300 text-sm font-mono font-bold bg-slate-950 py-2 px-3 rounded-lg border border-slate-800">
                Código: {issuedTicket.ticketCode}
              </p>
              <div className="bg-white p-4 rounded-xl inline-block mx-auto">
                <img src={issuedTicket.qrCode} alt="QR Code Ingresso" className="w-48 h-48 mx-auto" />
              </div>
              <button
                onClick={() => setIssuedTicket(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modal de Cadastro de Evento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4 shadow-2xl text-left">
              <h3 className="text-xl font-bold text-indigo-400">Cadastrar Evento</h3>
              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Título do Evento</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Show de Verão 2026"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Descrição</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Ex: O maior evento da cidade"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Local / Estádio</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ex: Estádio Tiberão"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Preço (Centavos)</label>
                    <input
                      type="number"
                      value={form.priceCents}
                      onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Qtd Ingressos</label>
                    <input
                      type="number"
                      value={form.totalQuantity}
                      onChange={(e) => setForm({ ...form, totalQuantity: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-bold cursor-pointer"
                  >
                    {processing ? 'A guardar...' : 'Criar Evento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}