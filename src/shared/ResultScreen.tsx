import { Trophy, Star, RotateCcw, LayoutGrid, Home, AlertCircle, Sparkles } from 'lucide-react';

interface WrongAttempt {
  quizId: number;
  wordText: string;
  correctAnswer: {
    initial: string;
    medial: string;
    final: string;
    tone: string;
  };
  wrongAnswer: {
    initial: string;
    medial: string;
    final: string;
    tone: string;
  };
}

interface ResultScreenProps {
  correctCount: number;
  totalCount: number;
  modeName: string;
  wrongAttempts: WrongAttempt[];
  onRestart: () => void;
  onSelectMode: () => void;
  onGoLobby: () => void;
}

// Emoji Dictionary matching core words to emojis
const EMOJI_MAP: Record<string, string> = {
  // Animals
  '貓': '🐱', '狗': '🐶', '象': '🐘', '獅': '🦁', '虎': '🐯', '鹿': '🦌',
  '馬': '🐴', '牛': '🐮', '鼠': '🐭', '猴': '🐵', '兔': '🐰', '狐': '🦊',
  '羊': '🐑', '豬': '🐷', '熊': '🐻', '鵝': '🦢', '豚': '🐬', '鯨': '🐳',
  '龜': '🐢', '章': '🐙', '蟹': '🦀', '蝦': '🦐', '魚': '🐟', '蛙': '🐸',
  '蜂': '🐝', '蝶': '🦋', '瓢': '🐞', '蜻': '🛸', '蝸': '🐌', '蟻': '🐜',
  '鳥': '🐦', '鷹': '🦅', '鴨': '🦆', '龍': '🦖', '鱷': '🐊', '懶': '🦥',
  '駝': '🐪', '蝟': '🦔', '鸚': '🦜',
  // Fruits/Vegetables
  '蘋': '🍎', '蕉': '🍌', '莓': '🍓', '瓜': '🍉', '葡': '🍇', '橘': '🍊',
  '芒': '🥭', '芭': '🥑', '鳳': '🍍', '檸': '🍋', '櫻': '🍒', '桃': '🍑',
  '荔': '🍒', '茄': '🍅', '玉': '🌽', '蘿': '🥕', '菜': '🥦'
};

const getWordEmoji = (word: string): string => {
  if (!word) return '📝';
  // Try matching characters of the word
  for (const char of word) {
    if (EMOJI_MAP[char]) return EMOJI_MAP[char];
  }
  return '📝';
};

const getToneDisplay = (tone: string) => {
  switch (tone) {
    case '1': return '¯';
    case '2': return 'ˊ';
    case '3': return 'ˇ';
    case '4': return 'ˋ';
    case '5': return '•';
    default: return tone;
  }
};

const formatZhuyin = (ans: { initial: string; medial: string; final: string; tone: string }) => {
  const initial = ans.initial || '';
  const medial = ans.medial || '';
  const final = ans.final || '';
  // Traditional Zhuyin tone 1 is usually not written out, but we can render it or display it cleanly.
  // Let's omit '¯' for standard look, or show it. Let's omit '¯' if it is standard, otherwise show.
  const t = getToneDisplay(ans.tone);
  const toneChar = t === '¯' ? '' : t;
  
  if (ans.tone === '5') {
    // Light tone is usually written as • before the word in traditional, or here as a suffix. Let's make it standard:
    return `•${initial}${medial}${final}`;
  }
  return `${initial}${medial}${final}${toneChar}`;
};

export default function ResultScreen({
  correctCount,
  totalCount,
  modeName,
  wrongAttempts,
  onRestart,
  onSelectMode,
  onGoLobby
}: ResultScreenProps) {
  // Star logic: 3 stars for >= 14, 2 stars for >= 10, 1 star for >= 5, 0 stars otherwise
  let starCount = 0;
  if (correctCount >= 14) starCount = 3;
  else if (correctCount >= 10) starCount = 2;
  else if (correctCount >= 5) starCount = 1;

  const scorePercentage = Math.round((correctCount / totalCount) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#faf8f5] to-[#f0e6d6] text-stone-850 font-sans select-none pb-12 overflow-y-auto">
      
      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10 flex flex-col items-center justify-center space-y-8">
        
        {/* Animated Trophy Header */}
        <div className="relative text-center">
          <div className="absolute inset-0 bg-amber-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="w-24 h-24 bg-amber-100 border-3 border-amber-400 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-md">
            <Trophy className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-stone-850 mt-4 tracking-wide">
            挑戰學習大成功！
          </h2>
          <p className="text-stone-400 text-xs font-bold mt-1 tracking-wider uppercase">
            挑戰模式：{modeName}
          </p>
        </div>

        {/* Stars Display */}
        <div className="flex justify-center space-x-3 py-2">
          {[1, 2, 3].map((num) => {
            const isFilled = num <= starCount;
            return (
              <div key={num} className="relative">
                <Star
                  className={`w-14 h-14 transition-all duration-700 ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400 drop-shadow-md scale-110 animate-bounce'
                      : 'text-stone-300'
                  }`}
                  style={{ animationDelay: `${num * 150}ms` }}
                />
                {isFilled && (
                  <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Score Card */}
        <div className="bg-white border-2 border-stone-200/80 rounded-3xl p-6 shadow-sm w-full space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100">
            <span className="text-stone-500 font-bold">答對題數</span>
            <span className="text-xl font-black text-stone-800">
              {correctCount} / {totalCount} 題
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-stone-100">
            <span className="text-stone-500 font-bold">答對率</span>
            <span className="text-xl font-black text-emerald-600">
              {scorePercentage}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-500 font-bold">獲得星星</span>
            <span className="text-xl font-black text-amber-600 flex items-center space-x-1">
              <span>{starCount}</span>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </span>
          </div>
        </div>

        {/* Wrong Answers Review List */}
        {wrongAttempts.length > 0 ? (
          <div className="bg-white border-2 border-stone-200/80 rounded-3xl p-6 shadow-sm w-full space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-100 text-stone-700">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <h3 className="font-extrabold text-base text-stone-800">錯題回顧清單</h3>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {wrongAttempts.map((attempt, idx) => {
                const emoji = getWordEmoji(attempt.wordText);
                const correctStr = formatZhuyin(attempt.correctAnswer);
                const wrongStr = formatZhuyin(attempt.wrongAnswer);
                
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-2xl bg-stone-50 border border-stone-150 hover:bg-stone-100/40 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl" role="img" aria-label={attempt.wordText}>
                        {emoji}
                      </span>
                      <span className="font-extrabold text-stone-850">{attempt.wordText}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm font-bold text-stone-600">
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl border border-emerald-150">
                        {correctStr}
                      </span>
                      <span className="text-stone-400">→</span>
                      <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-xl border border-rose-150">
                        你答了 {wrongStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-100/50 rounded-3xl p-6 shadow-sm w-full text-center space-y-2">
            <div className="text-3xl">🎉</div>
            <h3 className="font-black text-emerald-800 text-lg">無懈可擊！完美全對</h3>
            <p className="text-xs text-emerald-600 font-bold">
              你這次挑戰沒有答錯任何題目，太棒了！繼續保持喔！
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 w-full pt-4">
          <button
            onClick={onRestart}
            className="w-full bg-amber-500 hover:bg-amber-400 active:scale-98 transition-all text-white font-extrabold py-4 px-6 rounded-2xl shadow-md cursor-pointer flex items-center justify-center space-x-2 border-b-4 border-amber-700"
          >
            <RotateCcw className="w-5 h-5" />
            <span>再玩一輪</span>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onSelectMode}
              className="bg-white hover:bg-stone-50 border-2 border-stone-200 active:scale-98 transition-all text-stone-700 font-extrabold py-3.5 px-4 rounded-2xl shadow-sm cursor-pointer flex items-center justify-center space-x-2"
            >
              <LayoutGrid className="w-4 h-4 text-stone-500" />
              <span>換個模式</span>
            </button>
            
            <button
              onClick={onGoLobby}
              className="bg-white hover:bg-stone-50 border-2 border-stone-200 active:scale-98 transition-all text-stone-700 font-extrabold py-3.5 px-4 rounded-2xl shadow-sm cursor-pointer flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4 text-stone-500" />
              <span>回大廳</span>
            </button>
          </div>
        </div>

      </main>

    </div>
  );
}
