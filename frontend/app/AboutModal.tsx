'use client';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';

export function AboutModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set app element after mount to avoid SSR issues
    Modal.setAppElement('body');
  }, []);

  if (!mounted) return null;

  return (
    <Modal
      isOpen={show}
      onRequestClose={onClose}
      style={{
        overlay: { backgroundColor: 'rgba(10,0,20,0.8)', zIndex: 1000 },
        content: { 
          borderRadius: 20, 
          maxWidth: 500, 
          margin: 'auto', 
          background: '#18122B', 
          color: 'white', 
          border: 'none', 
          boxShadow: '0 8px 32px #0009' 
        }
      }}
      contentLabel="About MedChain Oracle"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">About MedChain Oracle</h2>
        <p className="mb-2">
          Built in 48 hours by a founder obsessed with <b>security</b>, <b>AI</b>, and <b>saving lives</b>.
        </p>
        <p className="mb-2">
          This is <b>not</b> a demo—every prediction, verification, and certificate hash you see is real,
          powered by live AI, minted on blockchain, and archived to AWS.
        </p>
        <hr className="my-4" />
        <p>
          <span className="font-bold">Enterprise ready:</span> Designed for hospitals, pharma, and regulators.
          Reach out for partnerships, offers, pilots, or to join me as a cofounder.
        </p>
        <div className="mt-6">
          <a
            href="mailto:your.email@hey.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gradient-to-r from-cyan-400 to-blue-500 text-center font-bold py-2 rounded-lg mb-3"
          >
            Contact Founder
          </a>
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
