'use client';
import { useState } from 'react';
import jsPDF from 'jspdf';

export interface HistoryEvent {
  type: 'prediction' | 'verification';
  data: any;
  timestamp: string;
  txHash?: string;
  onChain?: boolean;
}

function exportToPDF(ev: HistoryEvent) {
  const doc = new jsPDF();
  doc.text(`Type: ${ev.type}`, 10, 10);
  doc.text(`Time: ${ev.timestamp}`, 10, 20);
  doc.text("Data:", 10, 30);
  doc.text(JSON.stringify(ev.data, null, 2), 10, 40);
  doc.save(`${ev.type}-proof-${ev.timestamp}.pdf`);
}

export function HistoryPanel({ events }: { events: HistoryEvent[] }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-blue-700 to-purple-700 text-white rounded-full p-4 shadow-2xl hover:scale-110"
        onClick={() => setShow(true)}
        aria-label="Open history panel"
        tabIndex={0}
      >
        📜
        <span className="ml-2 text-sm hidden md:inline">History</span>
      </button>
      {show && (
        <div className="fixed inset-0 bg-black/60 z-40 flex flex-col items-center justify-center">
          <div className="bg-[#1a1532] rounded-2xl p-6 shadow-2xl w-[94vw] max-w-2xl relative">
            <button
              className="absolute top-3 right-4 text-xl bg-gray-700 px-2 py-1 rounded hover:bg-red-700 transition"
              onClick={() => setShow(false)}
              aria-label="Close history panel"
              tabIndex={0}
            >✖️</button>
            <h3 className="text-2xl font-bold mb-4 text-cyan-200 flex items-center gap-2">
              <span>📜</span> Prediction & Verification History
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyan-200/80 border-b border-cyan-900/20">
                  <th className="py-2 text-left">Type</th>
                  <th className="py-2">Info</th>
                  <th className="py-2">On-Chain/S3</th>
                  <th className="py-2">Time</th>
                  <th className="py-2">PDF</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-cyan-500 py-4">No actions yet</td>
                  </tr>
                )}
                {events.map((ev, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-cyan-700/10 transition-all ${ev.type === 'prediction' ? 'text-orange-200' : 'text-green-200'}`}
                  >
                    <td className="py-2 font-mono">{ev.type === 'prediction' ? 'Prediction' : 'Verification'}</td>
                    <td className="py-2">
                      {ev.type === 'prediction'
                        ? `Score ${(ev.data.shortage_probability * 100).toFixed(1)}%`
                        : <>
                            {ev.data?.is_authentic ? 'Authentic' : 'Suspicious'}
                            {ev.data?.s3_url && (
                              <div className="text-xs mt-1 break-all">
                                <a
                                  className="text-blue-300 underline hover:text-blue-400"
                                  href={ev.data.s3_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="AWS S3 proof link"
                                >
                                  S3 Proof 🔗
                                </a>
                              </div>
                            )}
                          </>
                      }
                      {ev.txHash && (
                        <div className="text-xs text-cyan-300 mt-1 break-all">
                          <a className="hover:underline" href={`#`} tabIndex={0}>
                            {ev.txHash.slice(0, 10)}...
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-center">
                      {ev.onChain
                        ? <span className="inline-flex items-center gap-1 bg-green-600/20 text-green-300 px-2 py-1 rounded-full">✔️ On-chain</span>
                        : (ev.data?.s3_url ? (
                          <span className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full">S3</span>
                        ) : '-')}
                    </td>
                    <td className="py-2">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 text-center">
                      <button
                        className="ml-1 bg-blue-600 p-1 rounded"
                        onClick={() => exportToPDF(ev)}
                        aria-label="Export as PDF"
                        title="Download PDF"
                        tabIndex={0}
                      >
                        📄
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
