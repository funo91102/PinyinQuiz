import { Sparkles, Play, Heart } from 'lucide-react';

interface LobbyProps {
  onStart: () => void;
}

export default function Lobby({ onStart }: LobbyProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#faf8f5] to-[#f3eade] text-stone-850 font-sans select-none overflow-hidden relative">
      
      {/* Decorative Floating Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/40 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-200/30 rounded-full blur-[140px] animate-pulse pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 py-12 relative z-10 text-center">
        
        {/* Top Floating Badge */}
        <div className="inline-flex items-center space-x-2 bg-amber-100/80 border border-amber-250/30 px-4 py-2 rounded-full mb-8 shadow-sm animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-black text-amber-800 tracking-wide">
            孩子出國前的拼音小宇宙
          </span>
        </div>

        {/* Title Group */}
        <div className="space-y-4 mb-12">
          <h1 className="text-5xl sm:text-7xl font-black tracking-wider bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 bg-clip-text text-transparent drop-shadow-sm leading-tight">
            注音挑戰小學堂
          </h1>
          <p className="text-lg sm:text-2xl text-stone-605 font-bold tracking-wide">
            以拖曳圖卡開啟認字旅程，輕鬆學會 37 個注音符號與拼音結構！
          </p>
        </div>

        {/* Main Action Button */}
        <div className="relative group mb-16">
          {/* Pulsing button shadow glow */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 group-hover:scale-105 transition duration-500 animate-pulse"></div>
          
          <button
            id="btn-enter-kingdom"
            onClick={onStart}
            className="relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-2xl sm:text-3xl px-12 py-7 rounded-3xl shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-300 cursor-pointer flex items-center space-x-4 border-b-8 border-orange-700 hover:border-orange-600"
          >
            <span>📚 注音挑戰王國</span>
            <Play className="w-8 h-8 fill-current text-white animate-pulse" />
          </button>
        </div>

        {/* Features Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mt-4">
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border-2 border-amber-100/50 shadow-sm transition hover:scale-105 duration-300">
            <div className="w-12 h-12 bg-amber-100/80 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-600 font-extrabold text-xl">
              🎯
            </div>
            <h3 className="font-extrabold text-stone-800 text-lg mb-1">圖卡拖曳答題</h3>
            <p className="text-xs text-stone-500 font-bold">2/3 艙動態結構，手指拖曳直覺好玩</p>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border-2 border-emerald-100/50 shadow-sm transition hover:scale-105 duration-300">
            <div className="w-12 h-12 bg-emerald-100/80 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-600 font-extrabold text-xl">
              🔊
            </div>
            <h3 className="font-extrabold text-stone-800 text-lg mb-1">台灣真人發音</h3>
            <p className="text-xs text-stone-500 font-bold">內建 TTS 語音發音與歡樂互動音效</p>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border-2 border-sky-100/50 shadow-sm transition hover:scale-105 duration-300">
            <div className="w-12 h-12 bg-sky-100/80 rounded-xl flex items-center justify-center mx-auto mb-4 text-sky-600 font-extrabold text-xl">
              🤖
            </div>
            <h3 className="font-extrabold text-stone-800 text-lg mb-1">錯題追蹤分析</h3>
            <p className="text-xs text-stone-500 font-bold">本地資料庫與遠端 Webhook 自動記錄</p>
          </div>
        </div>

      </main>

      {/* Footer Info */}
      <footer className="py-6 text-center text-xs text-stone-400 font-bold border-t border-stone-200/40 bg-white/20 backdrop-blur-sm z-10 flex items-center justify-center space-x-2">
        <Heart className="w-3.5 h-3.5 text-rose-400 fill-current animate-pulse" />
        <span>讓寶貝在探索中學習 • 台灣注音啟蒙專用</span>
      </footer>

    </div>
  );
}
