import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Eye, EyeOff, Trash2 } from 'lucide-react';
import VerticalZhuyin from '../components/VerticalZhuyin';
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

interface CanvasModeProps {
  quiz: QuizItem;
  isLastQuestion: boolean;
  onCorrect: (hasMadeMistake: boolean) => void;
  onWrongAttempt: (wrongAnswer: { initial: string; medial: string; final: string; tone: string }) => void;
  onNext: () => void;
}

export default function CanvasMode({
  quiz,
  onCorrect,
  onWrongAttempt,
  onNext
}: CanvasModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Play pronunciation via TTS
  const playPronunciation = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'zh-TW';
      utterance.rate = 0.70; // Kids friendly slower speed
      window.speechSynthesis.speak(utterance);
    }
  };

  // Play audio on load and when quiz changes
  useEffect(() => {
    setShowAnswer(false);
    const timer = setTimeout(() => {
      playPronunciation(quiz.wordText);
    }, 500);

    return () => clearTimeout(timer);
  }, [quiz]);

  // Draw traditional Taiwanese '米字格' helper grid lines
  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    
    // Draw outer boundary border
    ctx.strokeStyle = '#e5e7eb'; // border-gray-200
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, w, h);

    // Draw helper lines inside grid using dashed dashes
    ctx.strokeStyle = '#d1d5db'; // gray-300
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Horizontal split line
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Vertical split line
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Diagonal backslash split line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.stroke();

    // Diagonal slash split line
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);
    ctx.stroke();

    // Reset line dash pattern for user drawing
    ctx.setLineDash([]);
  };

  // Set canvas scale based on client bounding rect
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 300;
    canvas.height = rect.height || 300;

    drawGrid(ctx, canvas.width, canvas.height);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      initCanvas();
    }, 100);

    window.addEventListener('resize', initCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', initCanvas);
    };
  }, [quiz]);

  // Clear Canvas Board
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx, canvas.width, canvas.height);
  };

  // Get mouse/touch coordinates relative to Canvas element bounds
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Start Drawing action
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | MouseEvent | TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPosRef.current = coords;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e293b'; // slate-800
        ctx.fill();
      }
    }
  };

  // Process Continuous Line Drawing
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | MouseEvent | TouchEvent) => {
    if (!isDrawing || !lastPosRef.current) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.strokeStyle = '#1e293b'; // slate-800
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        lastPosRef.current = coords;
      }
    }
  };

  // Stop Drawing action
  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const startDrawingRef = useRef(startDrawing);
  const drawRef = useRef(draw);
  const stopDrawingRef = useRef(stopDrawing);

  // Keep refs up to date to prevent stale closures
  useEffect(() => {
    startDrawingRef.current = startDrawing;
    drawRef.current = draw;
    stopDrawingRef.current = stopDrawing;
  });

  // Native touch event listeners for canvas to prevent default scrolling gestures
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startDrawingRef.current(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      drawRef.current(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stopDrawingRef.current();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // ── 全域 body 鎖定已移除： canvas 局部 passive:false 監聽器保留，仅航畫布區域防滞動 ──

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

  // Web Audio review synthesizer
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

  // Correct handler click
  const handleCorrectClick = () => {
    playSoundEffect(true);
    onCorrect(false);
    onNext();
  };

  // Incorrect handler click
  const handleIncorrectClick = () => {
    playSoundEffect(false);
    onWrongAttempt(quiz.correctAnswer);
    onCorrect(true);
    onNext();
  };

  return (
    <div className="max-w-6xl mx-auto w-full min-h-[100dvh] h-auto bg-gray-50 flex flex-col gap-4 p-3 pb-10 select-none relative">
      
      {/* ① 頂部題目區 */}
      <div className="shrink-0 flex flex-row items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 md:w-24 md:h-24 bg-gradient-to-b from-stone-50 to-white border border-stone-200 rounded-xl flex items-center justify-center p-1 shadow-inner">
            <img
              src={quiz.imageUrl}
              alt={quiz.wordText}
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </div>
          <div className="text-left">
            <span className="text-lg md:text-3xl font-black flex items-center tracking-wide">
              {Array.from(word).map((char, index) => {
                if (char === core) {
                  return (
                    <span key={index} className="text-3xl md:text-5xl font-black text-emerald-600 inline-block px-0.5 animate-bounce">
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
            <span className="text-[9px] md:text-[11px] text-stone-450 block mt-0.5 font-bold tracking-widest uppercase">
              請手寫高亮字的注音
            </span>
          </div>
        </div>

        <button
          onClick={() => playPronunciation(quiz.wordText)}
          className="bg-gradient-to-br from-rose-400 to-pink-500 hover:from-rose-350 hover:to-pink-400 active:scale-95 transition-all text-white p-3 md:p-4 rounded-full shadow-md border-b-3 border-pink-700 flex items-center justify-center cursor-pointer"
          aria-label="播放發音"
        >
          <Volume2 className="w-5 h-5 md:w-7 md:h-7 text-white" />
        </button>
      </div>

      {/* ② 中間畫布區 */}
      <div className="h-auto my-4 shrink-0 bg-white rounded-2xl p-4 flex items-center justify-center relative shadow-sm w-full">
        <div className="relative w-full aspect-square max-w-[350px] md:max-w-[500px] border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50 shadow-inner touch-none select-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full cursor-crosshair block bg-transparent"
          />
          <button
            onClick={handleClear}
            className="absolute bottom-3 right-3 flex items-center space-x-1 text-xs font-bold text-stone-555 hover:text-rose-600 transition-colors bg-white/95 border border-stone-250 hover:bg-stone-100/90 px-3 py-1.5 rounded-xl cursor-pointer shadow-md"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清除</span>
          </button>
        </div>
      </div>

      {/* ③ 底部家長席 */}
      <div className="h-auto shrink-0 bg-white rounded-2xl p-3 pb-5 flex flex-col gap-2 shadow-sm w-full">
        <div className="w-full flex justify-between items-center px-1">
          <span className="text-[10px] md:text-sm font-extrabold text-stone-550">家長評核席</span>
          
          <button
            onClick={() => setShowAnswer(prev => !prev)}
            className="text-stone-500 hover:text-stone-700 p-1.5 rounded-lg bg-white border border-stone-250 transition-colors cursor-pointer flex items-center space-x-1 text-[9px] md:text-xs font-black shadow-sm"
          >
            {showAnswer ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>隱藏答案</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>對照正確注音</span>
              </>
            )}
          </button>
        </div>

        {/* Answer Display */}
        <div className="flex-1 min-h-0 w-full bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden p-2">
          {showAnswer ? (
            <div className="animate-fade-in flex items-center justify-center scale-100 md:scale-110">
              <VerticalZhuyin correctAnswer={quiz.correctAnswer} />
            </div>
          ) : (
            <span className="text-xs md:text-sm font-bold text-stone-400">❓ 對照答案</span>
          )}
        </div>

        {/* Judgment buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleIncorrectClick}
            className="flex-1 bg-red-50 border-2 border-red-250 hover:bg-red-100 text-red-650 font-black py-2.5 md:py-3.5 px-4 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-sm text-xs md:text-base"
          >
            <span>❌ 需再練習</span>
          </button>
          <button
            onClick={handleCorrectClick}
            className="flex-1 bg-emerald-500 hover:bg-emerald-450 text-white font-black py-2.5 md:py-3.5 px-4 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md border-b-3 border-emerald-700 text-xs md:text-base"
          >
            <span>🎉 寫得好棒</span>
          </button>
        </div>
      </div>

    </div>
  );
}
