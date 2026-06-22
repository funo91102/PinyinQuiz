import { Sparkles, Heart, ChevronRight } from 'lucide-react';
import type { LearningSubjectCode } from '../types/quiz';

interface LobbyProps {
  onStart: (subject: LearningSubjectCode) => void;
}

export default function Lobby({ onStart }: LobbyProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d1117] via-[#161b22] to-[#0d1117] text-white font-sans select-none overflow-hidden relative">

      {/* ── Cosmic Background Orbs ─────────────────────────────────────── */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[40%] left-[45%] w-[20%] h-[20%] bg-amber-400/8 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Main Container ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-12 relative z-10 text-center w-full">

        {/* Top Badge */}
        <div className="inline-flex items-center space-x-2 bg-amber-400/10 border border-amber-400/30 px-5 py-2 rounded-full mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-black text-amber-300 tracking-widest uppercase">
            孩子出國前的拼音小宇宙 · Bilingual Learning Universe
          </span>
        </div>

        {/* Title Group */}
        <div className="space-y-4 mb-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-stone-100 to-stone-300 bg-clip-text text-transparent drop-shadow-sm leading-tight">
            選擇你的王國
          </h1>
          <p className="text-base sm:text-lg text-stone-400 font-bold tracking-wide max-w-xl mx-auto">
            Choose your learning kingdom — 注音符號 or English Phonics
          </p>
        </div>

        {/* ── Dual Kingdom Gates ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl mt-10">

          {/* ① 注音挑戰王國 — Teal/Cyan */}
          <div className="relative group">
            {/* Glow backdrop */}
            <div className="absolute -inset-1 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-50 transition duration-500 pointer-events-none" />

            <button
              id="btn-kingdom-zhuyin"
              onClick={() => onStart('zhuyin')}
              className="relative w-full bg-gradient-to-br from-[#0d2b2b] via-[#0f3333] to-[#0a2020] border border-teal-500/40 hover:border-teal-400/70 rounded-3xl p-8 sm:p-10 flex flex-col items-start text-left cursor-pointer transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl overflow-hidden"
            >
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />

              {/* Kingdom badge */}
              <div className="flex items-center space-x-2 mb-5">
                <span className="bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                  注音王國
                </span>
                <span className="text-[10px] text-teal-400/60 font-bold">開放中</span>
              </div>

              {/* Big Emoji */}
              <div className="text-5xl sm:text-6xl mb-4 select-none drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                📚
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                注音挑戰王國
              </h2>
              <p className="text-sm text-teal-200/60 font-bold mb-6 leading-relaxed">
                掌握 37 個注音符號與拼音結構<br />
                拖曳・手寫・聽音・連連看
              </p>

              {/* CTA */}
              <div className="flex items-center space-x-2 text-teal-300 font-black text-sm group-hover:text-teal-200 transition-colors">
                <span>進入王國</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Bottom shimmer line */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
            </button>
          </div>

          {/* ② 英文拼音王國 — Purple/Indigo */}
          <div className="relative group">
            {/* Glow backdrop */}
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-50 transition duration-500 pointer-events-none" />

            <button
              id="btn-kingdom-phonics"
              onClick={() => onStart('phonics')}
              className="relative w-full bg-gradient-to-br from-[#1a1030] via-[#200d3a] to-[#150b28] border border-violet-500/40 hover:border-violet-400/70 rounded-3xl p-8 sm:p-10 flex flex-col items-start text-left cursor-pointer transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl overflow-hidden"
            >
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-400/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />

              {/* Kingdom badge */}
              <div className="flex items-center space-x-2 mb-5">
                <span className="bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                  Phonics Kingdom
                </span>
                <span className="text-[10px] text-violet-400/60 font-bold">NEW ✨</span>
              </div>

              {/* Big Emoji */}
              <div className="text-5xl sm:text-6xl mb-4 select-none drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                🔤
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                英文拼音王國
              </h2>
              <p className="text-sm text-violet-200/60 font-bold mb-6 leading-relaxed">
                English Natural Phonics for Kids<br />
                手寫四線三格・認字・自然發音
              </p>

              {/* CTA */}
              <div className="flex items-center space-x-2 text-violet-300 font-black text-sm group-hover:text-violet-200 transition-colors">
                <span>Enter Kingdom</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Bottom shimmer line */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
            </button>
          </div>
        </div>

        {/* Feature pills row */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {[
            { icon: '🎯', label: '拖曳圖卡答題' },
            { icon: '✍️', label: '手寫練習板' },
            { icon: '🔊', label: 'TTS 雙語發音' },
            { icon: '🤖', label: '弱項加權演算' },
            { icon: '🔗', label: '連連看挑戰' },
          ].map(pill => (
            <div
              key={pill.label}
              className="flex items-center space-x-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-1.5"
            >
              <span className="text-sm">{pill.icon}</span>
              <span className="text-xs font-bold text-stone-400">{pill.label}</span>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-[11px] text-stone-600 font-bold border-t border-white/5 bg-transparent z-10 flex items-center justify-center space-x-2">
        <Heart className="w-3 h-3 text-rose-500/60 fill-current animate-pulse" />
        <span>讓寶貝在探索中學習 · 台灣注音 × 英語自然發音</span>
      </footer>

    </div>
  );
}
