/**
 * EnglishCanvas.tsx — V7.3 英文專屬四線三格手寫練習板
 *
 * 設計理念：
 *   完全移植 CanvasMode.tsx 的 HTML5 Canvas 觸控繪圖核心，
 *   換上英語書寫教學標準的「四線三格（Four-line Grid）」背景：
 *
 *   Line 1  ─────────────── (上界線，輔助線，淺灰)
 *   Line 2  ─────────────── (頂線，大寫字母頂端，淺灰)
 *   Line 3  ─────────────── (★ 基底線 Baseline，字母底端，淺紅 #f87171)
 *   Line 4  ─────────────── (下界線，降筆線，淺灰)
 *
 *   [Zone 1] 上格：大寫字母與升筆字母（h/k/l）上伸區
 *   [Zone 2] 中格：主體書寫區（所有字母主體必須落於此）
 *   [Zone 3] 下格：降筆字母（g/p/q/y）下沉區
 *
 * 家長裁決系統：
 *   完整保留 [❌ 需再練習] 與 [⭕️ 正確] 雙按鈕事件鏈路，
 *   觸發後無縫對接 onCorrect / onWrongAttempt / onNext 回呼。
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Trash2 } from 'lucide-react';

// ── 本地題目型別（相容 UniversalQuizItem）──────────────────────────────────

interface EnglishQuizItem {
  id: number;
  subject?: 'zhuyin' | 'phonics';
  /** 英文單字（如 "cat"、"bird"），用於頂部大字渲染與 TTS 播音 */
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

interface EnglishCanvasProps {
  quiz: EnglishQuizItem;
  isLastQuestion: boolean;
  onCorrect: (hasMadeMistake: boolean) => void;
  onWrongAttempt: (wrongAnswer: { initial: string; medial: string; final: string; tone: string }) => void;
  onNext: () => void;
}

// ── 四線三格背景繪製純函式 ────────────────────────────────────────────────────

/**
 * drawFourLineGrid — V7.3 四線三格背景繪製器
 *
 * 將畫布高度平均切分為 3 個等高格子，產生 4 條水平界線：
 *   - Line 1（上界線）：淺灰 #e5e7eb，輔助線
 *   - Line 2（頂線）  ：淺灰 #e5e7eb，大寫字母頂端基準
 *   - Line 3（基底線）：淺紅 #f87171，字母坐底基準（最重要的參考線）
 *   - Line 4（下界線）：淺灰 #e5e7eb，降筆字母下沉區邊界
 *
 * 設計要點：
 *   - 此函式先執行 clearRect 清除整個畫布（含使用者筆跡），作為「重繪底板」
 *   - 一鍵清除時直接再呼叫此函式，確保背景完美保留且筆跡被清除
 *   - 四條線皆為實線（不使用 setLineDash），確保視覺乾淨利落
 *
 * @param ctx    - CanvasRenderingContext2D 實例
 * @param width  - 畫布實際像素寬度
 * @param height - 畫布實際像素高度
 */
function drawFourLineGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // 清除整個畫布（含使用者筆跡，重繪底板）
  ctx.clearRect(0, 0, width, height);

  // 將高度平均分為 3 格，產生 4 條分隔線的 Y 座標
  const zoneHeight = height / 3;
  const linePositions: number[] = [
    0,               // Line 1：上界線（畫布頂端）
    zoneHeight,      // Line 2：頂線（Zone 1 / Zone 2 交界）
    zoneHeight * 2,  // Line 3：基底線 Baseline（Zone 2 / Zone 3 交界）★
    height,          // Line 4：下界線（畫布底端）
  ];

  // 基底線（第三條，index 2）使用淺紅色，其餘使用淺灰色
  const BASELINE_COLOR  = '#f87171';  // Tailwind red-400，書寫教學基準線
  const GUIDELINE_COLOR = '#e5e7eb';  // Tailwind gray-200，輔助線
  const LINE_WIDTH       = 1.5;       // 細線設計，不搶奪書寫視覺焦點

  ctx.save();
  ctx.setLineDash([]); // 確保全實線

  linePositions.forEach((yPos, lineIndex) => {
    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo(width, yPos);

    // Line 3（index 2）為基底線 Baseline → 淺紅
    ctx.strokeStyle = lineIndex === 2 ? BASELINE_COLOR : GUIDELINE_COLOR;
    ctx.lineWidth   = LINE_WIDTH;
    ctx.stroke();
  });

  // 繪製整個格子的外框邊界（輔助視覺定位）
  ctx.strokeStyle = GUIDELINE_COLOR;
  ctx.lineWidth   = 1;
  ctx.strokeRect(0, 0, width, height);

  ctx.restore();
}

// ── 組件主體 ─────────────────────────────────────────────────────────────────

export default function EnglishCanvas({
  quiz,
  onCorrect,
  onWrongAttempt,
  onNext,
}: EnglishCanvasProps) {

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const lastPosRef  = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing]     = useState(false);
  const [hasMadeMistake, setHasMadeMistake] = useState(false);

  // ── TTS 語音播放（en-US，rate 0.85 利於兒童音素辨識）────────────────────

  /**
   * playEnglishPronunciation — 英文單字 TTS 播放器
   *
   * 固定使用 en-US 語系與 0.85 語速，符合英語自然發音教學規格。
   *
   * @param wordText - 欲播放的英文單字
   */
  const playEnglishPronunciation = (wordText: string): void => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance    = new SpeechSynthesisUtterance(wordText);
    utterance.lang     = 'en-US';
    utterance.rate     = 0.85; // 略慢，利於兒童音素辨識
    utterance.pitch    = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // ── Canvas 初始化與 quiz 切換 ────────────────────────────────────────────

  /**
   * initCanvas — 初始化畫布尺寸並繪製四線三格底板
   *
   * 以 getBoundingClientRect() 取得實際 CSS 渲染尺寸，
   * 避免高 DPR 裝置（Retina）下的像素模糊問題。
   */
  const initCanvas = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect    = canvas.getBoundingClientRect();
    canvas.width  = rect.width  || 320;
    canvas.height = rect.height || 200;

    drawFourLineGrid(ctx, canvas.width, canvas.height);
  };

  useEffect(() => {
    setHasMadeMistake(false);

    // 題目切換時：初始化畫布並自動播音
    const canvasTimer = setTimeout(initCanvas, 100);
    const audioTimer  = setTimeout(() => playEnglishPronunciation(quiz.wordText), 500);

    window.addEventListener('resize', initCanvas);
    return () => {
      clearTimeout(canvasTimer);
      clearTimeout(audioTimer);
      window.removeEventListener('resize', initCanvas);
    };
  }, [quiz]);

  // ── 一鍵清除（重繪背景，清除筆跡）────────────────────────────────────────

  /**
   * handleClear — 清除使用者筆跡，保留四線三格底板
   *
   * 直接呼叫 drawFourLineGrid，它的第一行為 clearRect，
   * 確保筆跡被清除的同時底板格線完美重繪。
   */
  const handleClear = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFourLineGrid(ctx, canvas.width, canvas.height);
  };

  // ── 觸控/滑鼠座標解析 ────────────────────────────────────────────────────

  const getPointerCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
      | MouseEvent
      | TouchEvent
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // ── 繪圖事件處理 ─────────────────────────────────────────────────────────

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
      | MouseEvent
      | TouchEvent
  ): void => {
    const coords = getPointerCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPosRef.current = coords;

    // 畫起始點圓點（觸控精準度補償）
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b'; // slate-800，深色筆跡
    ctx.fill();
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
      | MouseEvent
      | TouchEvent
  ): void => {
    if (!isDrawing || !lastPosRef.current) return;
    const coords = getPointerCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth   = 5;         // 稍細於注音版，適合英文字母筆跡
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();

    lastPosRef.current = coords;
  };

  const stopDrawing = (): void => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  // ── Ref 保鮮（防止 stale closure）───────────────────────────────────────

  const startDrawingRef = useRef(startDrawing);
  const drawRef         = useRef(draw);
  const stopDrawingRef  = useRef(stopDrawing);

  useEffect(() => {
    startDrawingRef.current = startDrawing;
    drawRef.current         = draw;
    stopDrawingRef.current  = stopDrawing;
  });

  // ── Native Touch 監聽（passive:false，防止預設捲動手勢）─────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startDrawingRef.current(e);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      drawRef.current(e);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stopDrawingRef.current();
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  // ── Web Audio 音效合成器 ─────────────────────────────────────────────────

  const playSoundEffect = (success: boolean): void => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (success) {
        // 上行大三和弦琶音（C5 → E5 → G5 → C6）
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.06,  ctx.currentTime + idx * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.3);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop( ctx.currentTime + idx * 0.06 + 0.3);
        });
      } else {
        // 下滑鋸齒波（錯誤提示音）
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1,  ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn('[EnglishCanvas] Web Audio failure:', e);
    }
  };

  // ── 家長席裁決按鈕 ───────────────────────────────────────────────────────

  /**
   * handleCorrectClick — 家長判定「正確」事件鏈
   *
   * 觸發順序：
   *   1. Web Audio 正確音效
   *   2. onCorrect(hasMadeMistake) → 通知 GameSession 計分與加權
   *   3. onNext() → 進入下一題
   */
  const handleCorrectClick = (): void => {
    playSoundEffect(true);
    onCorrect(hasMadeMistake);
    onNext();
  };

  /**
   * handleIncorrectClick — 家長判定「需再練習」事件鏈
   *
   * 觸發順序：
   *   1. Web Audio 錯誤音效
   *   2. 記錄本題有犯錯
   *   3. onWrongAttempt(quiz.correctAnswer) → 通知 GameSession 記錄錯誤並更新加權
   *   4. onCorrect(true) → 仍視為「完成本題」但帶 hasMadeMistake=true
   *   5. onNext() → 進入下一題
   */
  const handleIncorrectClick = (): void => {
    playSoundEffect(false);
    setHasMadeMistake(true);
    onWrongAttempt(quiz.correctAnswer);
    onCorrect(true);
    onNext();
  };

  // ── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto w-full min-h-[100dvh] h-auto bg-gray-50 flex flex-col gap-2 p-2 pb-4 select-none relative">

      {/* ① 頂部題目區：英文單字大字展示 + 播音鍵 */}
      <div className="shrink-0 flex flex-row items-center justify-between gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-sm w-full">
        <div className="flex items-center gap-4">

          {/* 題目圖片（若有） */}
          {quiz.imageUrl && (
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-b from-sky-50 to-white border border-sky-100 rounded-xl flex items-center justify-center p-1 shadow-inner shrink-0">
              <img
                src={quiz.imageUrl}
                alt={quiz.wordText}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>
          )}

          {/* 英文單字主標題（等寬字體，利於書寫模仿） */}
          <div className="flex flex-col">
            <span
              className="text-2xl md:text-4xl font-black tracking-widest text-sky-700 drop-shadow-sm"
              style={{ fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.15em' }}
            >
              {quiz.wordText.toLowerCase()}
            </span>
            <span className="text-[9px] md:text-[10px] text-stone-400 font-bold tracking-widest uppercase mt-0.5">
              Trace the word below
            </span>
          </div>
        </div>

        {/* TTS 播音按鈕 */}
        <button
          onClick={() => playEnglishPronunciation(quiz.wordText)}
          className="bg-gradient-to-br from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 active:scale-95 transition-all text-white p-3 md:p-4 rounded-full shadow-md border-b-3 border-indigo-700 flex items-center justify-center cursor-pointer shrink-0"
          aria-label={`Play pronunciation of ${quiz.wordText}`}
        >
          <Volume2 className="w-5 h-5 md:w-7 md:h-7 text-white" />
        </button>
      </div>

      {/* ② 四線三格手寫畫布區 */}
      <div className="flex-1 shrink-0 bg-white rounded-2xl p-2 md:p-3 flex flex-col items-center justify-center relative shadow-sm w-full gap-2">

        {/* 格線說明徽章 */}
        <div className="flex items-center gap-3 self-start px-1">
          <span className="text-[10px] md:text-xs font-extrabold text-stone-400 tracking-widest uppercase">
            Four-line Writing Grid
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
            <span className="inline-block w-4 h-0.5 bg-red-400 rounded-full" />
            Baseline
          </span>
        </div>

        {/* 畫布容器：寬長比 3:1，橫向展開，英文書寫習慣 */}
        <div className="relative w-full border-2 border-stone-200 rounded-2xl overflow-hidden bg-white shadow-inner touch-none select-none"
             style={{ height: 'clamp(100px, 22vw, 180px)' }}>

          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full cursor-crosshair block bg-transparent"
          />

          {/* 一鍵清除按鈕（浮於畫布右下角） */}
          <button
            onClick={handleClear}
            className="absolute bottom-3 right-3 flex items-center space-x-1 text-xs font-bold text-stone-500 hover:text-red-500 transition-colors bg-white/95 border border-stone-200 hover:bg-red-50 px-3 py-1.5 rounded-xl cursor-pointer shadow-md"
            aria-label="Clear canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* 格線區域標示說明（學習輔助） */}
        <div className="flex justify-between w-full px-1 text-[9px] md:text-[11px] font-bold text-stone-350">
          <span className="text-stone-300">↑ Ascender zone (tall letters: h, k, l)</span>
          <span className="text-red-300">Baseline →</span>
          <span className="text-stone-300">Descender zone (g, p, q, y) ↓</span>
        </div>
      </div>

      {/* ③ 家長評核席 */}
      <div className="shrink-0 bg-white rounded-2xl p-2.5 pb-3 flex flex-col gap-2 shadow-sm w-full">

        <div className="w-full flex justify-between items-center px-1">
          <span className="text-[10px] md:text-sm font-extrabold text-stone-500">
            Parent Review Panel
          </span>
          <span className="text-[9px] md:text-xs font-bold text-stone-350 tracking-wide">
            Compare child's writing with the word above
          </span>
        </div>

        {/* 參考答案展示區（始終顯示目標單字） */}
        <div className="w-full bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center py-2 shadow-inner">
          <span
            className="text-xl md:text-3xl font-black tracking-widest text-sky-600"
            style={{ fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.15em' }}
          >
            {quiz.wordText.toLowerCase()}
          </span>
        </div>

        {/* 裁決按鈕 */}
        <div className="flex gap-3 w-full">
          <button
            id="btn-english-canvas-incorrect"
            onClick={handleIncorrectClick}
            className="flex-1 bg-red-50 border-2 border-red-200 hover:bg-red-100 text-red-600 font-black py-2 md:py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-sm text-xs md:text-sm"
          >
            <span>❌ Needs Practice</span>
          </button>
          <button
            id="btn-english-canvas-correct"
            onClick={handleCorrectClick}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black py-2 md:py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md border-b-3 border-emerald-700 text-xs md:text-sm"
          >
            <span>🎉 Well Done!</span>
          </button>
        </div>
      </div>

    </div>
  );
}
