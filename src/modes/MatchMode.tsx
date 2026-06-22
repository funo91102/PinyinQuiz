import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Check } from 'lucide-react';
import VerticalZhuyin from '../components/VerticalZhuyin';
import imageWordMap from '../imageWordMap.json';

interface QuizItem {
  id: number;
  subject?: 'zhuyin' | 'phonics'; // V7.x: 學習科目
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

interface RightCard {
  id: number;
  subject?: 'zhuyin' | 'phonics';
  wordText: string;
  correctAnswer: {
    initial: string;
    medial: string;
    final: string;
    tone: string;
  };
}

interface ActiveLine {
  startId: string;
  startSide: 'left' | 'right';
  startQuizId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface MatchModeProps {
  quizzes: QuizItem[];
  currentQuestionIndex: number;
  onCorrect: (quizId: number, hasMadeMistake: boolean) => void;
  onWrongAttempt: (quiz: QuizItem, wrongAnswer: { initial: string; medial: string; final: string; tone: string }) => void;
}

export default function MatchMode({
  quizzes,
  currentQuestionIndex,
  onCorrect,
  onWrongAttempt
}: MatchModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Batch calculations: 15 questions divided as 5 + 5 + 5
  const batchIndex = Math.floor(currentQuestionIndex / 5);
  const batchStartIdx = batchIndex * 5;
  const batchEndIdx = Math.min(quizzes.length, (batchIndex + 1) * 5);
  const batchQuizzes = quizzes.slice(batchStartIdx, batchEndIdx);

  // States
  const [rightCards, setRightCards] = useState<RightCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<{ leftId: number; rightId: number }[]>([]);
  const [activeLine, setActiveLine] = useState<ActiveLine | null>(null);
  const [hasMadeMistakeMap, setHasMadeMistakeMap] = useState<Record<number, boolean>>({});
  const [, setDummySize] = useState(0); // For forcing re-render on window resize

  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [mismatchedLine, setMismatchedLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shuffles array
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

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

  const renderWordText = (imageUrl: string, defaultWord: string) => {
    const { word, core } = getWordDetails(imageUrl, defaultWord);
    
    if (!word || !core) {
      return <span className="text-base font-black mt-1 pointer-events-none text-stone-700">{defaultWord}</span>;
    }

    return (
      <span className="text-base font-bold mt-1 pointer-events-none flex items-center justify-center">
        {Array.from(word).map((char, index) => {
          if (char === core) {
            return (
              <span key={index} className="text-lg font-black text-emerald-600 scale-110 inline-block px-0.5">
                {char}
              </span>
            );
          }
          return (
            <span key={index} className="text-stone-400 text-xs font-normal inline-block">
              {char}
            </span>
          );
        })}
      </span>
    );
  };

  // When the active batch index changes, initialize the cards
  useEffect(() => {
    if (batchQuizzes.length > 0) {
      const cards = batchQuizzes.map(quiz => ({
        id: quiz.id,
        subject: quiz.subject,
        wordText: quiz.wordText,
        correctAnswer: quiz.correctAnswer
      }));
      setRightCards(shuffle(cards));
      setMatchedPairs([]);
    }
  }, [batchIndex, quizzes]);

  // Window resize handler to update line anchors dynamically
  useEffect(() => {
    const handleResize = () => setDummySize(prev => prev + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Web Audio chime synthesizer
  const playSoundEffect = (success: boolean) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (success) {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 -> E5 -> G5 -> C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + idx * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.3);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop(ctx.currentTime + idx * 0.06 + 0.3);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn('Web Audio failure:', e);
    }
  };

  // Drag Line Handlers
  const handleDragStart = (
    _e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    quizId: number,
    side: 'left' | 'right'
  ) => {
    const isMatched = side === 'left'
      ? matchedPairs.some(p => p.leftId === quizId)
      : matchedPairs.some(p => p.rightId === quizId);
    if (isFrozen || isMatched) return;

    const container = containerRef.current;
    const item = document.getElementById(`match-${side}-${quizId}`);
    if (!container || !item) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();



    const anchorX = itemRect.left + (side === 'left' ? itemRect.width : 0) - containerRect.left;
    const anchorY = itemRect.top + itemRect.height / 2 - containerRect.top;

    setActiveLine({
      startId: `match-${side}-${quizId}`,
      startSide: side,
      startQuizId: quizId,
      startX: anchorX,
      startY: anchorY,
      currentX: anchorX,
      currentY: anchorY
    });
  };

  useEffect(() => {
    if (!activeLine) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (e.type === 'touchmove') {
        e.preventDefault();
      }

      const containerRect = container.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const relativeX = clientX - containerRect.left;
      const relativeY = clientY - containerRect.top;

      setActiveLine(prev => prev ? { ...prev, currentX: relativeX, currentY: relativeY } : null);
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      const container = containerRef.current;
      if (!container) {
        setActiveLine(null);
        return;
      }

      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

      const oppositeSide = activeLine.startSide === 'left' ? 'right' : 'left';
      
      // Proximity probing: find if we released over an opposite item card
      const targetQuiz = batchQuizzes.find(quiz => {
        const el = document.getElementById(`match-${oppositeSide}-${quiz.id}`);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return clientX >= rect.left && clientX <= rect.right &&
               clientY >= rect.top && clientY <= rect.bottom;
      });

      if (targetQuiz) {
        const startQuiz = quizzes.find(q => q.id === activeLine.startQuizId);
        const targetQuizItem = quizzes.find(q => q.id === targetQuiz.id);

        const isHomophoneMatch = 
          startQuiz && targetQuizItem &&
          startQuiz.correctAnswer.initial === targetQuizItem.correctAnswer.initial &&
          startQuiz.correctAnswer.medial === targetQuizItem.correctAnswer.medial &&
          startQuiz.correctAnswer.final === targetQuizItem.correctAnswer.final &&
          startQuiz.correctAnswer.tone === targetQuizItem.correctAnswer.tone;

        if (isHomophoneMatch) {
          // Success Match!
          const leftId = activeLine.startSide === 'left' ? activeLine.startQuizId : targetQuiz.id;
          const rightId = activeLine.startSide === 'left' ? targetQuiz.id : activeLine.startQuizId;

          const isLeftMatched = matchedPairs.some(p => p.leftId === leftId);
          const isRightMatched = matchedPairs.some(p => p.rightId === rightId);

          if (!isLeftMatched && !isRightMatched) {
            playSoundEffect(true);
            setMatchedPairs(prev => [...prev, { leftId, rightId }]);
            // Trigger correct callbacks to progress index
            const hadMistake = hasMadeMistakeMap[leftId] || false;
            onCorrect(leftId, hadMistake);
          }
        } else {
          // Mismatch Error
          playSoundEffect(false);
          setIsFrozen(true);
          setErrorMessage("好像不對喔！再試試看！");
          
          // Identify left quiz and right quiz for logging mismatch
          const leftId = activeLine.startSide === 'left' ? activeLine.startQuizId : targetQuiz.id;
          const rightId = activeLine.startSide === 'left' ? targetQuiz.id : activeLine.startQuizId;

          const leftQuiz = quizzes.find(q => q.id === leftId);
          const rightQuiz = quizzes.find(q => q.id === rightId);

          if (leftQuiz && rightQuiz) {
            setHasMadeMistakeMap(prev => ({
              ...prev,
              [leftQuiz.id]: true
            }));
            onWrongAttempt(leftQuiz, rightQuiz.correctAnswer);
          }

          // Calculate mismatch line coordinates for snapping feedback
          const startEl = document.getElementById(activeLine.startId);
          const targetEl = document.getElementById(`match-${oppositeSide}-${targetQuiz.id}`);
          if (startEl && targetEl) {
            const startRect = startEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const x1 = startRect.left + (activeLine.startSide === 'left' ? startRect.width : 0) - containerRect.left;
            const y1 = startRect.top + startRect.height / 2 - containerRect.top;
            const x2 = targetRect.left + (oppositeSide === 'left' ? targetRect.width : 0) - containerRect.left;
            const y2 = targetRect.top + targetRect.height / 2 - containerRect.top;

            setMismatchedLine({ x1, y1, x2, y2 });
          }

          setTimeout(() => {
            setMismatchedLine(null);
            setErrorMessage(null);
            setIsFrozen(false);
          }, 800);
        }
      }

      setActiveLine(null);
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
  }, [activeLine, batchQuizzes, quizzes, matchedPairs, hasMadeMistakeMap, onCorrect, onWrongAttempt, isFrozen]);

  // Compute completed matching lines relative coordinates
  const getCompletedLines = () => {
    const container = containerRef.current;
    if (!container) return [];
    const containerRect = container.getBoundingClientRect();

    return matchedPairs.map(pair => {
      const leftEl = document.getElementById(`match-left-${pair.leftId}`);
      const rightEl = document.getElementById(`match-right-${pair.rightId}`);
      if (!leftEl || !rightEl) return null;
      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();

      return {
        id: pair.leftId,
        x1: leftRect.left + leftRect.width - containerRect.left,
        y1: leftRect.top + leftRect.height / 2 - containerRect.top,
        x2: rightRect.left - containerRect.left,
        y2: rightRect.top + rightRect.height / 2 - containerRect.top
      };
    }).filter(Boolean) as { id: number; x1: number; y1: number; x2: number; y2: number }[];
  };

  const completedLines = getCompletedLines();

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-6 px-4 relative select-none">
      
      {/* Guidance Header */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center space-x-1.5 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black text-emerald-800 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>第 {batchIndex + 1} / 3 批連線</span>
        </span>
        <h2 className="text-lg sm:text-xl font-bold mt-2 text-stone-550">
          {batchQuizzes[0]?.subject === 'phonics'
            ? 'Drag to match each picture with the correct English word!'
            : '請用手指拖曳，將左側的圖片與右側正確的注音連起來！'}
        </h2>
      </div>

      {/* Matching Board Grid */}
      <div
        ref={containerRef}
        className="w-full max-w-3xl bg-white border-2 border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-sm relative flex justify-between items-center gap-10 sm:gap-16 min-h-[550px]"
      >
        {/* Dynamic SVG layer overlay */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
          {/* Static matched lines */}
          {completedLines.map(line => (
            <g key={line.id}>
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#10b981"
                strokeWidth={7}
                strokeLinecap="round"
                className="opacity-80"
              />
              <circle cx={line.x1} cy={line.y1} r={5} fill="#10b981" />
              <circle cx={line.x2} cy={line.y2} r={5} fill="#10b981" />
            </g>
          ))}
          {/* Active dragging line */}
          {activeLine && (
            <g>
              <line
                x1={activeLine.startX}
                y1={activeLine.startY}
                x2={activeLine.currentX}
                y2={activeLine.currentY}
                stroke="#3b82f6"
                strokeWidth={5}
                strokeDasharray="6,6"
                strokeLinecap="round"
              />
              <circle cx={activeLine.startX} cy={activeLine.startY} r={5} fill="#3b82f6" />
            </g>
          )}
          {/* Mismatched line (red feedback) */}
          {mismatchedLine && (
            <g>
              <line
                x1={mismatchedLine.x1}
                y1={mismatchedLine.y1}
                x2={mismatchedLine.x2}
                y2={mismatchedLine.y2}
                stroke="#ef4444"
                strokeWidth={7}
                strokeLinecap="round"
                className="opacity-90 transition-opacity duration-300"
              />
              <circle cx={mismatchedLine.x1} cy={mismatchedLine.y1} r={5} fill="#ef4444" />
              <circle cx={mismatchedLine.x2} cy={mismatchedLine.y2} r={5} fill="#ef4444" />
            </g>
          )}
        </svg>

        {/* Left: Images */}
        <div className="flex flex-col space-y-4 z-20">
          {batchQuizzes.map(quiz => {
            const isMatched = matchedPairs.some(p => p.leftId === quiz.id);
            return (
              <div
                key={quiz.id}
                id={`match-left-${quiz.id}`}
                onMouseDown={(e) => handleDragStart(e, quiz.id, 'left')}
                onTouchStart={(e) => handleDragStart(e, quiz.id, 'left')}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex flex-col items-center justify-center p-2 bg-gradient-to-b border-3 transition-all cursor-grab active:cursor-grabbing shadow-sm select-none relative
                  ${isMatched 
                    ? 'from-teal-50 to-teal-100/50 border-teal-500 opacity-60 text-teal-800' 
                    : 'from-stone-50 to-white border-stone-200 hover:border-emerald-300 hover:scale-103 hover:shadow-md text-stone-700'
                  }
                `}
              >
                <img
                  src={quiz.imageUrl}
                  alt={quiz.wordText}
                  className="w-16 h-16 object-contain pointer-events-none select-none"
                />
                {renderWordText(quiz.imageUrl, quiz.wordText)}
                {isMatched && (
                  <div className="absolute top-1 right-1 bg-teal-100 p-0.5 rounded-full">
                    <Check className="w-3.5 h-3.5 text-teal-700 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Zhuyin / Phonics cards */}
        <div className="flex flex-col space-y-4 z-20">
          {rightCards.map(card => {
            const isMatched = matchedPairs.some(p => p.rightId === card.id);
            const isPhonicsCard = card.subject === 'phonics';
            return (
              <div
                key={card.id}
                id={`match-right-${card.id}`}
                onMouseDown={(e) => handleDragStart(e, card.id, 'right')}
                onTouchStart={(e) => handleDragStart(e, card.id, 'right')}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center p-2 bg-gradient-to-b border-3 transition-all cursor-grab active:cursor-grabbing shadow-sm select-none relative
                  ${isMatched 
                    ? 'from-teal-50 to-teal-100/50 border-teal-500 opacity-60 text-teal-800' 
                    : 'from-stone-50 to-white border-stone-200 hover:border-emerald-300 hover:scale-103 hover:shadow-md text-stone-850'
                  }
                `}
              >
                {isPhonicsCard ? (
                  /* Phonics 模式：橫向連續呈現英文單字，禁止垂直拆解 */
                  <span
                    className="text-xl sm:text-2xl font-black text-sky-700 tracking-widest select-none"
                    style={{ fontFamily: "'Courier New', Courier, monospace" }}
                  >
                    {card.wordText.toLowerCase()}
                  </span>
                ) : (
                  /* Zhuyin 模式：保留原注音垂直展示 */
                  <VerticalZhuyin correctAnswer={card.correctAnswer} />
                )}
                {isMatched && (
                  <div className="absolute top-1 right-1 bg-teal-100 p-0.5 rounded-full">
                    <Check className="w-3.5 h-3.5 text-teal-700 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Error overlay during mismatch */}
        {errorMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/10 backdrop-blur-[1px] rounded-3xl z-30 transition-all duration-300">
            <div className="bg-red-50 border-2 border-red-200 text-red-650 px-6 py-4 rounded-2xl shadow-lg font-black text-lg sm:text-xl animate-bounce flex items-center space-x-2">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
