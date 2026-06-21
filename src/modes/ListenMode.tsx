import { useState, useEffect } from 'react';
import { Volume2, Check, ArrowRight, Sparkles } from 'lucide-react';
import allQuizzes from '../../quizzes_seed.json';
import VerticalZhuyin from '../components/VerticalZhuyin';
import { resolveUtteranceParameters } from '../types/quiz';

interface QuizItem {
  id: number;
  subject?: 'zhuyin' | 'phonics'; // V7.0: 學習科目維度，預設注音
  wordText: string;
  imageUrl: string;
  audioUrl: string;
  correctAnswer: {
    initial: string;
    medial: string;
    final: string;
    tone: string;
  };
}

interface Choice {
  spelling: string;
  correctAnswer: {
    initial: string;
    medial: string;
    final: string;
    tone: string;
  };
  isCorrect: boolean;
}

interface ListenModeProps {
  quiz: QuizItem;
  isLastQuestion: boolean;
  onCorrect: (hasMadeMistake: boolean) => void;
  onWrongAttempt: (wrongAnswer: { initial: string; medial: string; final: string; tone: string }) => void;
  onNext: () => void;
}

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
  const t = getToneDisplay(ans.tone);
  const toneChar = t === '¯' ? '' : t;
  
  if (ans.tone === '5') {
    return `•${initial}${medial}${final}`;
  }
  return `${initial}${medial}${final}${toneChar}`;
};

export default function ListenMode({
  quiz,
  isLastQuestion,
  onCorrect,
  onWrongAttempt,
  onNext
}: ListenModeProps) {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [selectedSpelling, setSelectedSpelling] = useState<string | null>(null);
  const [wrongSpellings, setWrongSpellings] = useState<string[]>([]);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [hasMadeMistake, setHasMadeMistake] = useState(false);

  // Initialize options when quiz item changes
  useEffect(() => {
    if (quiz) {
      setSelectedSpelling(null);
      setWrongSpellings([]);
      setLevelCompleted(false);
      setHasMadeMistake(false);

      const correctText = formatZhuyin(quiz.correctAnswer);
      
      // Filter candidates that are not the current quiz
      const candidates = allQuizzes.filter(q => q.id !== quiz.id && formatZhuyin(q.correctAnswer) !== correctText);

      // Map to unique spellings
      const uniqueMap = new Map<string, any>();
      candidates.forEach(q => {
        const spelling = formatZhuyin(q.correctAnswer);
        if (!uniqueMap.has(spelling)) {
          uniqueMap.set(spelling, q.correctAnswer);
        }
      });

      const spellingChoices = Array.from(uniqueMap.entries());
      const shuffledSpellings = spellingChoices.sort(() => Math.random() - 0.5);
      
      const distractors = shuffledSpellings.slice(0, 3).map(([spelling, ans]) => ({
        spelling,
        correctAnswer: ans,
        isCorrect: false
      }));

      const merged = [
        { spelling: correctText, correctAnswer: quiz.correctAnswer, isCorrect: true },
        ...distractors
      ].sort(() => Math.random() - 0.5);

      setChoices(merged);

      // Auto play pronunciation on load
      setTimeout(() => {
        playPronunciation(quiz);
      }, 500);
    }
  }, [quiz]);

  // V7.0: 雙語化 TTS 語音播放函式
  // 根據 quiz.subject 動態解析語言策略：
  //   - 'zhuyin'  → zh-TW, rate 0.70 (台灣中文偏慢，注音辨識用)
  //   - 'phonics' → en-US, rate 0.85 (兒童英語音素辨識用)
  const playPronunciation = (quiz: QuizItem) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(quiz.wordText);
      const { lang, rate } = resolveUtteranceParameters(quiz.subject ?? 'zhuyin');
      utterance.lang = lang;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Web Audio Synth
  const playSoundEffect = (success: boolean) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (success) {
        const notes = [1046.50, 1567.98, 2093.00];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + idx * 0.05 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.4);
          osc.start(ctx.currentTime + idx * 0.05);
          osc.stop(ctx.currentTime + idx * 0.05 + 0.4);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('Web Audio warning:', e);
    }
  };

  const handleChoiceClick = (choice: Choice) => {
    if (levelCompleted || wrongSpellings.includes(choice.spelling)) return;

    if (choice.isCorrect) {
      playSoundEffect(true);
      setSelectedSpelling(choice.spelling);
      setLevelCompleted(true);
      onCorrect(hasMadeMistake);
    } else {
      playSoundEffect(false);
      setHasMadeMistake(true);
      setWrongSpellings(prev => [...prev, choice.spelling]);
      onWrongAttempt(choice.correctAnswer);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-6 px-4 select-none relative">
      
      {/* Guidance Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center space-x-1.5 bg-sky-100/80 border border-sky-200 px-3 py-1 rounded-full text-xs font-black text-sky-850 shadow-inner animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>聽音選字挑戰</span>
        </span>
        <h2 className="text-lg sm:text-xl font-bold mt-2 text-stone-550">
          點擊中央發音鍵，在下方選出對應的正確注音！
        </h2>
      </div>

      {/* Audio Player Section */}
      <div className="mb-12 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Animated pulsing rings around the player */}
          <div className="absolute inset-0 bg-sky-400 rounded-full blur-xl opacity-20 animate-ping"></div>
          <button
            onClick={() => playPronunciation(quiz)}
            className="relative bg-gradient-to-br from-sky-400 to-indigo-500 hover:from-sky-350 hover:to-indigo-400 active:scale-95 transition-all text-white p-8 sm:p-10 rounded-full shadow-lg hover:shadow-sky-500/20 cursor-pointer flex items-center justify-center border-b-6 border-indigo-700"
            aria-label="播放單字發音"
          >
            <Volume2 className="w-14 h-14 sm:w-16 h-16 text-white" />
          </button>
        </div>
        <span className="text-xs text-stone-400 font-extrabold mt-4 tracking-wider uppercase">
          點擊按鈕重複播音
        </span>
      </div>

      {/* Four quadrant choices grid */}
      <div className="w-full max-w-xl grid grid-cols-2 gap-4">
        {choices.map((choice, idx) => {
          const isWrong = wrongSpellings.includes(choice.spelling);
          const isSelectedCorrect = selectedSpelling === choice.spelling;
          
          return (
            <button
              key={idx}
              disabled={levelCompleted || isWrong}
              onClick={() => handleChoiceClick(choice)}
              className={`py-6 px-4 rounded-3xl border-3 text-2xl sm:text-3xl font-black transition-all cursor-pointer shadow-sm select-none flex items-center justify-center
                ${isSelectedCorrect
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 scale-103'
                  : isWrong
                  ? 'border-red-450 bg-red-50 text-red-650 opacity-50 animate-shake'
                  : 'border-stone-200 bg-white hover:border-sky-300 hover:scale-102 hover:shadow-md text-stone-850 active:scale-98'
                }
              `}
            >
              <VerticalZhuyin correctAnswer={choice.correctAnswer} />
            </button>
          );
        })}
      </div>

      {/* Success Modal (only shown when NOT the last question) */}
      {levelCompleted && !isLastQuestion && (
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            
            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-450 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <h3 className="text-3xl font-black text-stone-850">聽音辨識正確！</h3>
              <p className="text-stone-550 mt-2 font-bold">
                太棒了！你選出了正確的注音「{selectedSpelling}」！
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex justify-around shadow-inner">
              <div>
                <span className="text-xs text-stone-450 font-bold block mb-1">拼音漢字</span>
                <span className="text-2xl font-black text-stone-850">
                  {quiz.wordText}
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-450 font-bold block mb-1">獲得分數</span>
                <span className="text-2xl font-black text-amber-600">+100</span>
              </div>
            </div>

            <button
              id="btn-next-level-listen"
              onClick={onNext}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-white font-bold py-4 px-6 rounded-2xl shadow-md flex items-center justify-center space-x-2 cursor-pointer border-b-4 border-emerald-700"
            >
              <span>下一關</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
