import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Check, ArrowRight } from 'lucide-react';
import imageWordMap from '../imageWordMap.json';

interface QuizItem {
  id: number;
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

interface CardItem {
  id: string;
  symbol: string;
  type: 'initial' | 'medial' | 'final' | 'tone';
}

interface ActiveDragState {
  cardId: string;
  symbol: string;
  type: 'initial' | 'medial' | 'final' | 'tone';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface DragModeProps {
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

const TONE_CARDS = [
  { symbol: '5', display: '•', label: '輕聲' },
  { symbol: '1', display: '¯', label: '一聲' },
  { symbol: '2', display: 'ˊ', label: '二聲' },
  { symbol: '3', display: 'ˇ', label: '三聲' },
  { symbol: '4', display: 'ˋ', label: '四聲' },
];

const ENCOURAGEMENTS = [
  '差一點點囉！再試一次，你一定可以的！',
  '看一看，是不是選到長得很像的符號了呢？再挑戰一次！',
  '別氣餒！多試幾次，你一定會成功的！',
  '沒關係，我們再來找找看正確的注音卡片吧！'
];

export default function DragMode({
  quiz,
  isLastQuestion,
  onCorrect,
  onWrongAttempt,
  onNext
}: DragModeProps) {
  const [cardPool, setCardPool] = useState<CardItem[]>([]);
  const [placedAnswers, setPlacedAnswers] = useState<{
    initial: string | null;
    medial: string | null;
    final: string | null;
    tone: string | null;
    [key: string]: string | null;
  }>({
    initial: null,
    medial: null,
    final: null,
    tone: null
  });

  const [wrongPlacedAnswers, setWrongPlacedAnswers] = useState<{
    initial: string | null;
    medial: string | null;
    final: string | null;
    tone: string | null;
    [key: string]: string | null;
  }>({
    initial: null,
    medial: null,
    final: null,
    tone: null
  });

  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [hoveredZone, setHoveredZone] = useState<'initial' | 'medial' | 'final' | 'tone' | null>(null);
  const [errorZones, setErrorZones] = useState<{
    initial: boolean;
    medial: boolean;
    final: boolean;
    tone: boolean;
    [key: string]: boolean;
  }>({
    initial: false,
    medial: false,
    final: false,
    tone: false
  });

  const [levelCompleted, setLevelCompleted] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [encouragementMsg, setEncouragementMsg] = useState('');
  const [isResettingWrong, setIsResettingWrong] = useState(false);
  const [hasMadeMistake, setHasMadeMistake] = useState(false);

  const initialZoneRef = useRef<HTMLDivElement>(null);
  const medialZoneRef = useRef<HTMLDivElement>(null);
  const finalZoneRef = useRef<HTMLDivElement>(null);
  const toneZoneRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const hasMedial = quiz && quiz.correctAnswer.medial && quiz.correctAnswer.medial.trim() !== "";

  // Resolve word and core character for highlight
  const getWordDetails = (imageUrl: string, defaultWord: string) => {
    const parts = imageUrl.split('/');
    const fileName = parts[parts.length - 1];
    const mapData = (imageWordMap as Record<string, { word: string; core: string }>)[fileName];
    if (mapData) {
      return {
        word: mapData.word,
        core: mapData.core
      };
    }
    return {
      word: defaultWord,
      core: defaultWord
    };
  };

  const { word, core } = getWordDetails(quiz.imageUrl, quiz.wordText);

  // Initialize for new quiz item
  useEffect(() => {
    if (quiz) {
      setPlacedAnswers({ initial: null, medial: null, final: null, tone: null });
      setWrongPlacedAnswers({ initial: null, medial: null, final: null, tone: null });
      setErrorZones({ initial: false, medial: false, final: false, tone: false });
      setLevelCompleted(false);
      setHasMadeMistake(false);

      const correct = quiz.correctAnswer;
      const quizHasMedial = correct.medial && correct.medial.trim() !== "";

      const INITIALS_LIST = ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ'];
      const MEDIALS_LIST = ['ㄧ', 'ㄨ', 'ㄩ'];
      const FINALS_LIST = ['ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ', 'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ'];

      const potentialInitials = INITIALS_LIST.filter(s => s !== correct.initial);
      const potentialFinals = FINALS_LIST.filter(s => s !== correct.final);
      const potentialMedials = MEDIALS_LIST.filter(s => s !== correct.medial);

      const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

      const distInitials = shuffle(potentialInitials).slice(0, 2);
      const distFinals = shuffle(potentialFinals).slice(0, 2);

      const pool: CardItem[] = [];
      if (correct.initial) {
        pool.push({ id: `correct-initial`, symbol: correct.initial, type: 'initial' });
      }
      if (quizHasMedial && correct.medial) {
        pool.push({ id: `correct-medial`, symbol: correct.medial, type: 'medial' });
      }
      if (correct.final) {
        pool.push({ id: `correct-final`, symbol: correct.final, type: 'final' });
      }

      distInitials.forEach((s, i) => {
        pool.push({ id: `dist-initial-${i}`, symbol: s, type: 'initial' });
      });
      distFinals.forEach((s, i) => {
        pool.push({ id: `dist-final-${i}`, symbol: s, type: 'final' });
      });
      if (quizHasMedial) {
        potentialMedials.forEach((s, i) => {
          pool.push({ id: `dist-medial-${i}`, symbol: s, type: 'medial' });
        });
      }

      setCardPool(shuffle(pool));

      setTimeout(() => {
        playPronunciation(quiz.wordText);
      }, 500);
    }
  }, [quiz]);

  // ── 全域 body 鎖定已移除：改為在各拖曳積木上局部使用 passive:false ──

  // Check completion
  useEffect(() => {
    if (!quiz) return;
    const correct = quiz.correctAnswer;
    const isInitialMatched = !correct.initial || placedAnswers.initial === correct.initial;
    const isMedialMatched = !hasMedial || placedAnswers.medial === correct.medial;
    const isFinalMatched = !correct.final || placedAnswers.final === correct.final;
    const isToneMatched = !correct.tone || placedAnswers.tone === correct.tone;

    if (isInitialMatched && isMedialMatched && isFinalMatched && isToneMatched) {
      if (!levelCompleted) {
        setLevelCompleted(true);
        playSoundEffect(true);
        onCorrect(hasMadeMistake);
      }
    }
  }, [placedAnswers, quiz, hasMadeMistake, levelCompleted, hasMedial]);

  // Speech Synthesizer
  const playPronunciation = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'zh-TW';
      utterance.rate = 0.75;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Web Audio sound generator
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
      console.warn('Web Audio not fully active:', e);
    }
  };

  // Drag Handlers
  const handleDragStart = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
    card: CardItem
  ) => {
    const isWrongPlaced = wrongPlacedAnswers.initial !== null ||
                          wrongPlacedAnswers.medial !== null ||
                          wrongPlacedAnswers.final !== null ||
                          wrongPlacedAnswers.tone !== null;
    if (showEncouragement || levelCompleted || isWrongPlaced || isResettingWrong) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setActiveDrag({
      cardId: card.id,
      symbol: card.symbol,
      type: card.type,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
    });
  };

  const handleDragStartTone = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
    symbol: string
  ) => {
    const isWrongPlaced = wrongPlacedAnswers.initial !== null ||
                          wrongPlacedAnswers.medial !== null ||
                          wrongPlacedAnswers.final !== null ||
                          wrongPlacedAnswers.tone !== null;
    if (showEncouragement || levelCompleted || isWrongPlaced || isResettingWrong) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setActiveDrag({
      cardId: `fixed-tone-${symbol}`,
      symbol,
      type: 'tone',
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
    });
  };

  useEffect(() => {
    if (!activeDrag) return;

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (e.type === 'touchmove') {
        e.preventDefault();
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      setActiveDrag(prev => prev ? { ...prev, currentX: clientX, currentY: clientY } : null);

      const zone = checkCollision(clientX, clientY);
      setHoveredZone(zone);
    };

    const handleEnd = (e: TouchEvent | MouseEvent) => {
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

      handleDragRelease(clientX, clientY);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [activeDrag]);

  const checkCollision = (x: number, y: number): 'initial' | 'medial' | 'final' | 'tone' | null => {
    const initialRect = initialZoneRef.current?.getBoundingClientRect();
    const medialRect = medialZoneRef.current?.getBoundingClientRect();
    const finalRect = finalZoneRef.current?.getBoundingClientRect();
    const toneRect = toneZoneRef.current?.getBoundingClientRect();

    if (initialRect && x >= initialRect.left && x <= initialRect.right && y >= initialRect.top && y <= initialRect.bottom) {
      return 'initial';
    }
    if (hasMedial && medialRect && x >= medialRect.left && x <= medialRect.right && y >= medialRect.top && y <= medialRect.bottom) {
      return 'medial';
    }
    if (finalRect && x >= finalRect.left && x <= finalRect.right && y >= finalRect.top && y <= finalRect.bottom) {
      return 'final';
    }
    if (toneRect && x >= toneRect.left && x <= toneRect.right && y >= toneRect.top && y <= toneRect.bottom) {
      return 'tone';
    }
    return null;
  };

  const handleDragRelease = (clientX: number, clientY: number) => {
    if (!activeDrag) return;

    const { cardId, symbol, type } = activeDrag;
    const targetZone = checkCollision(clientX, clientY);

    if (targetZone) {
      const correctAnswer = quiz.correctAnswer[targetZone];
      
      if (targetZone === type && symbol === correctAnswer) {
        setPlacedAnswers(prev => ({ ...prev, [targetZone]: symbol }));
        if (!cardId.startsWith('fixed-tone-')) {
          setCardPool(prev => prev.filter(c => c.id !== cardId));
        }
      } else {
        playSoundEffect(false);
        setHasMadeMistake(true);

        const wrongAnswerObj = {
          initial: targetZone === 'initial' ? symbol : placedAnswers.initial || '',
          medial: targetZone === 'medial' ? symbol : placedAnswers.medial || '',
          final: targetZone === 'final' ? symbol : placedAnswers.final || '',
          tone: targetZone === 'tone' ? symbol : placedAnswers.tone || quiz.correctAnswer.tone // fallback to correct or placeholder
        };

        // Trigger telemetry / logger on the parent
        onWrongAttempt(wrongAnswerObj);

        // Put the wrong symbol temporarily in the drop cabin
        setWrongPlacedAnswers(prev => ({ ...prev, [targetZone]: symbol }));

        // Trigger shake styles
        setErrorZones(prev => ({ ...prev, [targetZone]: true }));
        setTimeout(() => {
          setErrorZones(prev => ({ ...prev, [targetZone]: false }));
        }, 500);

        // Warm encouragement popup after 1.5 seconds
        setTimeout(() => {
          setEncouragementMsg(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
          setShowEncouragement(true);
        }, 1500);
      }
    }

    setActiveDrag(null);
    setHoveredZone(null);
  };

  const handleCloseEncouragement = () => {
    setIsResettingWrong(true);
    setShowEncouragement(false);
    setTimeout(() => {
      setWrongPlacedAnswers({ initial: null, medial: null, final: null, tone: null });
      setErrorZones({ initial: false, medial: false, final: false, tone: false });
      setIsResettingWrong(false);
    }, 300);
  };

  // Responsive styling
  const cabinSizeClass = "w-12 h-12 md:w-20 md:h-20";
  const toneSizeClass = "w-14 h-14 md:w-20 md:h-20";
  const letterTextSize = "text-xl md:text-3xl";
  const toneTextSize = "text-xl md:text-3xl";

  return (
    <div className="max-w-6xl mx-auto w-full min-h-[100dvh] h-auto bg-gray-50 flex flex-col gap-4 p-3 pb-10 select-none relative">
      
      {/* Word Card & Audio Pronounce (Top) */}
      <div className="shrink-0 flex flex-row items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm w-full">
        <div className="flex items-center gap-3">
            <div className="bg-stone-50 border border-stone-200/60 rounded-xl overflow-hidden shadow-inner">
              <img
                src={quiz.imageUrl}
                alt={quiz.wordText}
                className="w-20 h-20 md:w-24 md:h-24 object-contain p-1 select-none pointer-events-none"
              />
            </div>

            <div className="text-left">
              <span className="text-2xl md:text-4xl font-extrabold text-stone-850 drop-shadow-sm flex items-center tracking-wide">
                {Array.from(word).map((char, index) => {
                  if (char === core) {
                    return (
                      <span key={index} className="text-2xl md:text-4xl font-black text-emerald-600 inline-block px-0.5 animate-bounce">
                        {char}
                      </span>
                    );
                  }
                  return (
                    <span key={index} className="text-stone-400 text-lg md:text-3xl font-bold inline-block">
                      {char}
                    </span>
                  );
                })}
              </span>
              <span className="text-[9px] md:text-[10px] text-stone-450 block mt-0.5 font-bold tracking-widest uppercase">
                請拖曳組合高亮字的注音
              </span>
            </div>
          </div>

          <button
            onClick={() => playPronunciation(quiz.wordText)}
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-white p-2.5 md:p-3 rounded-full shadow-md flex items-center justify-center cursor-pointer"
            aria-label="播放讀音"
          >
            <Volume2 className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </button>
        </div>

      {/* Drop zones / space cabins (Middle) - 台灣直式注音結構 */}
      <div className="h-auto shrink-0 bg-white rounded-2xl px-3 py-6 md:px-6 flex flex-row justify-center items-center gap-6 md:gap-10 w-full shadow-sm">

        {/* 左側：聲母 + 介母 + 韻母（由上往下垂直堆疊） */}
        <div className="flex flex-col gap-4 items-center">

          {/* Initial (聲母) */}
          <div
            ref={initialZoneRef}
            className={`relative ${cabinSizeClass} rounded-xl md:rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-sm overflow-hidden ${
              placedAnswers.initial
                ? 'border-teal-500 bg-teal-50/50 text-teal-800'
                : (wrongPlacedAnswers.initial && !isResettingWrong)
                ? `border-red-450 bg-red-50 text-red-700 ${errorZones.initial ? 'animate-shake' : ''}`
                : hoveredZone === 'initial'
                ? 'border-teal-400 bg-teal-50/20 scale-105 shadow-teal-500/10'
                : errorZones.initial
                ? 'border-red-500 bg-red-50 text-red-650 animate-shake'
                : 'border-dashed border-stone-300 bg-stone-50 text-stone-400'
            }`}
          >
            <span className="absolute top-0.5 text-[7px] md:text-[9px] font-bold tracking-wider opacity-50">聲</span>
            {placedAnswers.initial ? (
              <span className={`${letterTextSize} font-extrabold`}>{placedAnswers.initial}</span>
            ) : wrongPlacedAnswers.initial ? (
              <span className={`${letterTextSize} font-extrabold text-red-500 transition-all duration-300 ${isResettingWrong ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                {wrongPlacedAnswers.initial}
              </span>
            ) : (
              <span className="text-[9px] md:text-xs text-stone-400 font-bold">聲母</span>
            )}
            {placedAnswers.initial && (
              <div className="absolute bottom-0.5 bg-teal-100 p-0.5 rounded-full">
                <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-teal-650" />
              </div>
            )}
          </div>

          {/* Medial (介母) */}
          {hasMedial && (
            <div
              ref={medialZoneRef}
              className={`relative ${cabinSizeClass} rounded-xl md:rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-sm overflow-hidden ${
                placedAnswers.medial
                  ? 'border-teal-500 bg-teal-50/50 text-teal-800'
                  : (wrongPlacedAnswers.medial && !isResettingWrong)
                  ? `border-red-450 bg-red-50 text-red-700 ${errorZones.medial ? 'animate-shake' : ''}`
                  : hoveredZone === 'medial'
                  ? 'border-teal-400 bg-teal-50/20 scale-105 shadow-teal-500/10'
                  : errorZones.medial
                  ? 'border-red-500 bg-red-50 text-red-650 animate-shake'
                  : 'border-dashed border-stone-300 bg-stone-50 text-stone-400'
              }`}
            >
              <span className="absolute top-0.5 text-[7px] md:text-[9px] font-bold tracking-wider opacity-50">介</span>
              {placedAnswers.medial ? (
                <span className={`${letterTextSize} font-extrabold`}>{placedAnswers.medial}</span>
              ) : wrongPlacedAnswers.medial ? (
                <span className={`${letterTextSize} font-extrabold text-red-500 transition-all duration-300 ${isResettingWrong ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                  {wrongPlacedAnswers.medial}
                </span>
              ) : (
                <span className="text-[9px] md:text-xs text-stone-400 font-bold">介母</span>
              )}
              {placedAnswers.medial && (
                <div className="absolute bottom-0.5 bg-teal-100 p-0.5 rounded-full">
                  <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-teal-650" />
                </div>
              )}
            </div>
          )}

          {/* Final (韻母) */}
          <div
            ref={finalZoneRef}
            className={`relative ${cabinSizeClass} rounded-xl md:rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-sm overflow-hidden ${
              placedAnswers.final
                ? 'border-teal-500 bg-teal-50/50 text-teal-800'
                : (wrongPlacedAnswers.final && !isResettingWrong)
                ? `border-red-450 bg-red-50 text-red-700 ${errorZones.final ? 'animate-shake' : ''}`
                : hoveredZone === 'final'
                ? 'border-rose-400 bg-rose-50/20 scale-105 shadow-rose-500/10'
                : errorZones.final
                ? 'border-red-500 bg-red-50 text-red-650 animate-shake'
                : 'border-dashed border-stone-300 bg-stone-50 text-stone-400'
            }`}
          >
            <span className="absolute top-0.5 text-[7px] md:text-[9px] font-bold tracking-wider opacity-50">韻</span>
            {placedAnswers.final ? (
              <span className={`${letterTextSize} font-extrabold`}>{placedAnswers.final}</span>
            ) : wrongPlacedAnswers.final ? (
              <span className={`${letterTextSize} font-extrabold text-red-500 transition-all duration-300 ${isResettingWrong ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                {wrongPlacedAnswers.final}
              </span>
            ) : (
              <span className="text-[9px] md:text-xs text-stone-400 font-bold">韻母</span>
            )}
            {placedAnswers.final && (
              <div className="absolute bottom-0.5 bg-teal-100 p-0.5 rounded-full">
                <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-teal-650" />
              </div>
            )}
          </div>

        </div>

        {/* 右側：聲調艙（獨立置右） */}
        <div className="flex flex-col items-center justify-center">
          <div
            ref={toneZoneRef}
            className={`relative ${toneSizeClass} rounded-xl md:rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-sm overflow-hidden ${
              placedAnswers.tone
                ? 'border-amber-500 bg-amber-50/50 text-amber-800'
                : (wrongPlacedAnswers.tone && !isResettingWrong)
                ? `border-red-450 bg-red-50 text-red-700 ${errorZones.tone ? 'animate-shake' : ''}`
                : hoveredZone === 'tone'
                ? 'border-amber-400 bg-amber-50/20 scale-105 shadow-amber-500/10'
                : errorZones.tone
                ? 'border-red-500 bg-red-50 text-red-650 animate-shake'
                : 'border-dashed border-amber-200 bg-amber-50/30 text-amber-400'
            }`}
          >
            <span className="absolute top-0.5 text-[7px] md:text-[9px] font-bold tracking-wider opacity-50">調</span>
            {placedAnswers.tone ? (
              <span className={`${toneTextSize} font-extrabold`}>{getToneDisplay(placedAnswers.tone)}</span>
            ) : wrongPlacedAnswers.tone ? (
              <span className={`${toneTextSize} font-extrabold text-red-500 transition-all duration-300 ${isResettingWrong ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                {getToneDisplay(wrongPlacedAnswers.tone)}
              </span>
            ) : (
              <span className="text-[9px] md:text-xs text-amber-400 font-bold">聲調</span>
            )}
            {placedAnswers.tone && (
              <div className="absolute bottom-0.5 bg-amber-100 p-0.5 rounded-full">
                <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-650" />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Card pool (Bottom) */}
      <footer ref={footerRef} className="h-auto shrink-0 bg-white rounded-2xl p-2 md:p-4 flex flex-wrap gap-1.5 md:gap-2 content-center justify-center items-center shadow-sm w-full select-none">
        {/* Left part: symbols */}
        {cardPool
          .filter((card) => card.type !== 'tone')
          .map((card) => {
            const isDragging = activeDrag?.cardId === card.id;
            const typeStyles = card.type === 'initial'
              ? 'from-teal-50 to-teal-100/50 text-teal-800 border-teal-200 hover:border-teal-400'
              : card.type === 'medial'
              ? 'from-sky-50 to-sky-100/50 text-sky-800 border-sky-200 hover:border-sky-400'
              : 'from-rose-50 to-rose-100/50 text-rose-800 border-rose-200 hover:border-rose-400';

            return (
              <div
                key={card.id}
                onTouchStart={(e) => handleDragStart(e, card)}
                onMouseDown={(e) => handleDragStart(e, card)}
                style={{ opacity: isDragging ? 0.25 : 1 }}
                className="draggable-card w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br border-2 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`w-full h-full flex items-center justify-center rounded-lg bg-gradient-to-br ${typeStyles}`}>
                  <span className="text-base md:text-3xl font-black">
                    {card.symbol}
                  </span>
                </div>
              </div>
            );
          })}

        {/* Separator line */}
        <div className="hidden md:block h-8 border-r border-stone-200 mx-1 md:mx-2"></div>

        {/* Right part: tones */}
        {TONE_CARDS.map((card) => {
          const isPlaced = placedAnswers.tone === card.symbol;
          const isDragging = activeDrag?.cardId === `fixed-tone-${card.symbol}`;
          const typeStyles = 'from-amber-50 to-amber-100/50 text-amber-855 border-amber-250 hover:border-amber-400';

          return (
            <div
              key={card.symbol}
              onTouchStart={(e) => handleDragStartTone(e, card.symbol)}
              onMouseDown={(e) => handleDragStartTone(e, card.symbol)}
              style={{
                opacity: isDragging ? 0.25 : isPlaced ? 0.4 : 1,
                pointerEvents: isPlaced ? 'none' : 'auto',
              }}
              className="draggable-card w-11 h-11 md:w-14 md:h-14 bg-gradient-to-br border-2 rounded-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-sm transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`w-full h-full flex items-center justify-center rounded-lg bg-gradient-to-br ${typeStyles}`}>
                <span className="text-xl md:text-3xl font-extrabold">
                  {card.display}
                </span>
              </div>
            </div>
          );
        })}
      </footer>

      {/* Floating Active Drag Card */}
      {activeDrag && (
        <div
          style={{
            position: 'fixed',
            left: activeDrag.currentX,
            top: activeDrag.currentY,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className={`w-11 h-11 md:w-14 md:h-14 bg-gradient-to-br rounded-xl flex flex-col items-center justify-center border-2 border-white shadow-2xl text-white font-extrabold select-none ${
            activeDrag.type === 'initial'
              ? 'from-teal-400 to-teal-500'
              : activeDrag.type === 'medial'
              ? 'from-sky-400 to-sky-500'
              : activeDrag.type === 'final'
              ? 'from-rose-400 to-rose-500'
              : 'from-amber-400 to-amber-500'
          }`}
        >
          <span className="text-xl md:text-3xl font-black">
            {activeDrag.type === 'tone' ? getToneDisplay(activeDrag.symbol) : activeDrag.symbol}
          </span>
        </div>
      )}

      {/* Single level success modal (only shown when NOT the last question) */}
      {levelCompleted && !isLastQuestion && (
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            
            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-450 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <h3 className="text-3xl font-black text-stone-850">答對了！太棒了</h3>
              <p className="text-stone-550 mt-2 font-bold">
                恭喜成功解鎖單字「{quiz.wordText}」的注音結構！
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex justify-around shadow-inner">
              <div>
                <span className="text-xs text-stone-450 font-bold block mb-1">注音結構</span>
                <span className="text-2xl font-black text-stone-850 tracking-wider">
                  {quiz.correctAnswer.initial}{quiz.correctAnswer.medial}{quiz.correctAnswer.final} {getToneDisplay(quiz.correctAnswer.tone)}
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-450 font-bold block mb-1">獲得分數</span>
                <span className="text-2xl font-black text-amber-600">+100</span>
              </div>
            </div>

            <button
              id="btn-next-level"
              onClick={onNext}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-white font-bold py-4 px-6 rounded-2xl shadow-md flex items-center justify-center space-x-2 cursor-pointer border-b-4 border-emerald-700"
            >
              <span>下一關</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Warm Encouragement Modal */}
      {showEncouragement && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-3 border-amber-200 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 relative animate-scaleUp">
            <div className="w-16 h-16 bg-amber-50 border-2 border-amber-300 rounded-full flex items-center justify-center mx-auto text-amber-500 text-3xl">
              🧸
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-stone-850">加油加油！</h3>
              <p className="text-stone-750 font-bold text-base leading-relaxed">
                {encouragementMsg}
              </p>
            </div>

            <button
              onClick={handleCloseEncouragement}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-white font-extrabold py-4 px-6 rounded-2xl shadow-md cursor-pointer flex items-center justify-center space-x-2 border-b-4 border-amber-700"
            >
              <span>💪 我要再試一次</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
