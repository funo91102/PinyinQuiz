import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Check, ArrowRight } from 'lucide-react';
import imageWordMap from '../imageWordMap.json';
import { resolveUtteranceParameters, type LetterSlot } from '../types/quiz';

// ── 本地題目型別（向下相容 UniversalQuizItem）────────────────────────────────

interface QuizItem {
  id: number;
  subject?: 'zhuyin' | 'phonics';
  wordText: string;
  imageUrl: string;
  audioUrl: string;
  correctAnswer: {
    initial: string;
    medial: string;
    final: string;
    tone: string;
  };
  /** V7.2: 動態字母槽，phonics 科目由資料源提供 */
  letters?: LetterSlot[];
}

// ── 通用積木牌型別 ────────────────────────────────────────────────────────────

/**
 * V7.2 通用積木牌型別（原來固定 'initial'|'medial'|'final'|'tone' → 現在改為 string）。
 * 支援注音 4 槽與英語 N 槽的統一拖曳資料結構。
 */
interface CardItem {
  id: string;
  symbol: string;
  /** 此積木屬於哪個答題槽位 key */
  slotKey: string;
}

interface ActiveDragState {
  cardId: string;
  symbol: string;
  slotKey: string;
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

// ── 輔助純函式 ───────────────────────────────────────────────────────────────

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

/** 配色等級對映至 Tailwind class 組 */
const COLOR_TIER_STYLES: Record<LetterSlot['colorTier'], {
  placed: string;
  wrong: string;
  hover: string;
  empty: string;
  card: string;
  badge: string;
  check: string;
}> = {
  teal:   { placed: 'border-teal-500 bg-teal-50/50 text-teal-800',    wrong: 'border-red-450 bg-red-50 text-red-700',   hover: 'border-teal-400 bg-teal-50/20 scale-105',   empty: 'border-dashed border-stone-300 bg-stone-50 text-stone-400',  card: 'from-teal-50 to-teal-100/50 text-teal-800 border-teal-200 hover:border-teal-400',   badge: 'bg-teal-100',   check: 'text-teal-650' },
  sky:    { placed: 'border-sky-500 bg-sky-50/50 text-sky-800',        wrong: 'border-red-450 bg-red-50 text-red-700',   hover: 'border-sky-400 bg-sky-50/20 scale-105',     empty: 'border-dashed border-stone-300 bg-stone-50 text-stone-400',  card: 'from-sky-50 to-sky-100/50 text-sky-800 border-sky-200 hover:border-sky-400',         badge: 'bg-sky-100',    check: 'text-sky-650' },
  rose:   { placed: 'border-rose-500 bg-rose-50/50 text-rose-800',     wrong: 'border-red-450 bg-red-50 text-red-700',   hover: 'border-rose-400 bg-rose-50/20 scale-105',   empty: 'border-dashed border-stone-300 bg-stone-50 text-stone-400',  card: 'from-rose-50 to-rose-100/50 text-rose-800 border-rose-200 hover:border-rose-400',   badge: 'bg-rose-100',   check: 'text-rose-650' },
  amber:  { placed: 'border-amber-500 bg-amber-50/50 text-amber-800',  wrong: 'border-red-450 bg-red-50 text-red-700',   hover: 'border-amber-400 bg-amber-50/20 scale-105', empty: 'border-dashed border-amber-200 bg-amber-50/30 text-amber-400', card: 'from-amber-50 to-amber-100/50 text-amber-800 border-amber-200 hover:border-amber-400', badge: 'bg-amber-100', check: 'text-amber-650' },
  violet: { placed: 'border-violet-500 bg-violet-50/50 text-violet-800', wrong: 'border-red-450 bg-red-50 text-red-700', hover: 'border-violet-400 bg-violet-50/20 scale-105', empty: 'border-dashed border-stone-300 bg-stone-50 text-stone-400', card: 'from-violet-50 to-violet-100/50 text-violet-800 border-violet-200 hover:border-violet-400', badge: 'bg-violet-100', check: 'text-violet-650' },
  indigo: { placed: 'border-indigo-500 bg-indigo-50/50 text-indigo-800', wrong: 'border-red-450 bg-red-50 text-red-700', hover: 'border-indigo-400 bg-indigo-50/20 scale-105', empty: 'border-dashed border-stone-300 bg-stone-50 text-stone-400', card: 'from-indigo-50 to-indigo-100/50 text-indigo-800 border-indigo-200 hover:border-indigo-400', badge: 'bg-indigo-100', check: 'text-indigo-650' },
};

/** 浮動拖曳積木的背景 gradient（依配色等級） */
const DRAG_GHOST_BG: Record<LetterSlot['colorTier'], string> = {
  teal:   'from-teal-400 to-teal-500',
  sky:    'from-sky-400 to-sky-500',
  rose:   'from-rose-400 to-rose-500',
  amber:  'from-amber-400 to-amber-500',
  violet: 'from-violet-400 to-violet-500',
  indigo: 'from-indigo-400 to-indigo-500',
};

/** 注音聲調積木固定清單 */
const TONE_CARDS = [
  { symbol: '5', display: '•', label: '輕聲' },
  { symbol: '1', display: '¯', label: '一聲' },
  { symbol: '2', display: 'ˊ', label: '二聲' },
  { symbol: '3', display: 'ˇ', label: '三聲' },
  { symbol: '4', display: 'ˋ', label: '四聲' },
];

/** 英語拼音干擾字母來源（26 英文字母） */
const PHONICS_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

const ENCOURAGEMENTS = [
  '差一點點囉！再試一次，你一定可以的！',
  '看一看，是不是選到長得很像的字母了呢？再挑戰一次！',
  '別氣餒！多試幾次，你一定會成功的！',
  '沒關係，我們再來找找看正確的字母卡片吧！',
];

// ── V7.2 核心純函式：從 QuizItem 合成動態 LetterSlot 陣列 ──────────────────

/**
 * resolveLetterSlots — V7.2 動態字母槽解析器
 *
 * 根據 subject 決定如何產出此題目的 LetterSlot 定義陣列：
 *   - 'zhuyin'  → 從 correctAnswer 合成固定 4 槽（聲/介/韻/調）
 *   - 'phonics' → 讀取 quiz.letters（若無則降級為 wordText 拆字）
 *
 * @param quiz - 目前題目
 * @returns 此題目的完整字母槽定義陣列
 */
function resolveLetterSlots(quiz: QuizItem): LetterSlot[] {
  const subject = quiz.subject ?? 'zhuyin';

  if (subject === 'phonics') {
    // phonics 路徑：優先使用 quiz.letters；若無則降級為 wordText 每個字元
    if (quiz.letters && quiz.letters.length > 0) {
      return quiz.letters;
    }
    // 降級：將 wordText 每個字元轉為 LetterSlot
    const phonicsTiers: LetterSlot['colorTier'][] = ['teal', 'sky', 'rose', 'violet', 'indigo', 'amber'];
    return quiz.wordText.toLowerCase().split('').map((char, idx) => ({
      slotKey: `L${idx}`,
      answer: char,
      slotLabel: `L${idx + 1}`,
      colorTier: phonicsTiers[idx % phonicsTiers.length],
    }));
  }

  // zhuyin 路徑：從 correctAnswer 合成 4 槽結構
  const correct = quiz.correctAnswer;
  const hasMedial = correct.medial && correct.medial.trim() !== '';
  const slots: LetterSlot[] = [];

  if (correct.initial) {
    slots.push({ slotKey: 'initial', answer: correct.initial, slotLabel: '聲母', colorTier: 'teal' });
  }
  if (hasMedial && correct.medial) {
    slots.push({ slotKey: 'medial', answer: correct.medial, slotLabel: '介母', colorTier: 'sky' });
  }
  if (correct.final) {
    slots.push({ slotKey: 'final', answer: correct.final, slotLabel: '韻母', colorTier: 'rose' });
  }
  // 聲調艙永遠存在（固定積木池，不在此陣列，由 TONE_CARDS 另行處理）
  slots.push({ slotKey: 'tone', answer: correct.tone, slotLabel: '聲調', colorTier: 'amber' });

  return slots;
}

/**
 * generateCardPool — V7.2 動態積木池生成器
 *
 * 根據 subject 生成可拖曳積木池（含正確答案積木 + 干擾積木）。
 *   - 'zhuyin'  → 各部位符號 + 正確答案；聲調由固定 TONE_CARDS 另行處理
 *   - 'phonics' → 正確字母 + 隨機字母干擾選項
 *
 * @param quiz  - 目前題目
 * @param slots - 已解析的字母槽陣列
 * @returns 打亂後的積木牌陣列
 */
function generateCardPool(quiz: QuizItem, slots: LetterSlot[]): CardItem[] {
  const subject = quiz.subject ?? 'zhuyin';
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  if (subject === 'phonics') {
    const correctLetters = slots.map(s => s.answer);
    // 干擾字母：從 26 英文字母排除正確字母後隨機抽 4 個
    const distractors = shuffle(
      PHONICS_ALPHABET.filter(c => !correctLetters.includes(c))
    ).slice(0, 4);

    const pool: CardItem[] = [
      ...slots.map((slot) => ({
        id: `correct-${slot.slotKey}`,
        symbol: slot.answer,
        slotKey: slot.slotKey,
      })),
      ...distractors.map((letter, idx) => ({
        id: `dist-${idx}-${letter}`,
        symbol: letter,
        slotKey: `dist-${idx}`, // 干擾牌無對應槽位
      })),
    ];
    return shuffle(pool);
  }

  // zhuyin 路徑
  const correct = quiz.correctAnswer;
  const quizHasMedial = correct.medial && correct.medial.trim() !== '';

  const INITIALS_LIST = ['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ','ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ'];
  const MEDIALS_LIST  = ['ㄧ','ㄨ','ㄩ'];
  const FINALS_LIST   = ['ㄚ','ㄛ','ㄜ','ㄝ','ㄞ','ㄟ','ㄠ','ㄡ','ㄢ','ㄣ','ㄤ','ㄥ','ㄦ'];

  const potentialInitials = INITIALS_LIST.filter(s => s !== correct.initial);
  const potentialFinals   = FINALS_LIST.filter(s => s !== correct.final);
  const potentialMedials  = MEDIALS_LIST.filter(s => s !== correct.medial);

  const distInitials = shuffle(potentialInitials).slice(0, 2);
  const distFinals   = shuffle(potentialFinals).slice(0, 2);

  const pool: CardItem[] = [];
  if (correct.initial) pool.push({ id: 'correct-initial', symbol: correct.initial, slotKey: 'initial' });
  if (quizHasMedial && correct.medial) pool.push({ id: 'correct-medial', symbol: correct.medial, slotKey: 'medial' });
  if (correct.final)  pool.push({ id: 'correct-final',   symbol: correct.final,   slotKey: 'final'   });

  distInitials.forEach((s, i) => pool.push({ id: `dist-initial-${i}`, symbol: s, slotKey: 'initial' }));
  distFinals.forEach((s, i)   => pool.push({ id: `dist-final-${i}`,   symbol: s, slotKey: 'final'   }));
  if (quizHasMedial) {
    potentialMedials.forEach((s, i) => pool.push({ id: `dist-medial-${i}`, symbol: s, slotKey: 'medial' }));
  }

  return shuffle(pool);
}

// ── 組件主體 ─────────────────────────────────────────────────────────────────

export default function DragMode({
  quiz,
  isLastQuestion,
  onCorrect,
  onWrongAttempt,
  onNext,
}: DragModeProps) {
  const isPhonics = (quiz.subject ?? 'zhuyin') === 'phonics';

  // 動態字母槽（由 resolveLetterSlots 合成）
  const [letterSlots, setLetterSlots] = useState<LetterSlot[]>([]);

  // placedAnswers: { [slotKey]: symbol | null }
  const [placedAnswers, setPlacedAnswers] = useState<Record<string, string | null>>({});
  const [wrongPlacedAnswers, setWrongPlacedAnswers] = useState<Record<string, string | null>>({});
  const [errorZones, setErrorZones] = useState<Record<string, boolean>>({});

  const [cardPool, setCardPool] = useState<CardItem[]>([]);
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const [levelCompleted, setLevelCompleted] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [encouragementMsg, setEncouragementMsg] = useState('');
  const [isResettingWrong, setIsResettingWrong] = useState(false);
  const [hasMadeMistake, setHasMadeMistake] = useState(false);

  // 動態 slot ref map（以 slotKey 為 key）
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const footerRef = useRef<HTMLDivElement>(null);

  // ── 字彙圖片資料（注音模式用）
  const getWordDetails = (imageUrl: string, defaultWord: string) => {
    const parts = imageUrl.split('/');
    const fileName = parts[parts.length - 1];
    const mapData = (imageWordMap as Record<string, { word: string; core: string }>)[fileName];
    return mapData ? { word: mapData.word, core: mapData.core } : { word: defaultWord, core: defaultWord };
  };
  const { word, core } = getWordDetails(quiz.imageUrl, quiz.wordText);

  // ── 初始化（每次 quiz 變更時）
  useEffect(() => {
    if (!quiz) return;
    const slots = resolveLetterSlots(quiz);
    setLetterSlots(slots);

    const initialPlaced: Record<string, string | null> = {};
    const initialWrong: Record<string, string | null>  = {};
    const initialError: Record<string, boolean>        = {};
    slots.forEach(s => {
      initialPlaced[s.slotKey] = null;
      initialWrong[s.slotKey]  = null;
      initialError[s.slotKey]  = false;
    });
    setPlacedAnswers(initialPlaced);
    setWrongPlacedAnswers(initialWrong);
    setErrorZones(initialError);
    setLevelCompleted(false);
    setHasMadeMistake(false);
    setCardPool(generateCardPool(quiz, slots));

    setTimeout(() => playPronunciation(quiz), 500);
  }, [quiz]);

  // ── 完成偵測
  useEffect(() => {
    if (!quiz || letterSlots.length === 0 || levelCompleted) return;

    const allCorrect = letterSlots.every(slot => placedAnswers[slot.slotKey] === slot.answer);
    if (allCorrect) {
      setLevelCompleted(true);
      playSoundEffect(true);
      onCorrect(hasMadeMistake);
    }
  }, [placedAnswers, letterSlots, quiz, hasMadeMistake, levelCompleted]);

  // ── V7.0 雙語化 TTS
  const playPronunciation = (q: QuizItem) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(q.wordText);
      const { lang, rate } = resolveUtteranceParameters(q.subject ?? 'zhuyin');
      utterance.lang = lang;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  // ── Web Audio 音效
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
          osc.connect(gain); gain.connect(ctx.destination);
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
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { console.warn('Web Audio not fully active:', e); }
  };

  // ── 拖曳開始
  const handleDragStart = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
    card: CardItem
  ) => {
    const isWrongPlaced = Object.values(wrongPlacedAnswers).some(v => v !== null);
    if (showEncouragement || levelCompleted || isWrongPlaced || isResettingWrong) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setActiveDrag({ cardId: card.id, symbol: card.symbol, slotKey: card.slotKey,
                    startX: clientX, startY: clientY, currentX: clientX, currentY: clientY });
  };

  // 注音聲調積木的專屬拖曳開始（固定積木池，不從 cardPool 移除）
  const handleDragStartTone = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
    symbol: string
  ) => {
    const isWrongPlaced = Object.values(wrongPlacedAnswers).some(v => v !== null);
    if (showEncouragement || levelCompleted || isWrongPlaced || isResettingWrong) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setActiveDrag({ cardId: `fixed-tone-${symbol}`, symbol, slotKey: 'tone',
                    startX: clientX, startY: clientY, currentX: clientX, currentY: clientY });
  };

  useEffect(() => {
    if (!activeDrag) return;

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (e.type === 'touchmove') e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setActiveDrag(prev => prev ? { ...prev, currentX: clientX, currentY: clientY } : null);
      setHoveredZone(checkCollision(clientX, clientY));
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

  /** 碰撞偵測：回傳落點所在的 slotKey，無命中則 null */
  const checkCollision = (x: number, y: number): string | null => {
    for (const slotKey of Object.keys(slotRefs.current)) {
      const el = slotRefs.current[slotKey];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return slotKey;
      }
    }
    return null;
  };

  const handleDragRelease = (clientX: number, clientY: number) => {
    if (!activeDrag) return;

    const { cardId, symbol } = activeDrag;
    const targetSlotKey = checkCollision(clientX, clientY);

    if (targetSlotKey) {
      const targetSlot = letterSlots.find(s => s.slotKey === targetSlotKey);
      const isCorrect = targetSlot && symbol === targetSlot.answer;

      if (isCorrect) {
        setPlacedAnswers(prev => ({ ...prev, [targetSlotKey]: symbol }));
        if (!cardId.startsWith('fixed-tone-')) {
          setCardPool(prev => prev.filter(c => c.id !== cardId));
        }
      } else {
        playSoundEffect(false);
        setHasMadeMistake(true);

        // 回傳 wrongAnswer（保持 zhuyin 格式相容）
        const wrongAnswerObj = {
          initial: targetSlotKey === 'initial' ? symbol : placedAnswers['initial'] || '',
          medial:  targetSlotKey === 'medial'  ? symbol : placedAnswers['medial']  || '',
          final:   targetSlotKey === 'final'   ? symbol : placedAnswers['final']   || '',
          tone:    targetSlotKey === 'tone'    ? symbol : placedAnswers['tone']    || quiz.correctAnswer.tone,
        };
        onWrongAttempt(wrongAnswerObj);

        setWrongPlacedAnswers(prev => ({ ...prev, [targetSlotKey]: symbol }));
        setErrorZones(prev => ({ ...prev, [targetSlotKey]: true }));
        setTimeout(() => setErrorZones(prev => ({ ...prev, [targetSlotKey]: false })), 500);

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
      const resetWrong: Record<string, string | null> = {};
      const resetError: Record<string, boolean>       = {};
      letterSlots.forEach(s => { resetWrong[s.slotKey] = null; resetError[s.slotKey] = false; });
      setWrongPlacedAnswers(resetWrong);
      setErrorZones(resetError);
      setIsResettingWrong(false);
    }, 300);
  };

  // ── 樣式常數
  const cabinSizeClass  = 'w-12 h-12 sm:w-24 sm:h-24';
  const letterTextSize  = 'text-xl sm:text-4xl';

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto w-full min-h-[100dvh] h-auto bg-gray-50 flex flex-col gap-4 p-3 pb-10 select-none relative">

      {/* ① 頂部題目卡與播音鍵 */}
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
            {isPhonics ? (
              /* Phonics：直接展示英文單字 */
              <span className="text-2xl md:text-4xl font-extrabold text-stone-800 tracking-widest">
                {quiz.wordText.split('').map((char, idx) => (
                  <span key={idx} className="text-2xl md:text-4xl font-black text-sky-600 inline-block px-0.5">
                    {char}
                  </span>
                ))}
              </span>
            ) : (
              /* Zhuyin：高亮核心字 */
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
            )}
            <span className="text-[9px] md:text-[10px] text-stone-450 block mt-0.5 font-bold tracking-widest uppercase">
              {isPhonics ? 'Drag & spell the word' : '請拖曳組合高亮字的注音'}
            </span>
          </div>
        </div>

        <button
          onClick={() => playPronunciation(quiz)}
          className="bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-white p-2.5 md:p-3 rounded-full shadow-md flex items-center justify-center cursor-pointer"
          aria-label="播放讀音"
        >
          <Volume2 className="w-5 h-5 md:w-7 md:h-7 text-white" />
        </button>
      </div>

      {/* ② 中間放置艙 */}
      <div className={`h-auto shrink-0 bg-white rounded-2xl px-3 py-6 md:px-6 w-full shadow-sm flex items-center justify-center ${
        isPhonics
          /* Phonics：橫向包覆 */
          ? 'flex-row flex-wrap gap-3 sm:gap-6'
          /* Zhuyin：維持原有直式結構（左側聲介韻 + 右側聲調） */
          : 'flex-row gap-6 md:gap-10'
      }`}>

        {isPhonics ? (
          /* ── Phonics 橫向槽陣列 ── */
          letterSlots.map((slot) => {
            const styles    = COLOR_TIER_STYLES[slot.colorTier];
            const placed    = placedAnswers[slot.slotKey];
            const wrongPlaced = wrongPlacedAnswers[slot.slotKey];
            const isHovered = hoveredZone === slot.slotKey;
            const hasError  = errorZones[slot.slotKey];

            return (
              <div
                key={slot.slotKey}
                ref={el => { slotRefs.current[slot.slotKey] = el; }}
                className={`relative ${cabinSizeClass} rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-sm overflow-hidden ${
                  placed
                    ? styles.placed
                    : (wrongPlaced && !isResettingWrong)
                    ? `${styles.wrong} ${hasError ? 'animate-shake' : ''}`
                    : isHovered
                    ? styles.hover
                    : hasError
                    ? 'border-red-500 bg-red-50 text-red-650 animate-shake'
                    : styles.empty
                }`}
              >
                <span className="absolute top-0.5 text-[7px] md:text-[9px] font-bold tracking-wider opacity-50">
                  {slot.slotLabel}
                </span>
                {placed ? (
                  <span className={`${letterTextSize} font-extrabold uppercase`}>{placed}</span>
                ) : wrongPlaced ? (
                  <span className={`${letterTextSize} font-extrabold text-red-500 transition-all duration-300 uppercase ${isResettingWrong ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                    {wrongPlaced}
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-lg font-bold opacity-60">{slot.slotLabel}</span>
                )}
                {placed && (
                  <div className={`absolute bottom-0.5 ${styles.badge} p-0.5 rounded-full`}>
                    <Check className={`w-2.5 h-2.5 md:w-3 md:h-3 ${styles.check}`} />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* ── Zhuyin 直式結構 ── */
          <>
            {/* 左側：聲母 + 介母 + 韻母（垂直堆疊） */}
            <div className="flex flex-col gap-4 items-center">
              {letterSlots.filter(s => s.slotKey !== 'tone').map((slot) => {
                const styles    = COLOR_TIER_STYLES[slot.colorTier];
                const placed    = placedAnswers[slot.slotKey];
                const wrongPlaced = wrongPlacedAnswers[slot.slotKey];
                const isHovered = hoveredZone === slot.slotKey;
                const hasError  = errorZones[slot.slotKey];

                return (
                  <div
                    key={slot.slotKey}
                    ref={el => { slotRefs.current[slot.slotKey] = el; }}
                    className={`relative ${cabinSizeClass} rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-sm overflow-hidden ${
                      placed
                        ? styles.placed
                        : (wrongPlaced && !isResettingWrong)
                        ? `${styles.wrong} ${hasError ? 'animate-shake' : ''}`
                        : isHovered
                        ? styles.hover
                        : hasError
                        ? 'border-red-500 bg-red-50 text-red-650 animate-shake'
                        : styles.empty
                    }`}
                  >
                    <span className="absolute top-0.5 text-[7px] md:text-[9px] font-bold tracking-wider opacity-50">
                      {slot.slotLabel[0]}
                    </span>
                    {placed ? (
                      <span className={`${letterTextSize} font-extrabold`}>{placed}</span>
                    ) : wrongPlaced ? (
                      <span className={`${letterTextSize} font-extrabold text-red-500 transition-all duration-300 ${isResettingWrong ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                        {wrongPlaced}
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-lg text-stone-400 font-bold">{slot.slotLabel}</span>
                    )}
                    {placed && (
                      <div className={`absolute bottom-0.5 ${styles.badge} p-0.5 rounded-full`}>
                        <Check className={`w-2.5 h-2.5 md:w-3 md:h-3 ${styles.check}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 右側：聲調艙（獨立置右） */}
            {letterSlots.find(s => s.slotKey === 'tone') && (() => {
              const toneSlot  = letterSlots.find(s => s.slotKey === 'tone')!;
              const styles    = COLOR_TIER_STYLES[toneSlot.colorTier];
              const placed    = placedAnswers['tone'];
              const wrongPlaced = wrongPlacedAnswers['tone'];
              const isHovered = hoveredZone === 'tone';
              const hasError  = errorZones['tone'];

              return (
                <div className="flex flex-col items-center justify-center">
                  <div
                    ref={el => { slotRefs.current['tone'] = el; }}
                    className={`relative w-14 h-14 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 shadow-sm overflow-hidden ${
                      placed
                        ? styles.placed
                        : (wrongPlaced && !isResettingWrong)
                        ? `${styles.wrong} ${hasError ? 'animate-shake' : ''}`
                        : isHovered
                        ? styles.hover
                        : hasError
                        ? 'border-red-500 bg-red-50 text-red-650 animate-shake'
                        : styles.empty
                    }`}
                  >
                    <span className="absolute top-0.5 text-[7px] md:text-[9px] font-bold tracking-wider opacity-50">調</span>
                    {placed ? (
                      <span className="text-xl sm:text-4xl font-extrabold">{getToneDisplay(placed)}</span>
                    ) : wrongPlaced ? (
                      <span className={`text-xl sm:text-4xl font-extrabold text-red-500 transition-all duration-300 ${isResettingWrong ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                        {getToneDisplay(wrongPlaced)}
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-lg text-amber-400 font-bold">聲調</span>
                    )}
                    {placed && (
                      <div className={`absolute bottom-0.5 ${styles.badge} p-0.5 rounded-full`}>
                        <Check className={`w-2.5 h-2.5 md:w-3 md:h-3 ${styles.check}`} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* ③ 底部積木池 */}
      <footer
        ref={footerRef}
        className="h-auto shrink-0 bg-white rounded-2xl p-2 md:p-4 flex flex-wrap gap-1.5 md:gap-2 content-center justify-center items-center shadow-sm w-full select-none"
      >
        {isPhonics ? (
          /* Phonics：全部積木統一橫向顯示（flex-wrap 防溢出） */
          cardPool.map((card) => {
            const isDragging = activeDrag?.cardId === card.id;
            const slot = letterSlots.find(s => s.slotKey === card.slotKey);
            const tier = slot?.colorTier ?? 'teal';
            const styles = COLOR_TIER_STYLES[tier];

            return (
              <div
                key={card.id}
                onTouchStart={(e) => handleDragStart(e, card)}
                onMouseDown={(e)  => handleDragStart(e, card)}
                style={{ opacity: isDragging ? 0.25 : 1 }}
                className="draggable-card w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br border-2 rounded-xl sm:rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm sm:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`w-full h-full flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br ${styles.card}`}>
                  <span className="text-base sm:text-2xl font-black uppercase">{card.symbol}</span>
                </div>
              </div>
            );
          })
        ) : (
          /* Zhuyin：左側注音符號 + 分隔線 + 右側聲調固定積木 */
          <>
            {cardPool.map((card) => {
              const isDragging = activeDrag?.cardId === card.id;
              const slot = letterSlots.find(s => s.slotKey === card.slotKey);
              const tier = slot?.colorTier ?? 'teal';
              const styles = COLOR_TIER_STYLES[tier];

              return (
                <div
                  key={card.id}
                  onTouchStart={(e) => handleDragStart(e, card)}
                  onMouseDown={(e)  => handleDragStart(e, card)}
                  style={{ opacity: isDragging ? 0.25 : 1 }}
                  className="draggable-card w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br border-2 rounded-xl sm:rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm sm:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`w-full h-full flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br ${styles.card}`}>
                    <span className="text-base sm:text-2xl font-black">{card.symbol}</span>
                  </div>
                </div>
              );
            })}

            {/* 分隔線 */}
            <div className="hidden sm:block h-12 border-r border-stone-200 mx-2 sm:mx-3" />

            {/* 聲調固定積木 */}
            {TONE_CARDS.map((card) => {
              const isPlaced   = placedAnswers['tone'] === card.symbol;
              const isDragging = activeDrag?.cardId === `fixed-tone-${card.symbol}`;
              const styles     = COLOR_TIER_STYLES['amber'];

              return (
                <div
                  key={card.symbol}
                  onTouchStart={(e) => handleDragStartTone(e, card.symbol)}
                  onMouseDown={(e)  => handleDragStartTone(e, card.symbol)}
                  style={{ opacity: isDragging ? 0.25 : isPlaced ? 0.4 : 1, pointerEvents: isPlaced ? 'none' : 'auto' }}
                  className="draggable-card w-11 h-11 sm:w-16 sm:h-16 bg-gradient-to-br border-2 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-sm sm:shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`w-full h-full flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br ${styles.card}`}>
                    <span className="text-xl sm:text-2xl font-extrabold">{card.display}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </footer>

      {/* ④ 浮動拖曳積木（跟手） */}
      {activeDrag && (() => {
        const slot = letterSlots.find(s => s.slotKey === activeDrag.slotKey);
        const tier = slot?.colorTier ?? (activeDrag.slotKey === 'tone' ? 'amber' : 'teal');
        return (
          <div
            style={{ position: 'fixed', left: activeDrag.currentX, top: activeDrag.currentY,
                     transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 9999 }}
            className={`w-11 h-11 md:w-14 md:h-14 bg-gradient-to-br rounded-xl flex flex-col items-center justify-center border-2 border-white shadow-2xl text-white font-extrabold select-none ${DRAG_GHOST_BG[tier as LetterSlot['colorTier']]}`}
          >
            <span className="text-xl md:text-3xl font-black uppercase">
              {activeDrag.slotKey === 'tone' ? getToneDisplay(activeDrag.symbol) : activeDrag.symbol}
            </span>
          </div>
        );
      })()}

      {/* ⑤ 過關彈窗（非最後一題） */}
      {levelCompleted && !isLastQuestion && (
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-450 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <h3 className="text-3xl font-black text-stone-850">答對了！太棒了</h3>
              <p className="text-stone-550 mt-2 font-bold">
                {isPhonics
                  ? `Great job! You spelled "${quiz.wordText}" correctly! 🎉`
                  : `恭喜成功解鎖單字「${quiz.wordText}」的注音結構！`}
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex justify-around shadow-inner">
              <div>
                <span className="text-xs text-stone-450 font-bold block mb-1">
                  {isPhonics ? 'Spelling' : '注音結構'}
                </span>
                <span className="text-2xl font-black text-stone-850 tracking-wider">
                  {isPhonics
                    ? quiz.wordText
                    : `${quiz.correctAnswer.initial}${quiz.correctAnswer.medial}${quiz.correctAnswer.final} ${getToneDisplay(quiz.correctAnswer.tone)}`}
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

      {/* ⑥ 鼓勵彈窗 */}
      {showEncouragement && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-3 border-amber-200 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 relative animate-scaleUp">
            <div className="w-16 h-16 bg-amber-50 border-2 border-amber-300 rounded-full flex items-center justify-center mx-auto text-amber-500 text-3xl">
              🧸
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-stone-850">加油加油！</h3>
              <p className="text-stone-750 font-bold text-base leading-relaxed">{encouragementMsg}</p>
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
