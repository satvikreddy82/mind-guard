import { useState, useEffect } from 'react';
import { AlertOctagon, Heart, Phone, ShieldCheck, X, Compass, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
}

export default function EmergencyModal({ isOpen, onClose, studentName }: EmergencyModalProps) {
  // Grounding state
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Hold Empty'>('Inhale');
  const [timerCount, setTimerCount] = useState<number>(4);
  const [breathingActive, setBreathingActive] = useState<boolean>(true);

  // Grounding box breathing loop: 4-4-4-4
  useEffect(() => {
    if (!breathingActive || !isOpen) return;

    const interval = setInterval(() => {
      setTimerCount(prev => {
        if (prev <= 1) {
          // cycle phase
          setBreathingPhase(current => {
            switch (current) {
              case 'Inhale': return 'Hold';
              case 'Hold': return 'Exhale';
              case 'Exhale': return 'Hold Empty';
              case 'Hold Empty': return 'Inhale';
            }
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-all"
        onClick={onClose}
      />

      {/* Main glass box containment */}
      <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-2xl relative overflow-hidden z-10 animate-scale-up">
        
        {/* Rose background glow for alert */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-500 to-rose-600"></div>

        <button
          id="close-emergency-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          aria-label="Close Help screen"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-10 space-y-8">
          
          <div className="flex gap-4 items-start pb-6 border-b border-rose-100">
            <div className="p-3 bg-rose-500 rounded-2xl text-white shrink-0 animate-bounce">
              <AlertOctagon size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-rose-500">
                You Are Safe & Not Alone, {studentName || 'Friend'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Our rule-based system detected alarming distress indicators. We have raised support warnings. Let's ground ourselves immediately using the guided cycle below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Box Breathing Grounding section */}
            <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Wind size={12} className="text-emerald-500" />
                  <span>Interactive Grounding Box</span>
                </span>
                
                <button
                  id="toggle-breathing-btn"
                  onClick={() => setBreathingActive(!breathingActive)}
                  className="text-[10px] font-semibold text-emerald-500 hover:underline cursor-pointer"
                >
                  {breathingActive ? 'Pause loop' : 'Resume loop'}
                </button>
              </div>

              {/* Dynamic Breathing visual cycle spinner */}
              <div className="py-8 flex flex-col items-center justify-center space-y-4 relative">
                
                {/* Visual circle scale expand based on phase */}
                <div 
                  className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-[4000ms] ease-in-out ${
                    breathingPhase === 'Inhale' 
                      ? 'border-emerald-500 scale-110 bg-emerald-500/5' 
                      : breathingPhase === 'Exhale'
                        ? 'border-indigo-500 scale-95 bg-indigo-500/5'
                        : 'border-amber-400 scale-100 bg-amber-400/5'
                  }`}
                >
                  <span className="text-2xl font-black text-slate-900">{timerCount}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{breathingPhase}</span>
                </div>

                <p className="text-center text-xs font-semibold leading-relaxed max-w-xs">
                  {breathingPhase === 'Inhale' && 'Slowly draw cool oxygen into your nose...'}
                  {breathingPhase === 'Hold' && 'Gently hold this lung-space tranquil and stable.'}
                  {breathingPhase === 'Exhale' && 'Vocalize exhaling all heavy shoulder tensions...'}
                  {breathingPhase === 'Hold Empty' && 'Rest quietly inside this stillness before renewal.'}
                </p>
              </div>
            </div>

            {/* Helpline lists */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                24/7 Verified Emergency Helplines
              </span>

              <div className="space-y-3">
                <a 
                  href="tel:988" 
                  className="p-3.5 bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 rounded-xl flex items-center justify-between text-xs transition block"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="text-rose-500" size={16} />
                    <div>
                      <h4 className="font-bold text-slate-900">988 Suicide & Crisis Lifeline</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Immediate toll-free support dispatch</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-rose-500 uppercase">DIAL 988</span>
                </a>

                <div className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <Heart className="text-emerald-500" size={16} />
                    <div>
                      <h4 className="font-bold text-slate-900">Campus Counselling Wing</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">C Block, Room 102 (Mon-Fri 8AM-8PM)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">VISIT</span>
                </div>

                <div className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <Compass className="text-indigo-500" size={16} />
                    <div>
                      <h4 className="font-bold text-slate-950">Student Peer Support Circles</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Weekly confidential talking lounges</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-indigo-500 uppercase">JOIN INFO</span>
                </div>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
              <span>Notifications dispatched automatically to contacts & wellness center.</span>
            </div>

            <button
              id="confirm-safety-modal-btn"
              onClick={onClose}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition w-full sm:w-auto cursor-pointer"
            >
              Acknowledged, Grounded Now
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
