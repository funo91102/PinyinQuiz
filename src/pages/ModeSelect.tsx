import { ArrowLeft, Lock, Sparkles } from 'lucide-react';
import type { LearningSubjectCode } from '../types/quiz';

interface ModeSelectProps {
  subject: LearningSubjectCode;
  onBack: () => void;
  onSelectMode: (modeId: string) => void;
}

interface GameMode {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  badge: string;
  enabled: boolean;
}

export default function ModeSelect({ subject, onBack, onSelectMode }: ModeSelectProps) {
  const isPhonics = subject === 'phonics';

  const modes: GameMode[] = isPhonics
    ? [
        {
          id: 'handwriting',
          name: 'Mode 1：四線三格手寫板',
          desc: '在標準英文四線三格畫布上手寫單字，由家長裁決筆跡，同步 TTS 英語發音輔助。',
          icon: '✍️',
          color: 'from-violet-400 to-indigo-500 border-violet-300 shadow-violet-500/10 text-violet-800',
          badge: '開放中',
          enabled: true,
        },
        {
          id: 'listening',
          name: 'Mode 2：聽音選字關卡',
          desc: '聆聽英文 TTS 發音，在複數個單字圖卡中選出正確答案，訓練音素辨識能力。',
          icon: '🎧',
          color: 'from-sky-400 to-indigo-500 border-sky-300 shadow-sky-500/10 text-sky-850',
          badge: '開放中',
          enabled: true,
        },
        {
          id: 'drag-drop',
          name: 'Mode 3：字母拼組答題',
          desc: '拖放字母積木，拼湊出英文單字的完整拼字結構，訓練字形記憶。',
          icon: '🧩',
          color: 'from-amber-400 to-orange-500 border-amber-300 shadow-amber-500/10 text-amber-800',
          badge: '開放中',
          enabled: true,
        },
        {
          id: 'matching',
          name: 'Mode 4：連連看挑戰',
          desc: '將英文單字卡片與正確的圖片連線，強化圖文對應與詞彙記憶。',
          icon: '🔗',
          color: 'from-emerald-400 to-teal-500 border-emerald-300 shadow-emerald-500/10 text-emerald-850',
          badge: '開放中',
          enabled: true,
        },
        {
          id: 'mixed',
          name: 'Mode 5：混合冒險模式',
          desc: '綜合手寫與拖曳兩種英文模式隨機出題，搭配弱項加權演算法，終極挑戰英文拼音實力！',
          icon: '🌀',
          color: 'from-rose-400 to-pink-500 border-rose-300 shadow-rose-500/10 text-rose-800',
          badge: '開放中',
          enabled: true,
        },
      ]
    : [
        {
          id: 'drag-drop',
          name: 'Mode 1：拖曳圖卡答題',
          desc: '拖放聲母、介母、韻母與聲調，拼湊出完整的中文字注音結構。',
          icon: '🧩',
          color: 'from-amber-400 to-orange-500 border-amber-300 shadow-amber-500/10 text-amber-800',
          badge: '開放中',
          enabled: true,
        },
        {
          id: 'matching',
          name: 'Mode 2：連連看挑戰',
          desc: '將注音卡片與正確的單字圖片連線，訓練視覺與聽覺對應。',
          icon: '🔗',
          color: 'from-emerald-400 to-teal-500 border-emerald-300 shadow-emerald-500/10 text-emerald-850',
          badge: '開放中',
          enabled: true,
        },
        {
          id: 'handwriting',
          name: 'Mode 3：手寫挑戰板',
          desc: '利用繪圖板手寫練習注音字體，並由家長實時驗證筆跡成果。',
          icon: '✍️',
          color: 'from-rose-400 to-pink-500 border-rose-300 shadow-rose-500/10 text-rose-800',
          badge: '開放中',
          enabled: true,
        },
        {
          id: 'listening',
          name: 'Mode 4：聽音選字關卡',
          desc: '聆聽發音，在複數個注音符號中選出正確的讀音卡片。',
          icon: '🎧',
          color: 'from-sky-400 to-indigo-500 border-sky-300 shadow-sky-500/10 text-sky-850',
          badge: '開放中',
          enabled: true,
        },
        {
          id: 'mixed',
          name: 'Mode 5：混合冒險模式',
          desc: '綜合手寫與拖曳兩種模式隨機出題，搭配錯題加權抽題演算法，終極測驗孩子的注音實力！',
          icon: '🌀',
          color: 'from-violet-400 to-purple-500 border-violet-300 shadow-violet-500/10 text-violet-850',
          badge: '開放中',
          enabled: true,
        },
      ];

  const kingdomTitle = isPhonics ? '英文拼音王國' : '注音挑戰王國';
  const kingdomSubtitle = isPhonics
    ? 'English Phonics — 選擇你的練習模式'
    : '請選擇你的注音冒險任務';
  const kingdomAccent = isPhonics
    ? 'text-violet-500'
    : 'text-amber-500';

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#faf8f5] to-[#ece3d5] text-stone-850 font-sans select-none pb-12">

      {/* Top Header */}
      <header className="px-6 py-5 bg-white/85 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-stone-600 hover:text-stone-850 transition-colors bg-stone-100 hover:bg-stone-200/80 px-4 py-2 rounded-2xl font-bold cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回大廳</span>
        </button>
        <h1 className="text-xl font-black tracking-wide text-stone-850 flex items-center space-x-2">
          <Sparkles className={`w-5 h-5 ${kingdomAccent}`} />
          <span>{kingdomTitle}</span>
        </h1>
        <div className="w-24 hidden sm:block"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col justify-center">

        {/* Intro */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-stone-850 tracking-wider">
            {kingdomSubtitle}
          </h2>
          <p className="text-stone-500 font-bold mt-2 text-sm">
            {isPhonics
              ? '從手寫練習到聽音辨字，多元模式全面培養英文自然發音能力。'
              : '本專案正處於 V7 迭代階段，已為您備好最核心的拖曳圖卡互動答題模式。'}
          </p>
        </div>

        {/* Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

          {modes.map((mode) => {
            if (mode.enabled) {
              return (
                <div
                  key={mode.id}
                  id={`mode-card-${mode.id}`}
                  onClick={() => onSelectMode(mode.id)}
                  className={`bg-white border-3 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer flex flex-col justify-between group ${mode.color}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-4xl">{mode.icon}</span>
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        {mode.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-black mb-2 text-stone-850 group-hover:text-amber-600 transition-colors">
                      {mode.name}
                    </h3>
                    <p className="text-xs text-stone-550 font-bold leading-relaxed">
                      {mode.desc}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-end text-sm font-black text-amber-600 group-hover:translate-x-1 transition-transform">
                    <span>開始遊玩</span>
                    <span className="ml-1">➔</span>
                  </div>
                </div>
              );
            } else {
              return (
                <div
                  key={mode.id}
                  className="bg-stone-100/60 border-2 border-dashed border-stone-250 rounded-3xl p-6 flex flex-col justify-between relative opacity-75 overflow-hidden select-none"
                >
                  <div className="absolute right-[-20px] bottom-[-20px] text-stone-200/20 pointer-events-none">
                    <Lock className="w-32 h-32" />
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-4xl filter grayscale opacity-60">{mode.icon}</span>
                      <span className="bg-stone-200 text-stone-500 text-xs font-black px-3 py-1 rounded-full flex items-center space-x-1 border border-stone-300">
                        <Lock className="w-3 h-3" />
                        <span>{mode.badge}</span>
                      </span>
                    </div>
                    <h3 className="text-xl font-black mb-2 text-stone-400">{mode.name}</h3>
                    <p className="text-xs text-stone-400 font-medium leading-relaxed">{mode.desc}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-end text-xs font-bold text-stone-400">
                    <span>即將開放</span>
                  </div>
                </div>
              );
            }
          })}

        </div>

      </main>

    </div>
  );
}
