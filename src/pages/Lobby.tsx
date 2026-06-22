import { Sparkles, Heart, ChevronRight } from 'lucide-react';
import type { LearningSubjectCode } from '../types/quiz';

interface LobbyProps {
  onStart: (subject: LearningSubjectCode) => void;
}

export default function Lobby({ onStart }: LobbyProps) {
  return (
    <div className="flex flex-col min-h-screen font-sans select-none overflow-hidden relative" style={{ background: 'linear-gradient(160deg, #fffbf0 0%, #fef3e2 30%, #fde8f5 60%, #e8f4fd 100%)' }}>

      {/* ── Warm Pastel Background Orbs ─────────────────────────────────── */}
      <div className="absolute top-[-10%] left-[-8%] w-[40%] h-[40%] bg-amber-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-8%] w-[45%] h-[45%] bg-pink-200/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] left-[40%] w-[25%] h-[25%] bg-sky-200/30 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Main Container ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-12 relative z-10 text-center w-full">

        {/* Top Badge */}
        <div className="inline-flex items-center space-x-2 bg-amber-100 border border-amber-300/60 px-5 py-2 rounded-full mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-xs font-black text-amber-600 tracking-widest uppercase">
            孩子的拼音小宇宙 · Bilingual Learning Universe
          </span>
        </div>

        {/* Title Group */}
        <div className="space-y-4 mb-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-amber-600 via-rose-500 to-violet-600 bg-clip-text text-transparent drop-shadow-sm leading-tight">
            選擇你的王國
          </h1>
          <p className="text-base sm:text-lg text-stone-500 font-bold tracking-wide max-w-xl mx-auto">
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
              className="relative w-full bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 border-2 border-teal-200 hover:border-teal-400 rounded-3xl p-8 sm:p-10 flex flex-col items-start text-left cursor-pointer transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl overflow-hidden shadow-md"
            >
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-teal-200/40 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />

              {/* Kingdom badge */}
              <div className="flex items-center space-x-2 mb-5">
                <span className="bg-teal-100 border border-teal-300 text-teal-700 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                  注音王國
                </span>
                <span className="text-[10px] text-teal-500 font-bold">開放中</span>
              </div>

              {/* Big Emoji */}
              <div className="text-5xl sm:text-6xl mb-4 select-none drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                📚
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-teal-800 mb-2 leading-tight">
                注音挑戰王國
              </h2>
              <p className="text-sm text-teal-600/80 font-bold mb-6 leading-relaxed">
                掌握 37 個注音符號與拼音結構<br />
                拖曳・手寫・聽音・連連看
              </p>

              {/* CTA */}
              <div className="flex items-center space-x-2 text-teal-600 font-black text-sm group-hover:text-teal-700 transition-colors">
                <span>進入王國</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Bottom shimmer line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent rounded-full" />
            </button>
          </div>

          {/* ② 英文拼音王國 — Purple/Indigo */}
          <div className="relative group">
            {/* Glow backdrop */}
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-50 transition duration-500 pointer-events-none" />

            <button
              id="btn-kingdom-phonics"
              onClick={() => onStart('phonics')}
              className="relative w-full bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 border-2 border-violet-200 hover:border-violet-400 rounded-3xl p-8 sm:p-10 flex flex-col items-start text-left cursor-pointer transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl overflow-hidden shadow-md"
            >
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-violet-200/40 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />

              {/* Kingdom badge */}
              <div className="flex items-center space-x-2 mb-5">
                <span className="bg-violet-100 border border-violet-300 text-violet-700 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                  Phonics Kingdom
                </span>
                <span className="text-[10px] text-violet-500 font-bold">NEW ✨</span>
              </div>

              {/* Big Emoji */}
              <div className="text-5xl sm:text-6xl mb-4 select-none drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                🔤
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-violet-800 mb-2 leading-tight">
                英文拼音王國
              </h2>
              <p className="text-sm text-violet-600/80 font-bold mb-6 leading-relaxed">
                English Natural Phonics for Kids<br />
                手寫四線三格・認字・自然發音
              </p>

              {/* CTA */}
              <div className="flex items-center space-x-2 text-violet-600 font-black text-sm group-hover:text-violet-700 transition-colors">
                <span>Enter Kingdom</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Bottom shimmer line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-300 to-transparent rounded-full" />
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
              className="flex items-center space-x-1.5 bg-white/70 border border-stone-200 rounded-full px-4 py-1.5 shadow-sm"
            >
              <span className="text-sm">{pill.icon}</span>
              <span className="text-xs font-bold text-stone-600">{pill.label}</span>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-[11px] text-stone-500 font-bold border-t border-stone-200/50 bg-transparent z-10 flex items-center justify-center space-x-2">
        <Heart className="w-3 h-3 text-rose-400 fill-current animate-pulse" />
        <span>讓寶貝在探索中學習 · 台灣注音 × 英語自然發音</span>
      </footer>

    </div>
  );
}
