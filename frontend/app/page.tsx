'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi';
import { keccak256, toHex } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { injected } from 'wagmi/connectors';
import toast from 'react-hot-toast';
import { AboutModal } from './AboutModal';
import { NoSSR } from './NoSSR';
import { HistoryPanel, HistoryEvent } from './HistoryPanel';
import { ThemeToggle } from './ThemeToggle';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`;
const DEMO_REGISTRY_ABI = [
  {
    inputs: [{ name: '_batchHash', type: 'bytes32' }],
    name: 'registerDrugBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;
const API_BASE = "https://medchain-oracle.onrender.com";

const orgs = ['Mumbai Central', 'Delhi HQ'];
const languages = [
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'hi', label: '🇮🇳 HI' },
  { code: 'es', label: '🇪🇸 ES' }
];

interface ShortagePrediction {
  drug_name: string;
  location: string;
  shortage_probability: number;
  confidence: number;
  severity: string;
  recommended_action: string;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract } = useWriteContract();

  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<ShortagePrediction | null>(null);
  const [txHash, setTxHash] = useState('');
  const [verificationImage, setVerificationImage] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [org, setOrg] = useState(orgs[0]);
  const [lang, setLang] = useState('en');

  const triggerShortage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/predict-shortage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug_name: 'Insulin Glargine 100U/mL',
          location: org,
          current_stock: 45,
          avg_daily_usage: 18.5
        })
      });
      const data = await res.json();
      setPrediction(data);

      let txHashLocal = '';
      if (isConnected) {
        const hash = keccak256(toHex(JSON.stringify(data)));
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: DEMO_REGISTRY_ABI,
          functionName: 'registerDrugBatch',
          args: [hash]
        });
        setTxHash(hash);
        txHashLocal = hash;
      }
      setHistory(prev => [
        ...prev,
        {
          type: 'prediction',
          data,
          timestamp: new Date().toISOString(),
          txHash: txHashLocal,
          onChain: !!txHashLocal,
        }
      ]);
      toast.success('Prediction complete!');
    } catch {
      toast.error('Prediction failed!');
    } finally {
      setLoading(false);
    }
  };

  const verifyDrug = async () => {
    if (!verificationImage) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', verificationImage);
      const res = await fetch(`${API_BASE}/verify-drug`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setVerificationResult(data);
      setHistory(prev => [
        ...prev,
        {
          type: 'verification',
          data,
          timestamp: new Date().toISOString(),
          onChain: false
        }
      ]);
      toast.success('Verification complete!');
    } catch {
      toast.error('Verification failed!');
    } finally {
      setLoading(false);
    }
  };

  const displayedHistory = history.filter(ev =>
    !ev.data?.location || ev.data.location === org
  );

  return (
    <NoSSR>
      <div className="min-h-screen bg-gradient-to-br from-[#22183c] via-[#321d53] to-[#241b34] text-white relative overflow-x-hidden">
        <ThemeToggle />
        <a
          href="https://calendly.com/yourusername/demo"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-7 bottom-24 z-40 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full px-5 py-4 shadow-lg"
          style={{ fontSize: '20px' }}
          aria-label="Book a 1:1 Demo"
          tabIndex={0}
        >
          🔗 Book a 1:1 Demo
        </a>
        <button
          className="z-20 fixed right-5 top-5 shadow-lg px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 ring-2 ring-cyan-600/30 text-white font-bold rounded-full text-base hover:scale-105 transition-transform"
          onClick={() => setShowAbout(true)}
          aria-label="About MedChain Oracle"
          tabIndex={0}
        >
          ℹ️ About
        </button>
        <AboutModal show={showAbout} onClose={() => setShowAbout(false)} />

        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-2/3 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-700/25 rounded-full blur-3xl"></div>
        </div>

        <header className="mx-auto px-6 pt-8 max-w-6xl relative flex items-center gap-6 justify-between">
          <div className="flex items-center gap-3">
            <select
              className="bg-white/10 text-white rounded px-2 py-1 mr-4"
              value={org}
              onChange={e => setOrg(e.target.value)}
              aria-label="Select hospital organization"
            >
              {orgs.map(o => <option key={o}>{o}</option>)}
            </select>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-800 flex items-center justify-center text-3xl shadow-xl">
              🏥
            </div>
            <div>
              <span className="block text-3xl font-extrabold drop-shadow bg-gradient-to-br from-cyan-200 via-white to-blue-500 bg-clip-text text-transparent">
                MedChain Oracle
              </span>
              <span className="block text-sm text-cyan-300">Enterprise AI Supply Chain Security</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="ml-3 bg-white/10 text-white rounded px-2 py-1"
              value={lang}
              onChange={e => setLang(e.target.value)}
              aria-label="Select language"
            >
              {languages.map(opt => (
                <option value={opt.code} key={opt.code}>{opt.label}</option>
              ))}
            </select>
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-green-600/20 border border-green-400/50 rounded-lg text-sm font-bold tracking-widest">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-sm hover:bg-red-500/30 transition"
                  aria-label="Disconnect wallet"
                  tabIndex={0}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold shadow-lg hover:scale-105 hover:from-cyan-400 hover:to-blue-400 transition"
                aria-label="Connect wallet"
                tabIndex={0}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 pb-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative backdrop-blur-2xl shadow-2xl rounded-3xl bg-white/10 border border-cyan-500/20 p-8"
            >
              <div className="flex items-center gap-2 mb-5 text-xl font-bold text-cyan-300 drop-shadow">
                <span>🔮</span>
                Shortage Prediction
              </div>
              <button
                onClick={triggerShortage}
                disabled={loading}
                className="w-full mb-6 py-4 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl text-xl font-bold shadow-lg shadow-orange-400/30 hover:scale-[1.03] hover:shadow-xl focus:outline-2 focus:ring-2 ring-orange-400 transition disabled:opacity-60"
                aria-label="Trigger critical shortage prediction"
                tabIndex={0}
              >
                {loading ? '🔄 Analyzing...' : '✨ Trigger Critical Shortage'}
              </button>
              <AnimatePresence>
                {prediction && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className={`rounded-2xl border-2 p-6 mt-2 shadow-xl transition bg-gradient-to-b from-white/10 via-red-700/15 to-black/25 border-cyan-400/60`}
                  >
                    <h3 className="font-bold text-xl text-cyan-100 mb-1">{prediction.drug_name}</h3>
                    <p className="text-sm text-cyan-200 mb-2 tracking-widest">{prediction.location}</p>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-5xl font-extrabold tracking-tighter drop-shadow-lg">
                        {(prediction.shortage_probability * 100).toFixed(1)}%
                      </span>
                      <span className="text-base ml-2 text-cyan-300/80 font-bold">Risk Score</span>
                      {prediction.severity === 'critical' && <span className="text-3xl ml-3 animate-pulse">🚨</span>}
                    </div>
                    <div className="mt-2 mb-1 text-lg">
                      <span className="font-semibold text-cyan-100">AI Recommendation: </span><br />
                      <span className="font-bold text-white">{prediction.recommended_action}</span>
                    </div>
                    {txHash && (
                      <div className="mt-3 pt-3 text-xs font-mono text-cyan-100/70 break-all border-t border-cyan-900/30">
                        On-Chain Proof Hash:<br /><span className="select-all">{txHash}</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative backdrop-blur-2xl shadow-2xl rounded-3xl bg-white/10 border border-sky-400/30 p-8"
            >
              <div className="flex items-center gap-2 mb-5 text-xl font-bold text-blue-200 drop-shadow">
                <span>🧬</span>
                Drug Authenticity Scan
              </div>
              <div className="border-2 border-dashed border-sky-300/40 rounded-xl p-8 text-center bg-slate-100/5 hover:border-blue-300/80 transition-all cursor-pointer mb-5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setVerificationImage(e.target.files?.[0] || null)}
                  className="hidden"
                  id="drug-upload"
                />
                <label htmlFor="drug-upload" className="cursor-pointer">
                  <div className="text-6xl mb-2">📸</div>
                  <div className="font-bold text-white/90 mb-1">Upload Drug Image</div>
                  <div className="text-xs text-cyan-200 opacity-80">
                    {verificationImage ? verificationImage.name : 'Click to upload pill/packaging photo'}
                  </div>
                </label>
              </div>
              {verificationImage && (
                <button
                  onClick={verifyDrug}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold rounded-xl text-lg shadow-lg hover:scale-105 hover:from-cyan-400 hover:to-blue-400 transition disabled:opacity-50"
                  aria-label="Verify drug"
                  tabIndex={0}
                >
                  {loading ? '🔄 Scanning...' : '🔍 Verify Authenticity'}
                </button>
              )}
              <AnimatePresence>
                {verificationResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mt-6 p-6 rounded-xl border-2
                      ${verificationResult.is_authentic ? 'bg-green-800/10 border-green-400' : 'bg-red-800/10 border-red-400'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-4xl">{verificationResult.is_authentic ? '✅' : '⚠️'}</span>
                      <span className="text-right">
                        <span className="text-3xl font-bold">
                          {typeof verificationResult.confidence === 'number' 
                            ? (verificationResult.confidence * 100).toFixed(1)
                            : '--'}%
                        </span>
                        <div className="text-xs text-cyan-200/90">Confidence</div>
                      </span>
                    </div>
                    <div className="text-xl font-bold mb-2">
                      {verificationResult.is_authentic ? 'AUTHENTIC' : 'SUSPICIOUS'}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-cyan-100/70">Risk Level:</span>
                        <span className="font-bold uppercase">{verificationResult.risk_level || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-100/70">Anomaly Score:</span>
                        <span className="font-bold">
                          {typeof verificationResult.anomaly_score === 'number' 
                            ? verificationResult.anomaly_score.toFixed(3)
                            : '--'}
                        </span>
                      </div>
                    </div>
                    {verificationResult?.s3_url && (
                      <div className="mt-3 text-xs">
                        <a
                          className="text-blue-300 underline hover:text-blue-400"
                          href={verificationResult.s3_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          S3 Proof 🔗
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Lives Saved', value: '247', icon: '❤️' },
              { label: 'Predictions', value: prediction ? '1' : '0', icon: '📊' },
              { label: 'Fakes Caught', value: verificationResult ? '1' : '0', icon: '🚫' },
              { label: 'On-Chain', value: txHash ? '1' : '0', icon: '⛓️' }
            ].map((stat, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                key={i}
                className="backdrop-blur-lg bg-gradient-to-br from-gray-700/40 to-gray-900/40 border border-slate-800/70 rounded-xl p-6"
              >
                <div className="text-4xl mb-2 drop-shadow-xl">{stat.icon}</div>
                <div className="text-3xl font-bold mb-1 text-white/90 drop-shadow">{stat.value}</div>
                <div className="text-sm text-cyan-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </main>
        <HistoryPanel events={displayedHistory} />
      </div>
    </NoSSR>
  );
}
