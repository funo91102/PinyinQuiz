import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import ResultScreen from '../shared/ResultScreen';
import DragMode from '../modes/DragMode';
import MatchMode from '../modes/MatchMode';
import ListenMode from '../modes/ListenMode';
import CanvasMode from '../modes/CanvasMode';
import EnglishCanvas from '../modes/EnglishCanvas';
import fallbackQuizzes from '../../quizzes_seed.json';
import { useQuizWeight } from '../hooks/useQuizWeight';
import {
  type UniversalQuizItem,
  type QuizItemWithAssignedMode,
  type LearningSubjectCode
} from '../types/quiz';

const API_BASE = import.meta.env.PROD ? 'http://100.95.126.72:3001' : '';

const getImageUrl = (pathStr: string) => {
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
    return pathStr;
  }
  const cleanPath = pathStr.startsWith('/') ? pathStr.slice(1) : pathStr;
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}${cleanPath}`;
};

/**
 * V7.0：本檔案內部使用的型別別名。
 * 所有題目型別定義已統一集中至 src/types/quiz.ts，
 * 此處保留別名以利閱讀，避免到處散落長型別名。
 */
type QuizItem = UniversalQuizItem;
type QuizItemWithMode = QuizItemWithAssignedMode;

// ── V7.4 英文基礎題庫（Phonics Seed Pool）────────────────────────────────────
/**
 * 基礎英文測試題庫（符合 UniversalQuizItem[] 規範）
 *
 * 設計原則：
 *   - subject: 'phonics' 固定標記
 *   - wordText: 英文單字（小寫，短詞優先，適合 K1-K3 兒童）
 *   - imageUrl: 留空（由 EnglishCanvas 以純文字渲染展示，無需圖片依賴）
 *   - audioUrl: 留空（TTS en-US 動態產生，不依賴靜態音檔）
 *   - correctAnswer: 沿用四維結構，initial 存首字母音素供後端分析
 *   - letters: 略（EnglishCanvas 由 wordText 自動產生字母展示）
 *
 * 每批涵蓋短母音（CVC pattern）六大類：
 *   a-family: cat, bat, hat, map, nap
 *   e-family: bed, red, hen, ten, web
 *   i-family: big, dig, pig, hit, sit
 *   o-family: box, fox, hot, mop, top
 *   u-family: bug, cup, mud, run, sun
 *   blends/digraphs: ship, chip, shop, fish, dish
 */
const PHONICS_SEED_POOL: UniversalQuizItem[] = [
  // ── Short-A family ──
  { id: 9001, subject: 'phonics', wordText: 'cat', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'c', medial: 'a', final: 't', tone: '' } },
  { id: 9002, subject: 'phonics', wordText: 'bat', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'b', medial: 'a', final: 't', tone: '' } },
  { id: 9003, subject: 'phonics', wordText: 'hat', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'h', medial: 'a', final: 't', tone: '' } },
  { id: 9004, subject: 'phonics', wordText: 'map', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'm', medial: 'a', final: 'p', tone: '' } },
  { id: 9005, subject: 'phonics', wordText: 'nap', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'n', medial: 'a', final: 'p', tone: '' } },
  // ── Short-E family ──
  { id: 9006, subject: 'phonics', wordText: 'bed', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'b', medial: 'e', final: 'd', tone: '' } },
  { id: 9007, subject: 'phonics', wordText: 'red', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'r', medial: 'e', final: 'd', tone: '' } },
  { id: 9008, subject: 'phonics', wordText: 'hen', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'h', medial: 'e', final: 'n', tone: '' } },
  { id: 9009, subject: 'phonics', wordText: 'ten', imageUrl: '', audioUrl: '', correctAnswer: { initial: 't', medial: 'e', final: 'n', tone: '' } },
  { id: 9010, subject: 'phonics', wordText: 'web', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'w', medial: 'e', final: 'b', tone: '' } },
  // ── Short-I family ──
  { id: 9011, subject: 'phonics', wordText: 'big', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'b', medial: 'i', final: 'g', tone: '' } },
  { id: 9012, subject: 'phonics', wordText: 'dig', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'd', medial: 'i', final: 'g', tone: '' } },
  { id: 9013, subject: 'phonics', wordText: 'pig', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'p', medial: 'i', final: 'g', tone: '' } },
  { id: 9014, subject: 'phonics', wordText: 'hit', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'h', medial: 'i', final: 't', tone: '' } },
  { id: 9015, subject: 'phonics', wordText: 'sit', imageUrl: '', audioUrl: '', correctAnswer: { initial: 's', medial: 'i', final: 't', tone: '' } },
  // ── Short-O family ──
  { id: 9016, subject: 'phonics', wordText: 'box', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'b', medial: 'o', final: 'x', tone: '' } },
  { id: 9017, subject: 'phonics', wordText: 'fox', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'f', medial: 'o', final: 'x', tone: '' } },
  { id: 9018, subject: 'phonics', wordText: 'hot', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'h', medial: 'o', final: 't', tone: '' } },
  { id: 9019, subject: 'phonics', wordText: 'mop', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'm', medial: 'o', final: 'p', tone: '' } },
  { id: 9020, subject: 'phonics', wordText: 'top', imageUrl: '', audioUrl: '', correctAnswer: { initial: 't', medial: 'o', final: 'p', tone: '' } },
  // ── Short-U family ──
  { id: 9021, subject: 'phonics', wordText: 'bug', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'b', medial: 'u', final: 'g', tone: '' } },
  { id: 9022, subject: 'phonics', wordText: 'cup', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'c', medial: 'u', final: 'p', tone: '' } },
  { id: 9023, subject: 'phonics', wordText: 'mud', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'm', medial: 'u', final: 'd', tone: '' } },
  { id: 9024, subject: 'phonics', wordText: 'run', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'r', medial: 'u', final: 'n', tone: '' } },
  { id: 9025, subject: 'phonics', wordText: 'sun', imageUrl: '', audioUrl: '', correctAnswer: { initial: 's', medial: 'u', final: 'n', tone: '' } },
  // ── Blends & Digraphs ──
  { id: 9026, subject: 'phonics', wordText: 'ship', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'sh', medial: 'i', final: 'p', tone: '' } },
  { id: 9027, subject: 'phonics', wordText: 'chip', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'ch', medial: 'i', final: 'p', tone: '' } },
  { id: 9028, subject: 'phonics', wordText: 'shop', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'sh', medial: 'o', final: 'p', tone: '' } },
  { id: 9029, subject: 'phonics', wordText: 'fish', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'f', medial: 'i', final: 'sh', tone: '' } },
  { id: 9030, subject: 'phonics', wordText: 'dish', imageUrl: '', audioUrl: '', correctAnswer: { initial: 'd', medial: 'i', final: 'sh', tone: '' } },
];

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

/**
 * V7.0 雙語宇宙：作答紀錄傳送 Payload 的完整型別定義。
 *
 * @field gameDisplayMode - 本題實際呈現給學習者的遊戲介面類型。
 *   - 'drag'   : 拖曳圖卡配對 (DragMode)
 *   - 'canvas' : 手寫辨識板 (CanvasMode / EnglishCanvas)
 *   - 'match'  : 連連看配對 (MatchMode)
 *   - 'listen' : 聽音辨義選字 (ListenMode)
 * @field learningSubject - 本次作答的學習科目（課程維度）。
 *   - 'zhuyin'  : 注音符號拼音練習
 *   - 'phonics' : 英語自然發音學習
 */
export interface PracticeLogPayload {
  quizId: number;
  isCorrect: boolean;
  spentSeconds: number;
  subject: string;
  correct: boolean;
  mode: string;
  gameDisplayMode: 'drag' | 'canvas' | 'match' | 'listen';
  learningSubject: LearningSubjectCode;
  userAnswer: { initial: string; medial: string; final: string; tone: string };
  user_answer: { initial: string; medial: string; final: string; tone: string };
  wrongPart: string[];
  wrong_part: string[];
}

interface GameSessionProps {
  mode: 'drag-drop' | 'matching' | 'listening' | 'handwriting' | 'mixed';
  /** V7.4：學習科目維度，決定題庫來源與手寫面板語系 */
  subject: LearningSubjectCode;
  onBackToLobby: () => void;
  onBackToModeSelect: () => void;
}

/**
 * V6.0 隨機模式分發純函式（模組層級，提升至組件外部）
 *
 * 將此函式置於組件外部，確保在模組解析階段即完成初始化，
 * 彻底避免 fetchQuizzes 在組件構造階段觸發暫時性死區（Temporal Dead Zone）錯誤。
 *
 * @param quizPool - 已經加權抽出的題目陣列
 * @returns 上有 assignedMode 標記的新陣列（原始資料不變動）
 */
function assignRandomDisplayModes(quizPool: UniversalQuizItem[]): QuizItemWithAssignedMode[] {
  return quizPool.map(quizItem => ({
    ...quizItem,
    assignedMode: Math.random() < 0.5 ? 'handwriting' : 'drag'
  } as QuizItemWithAssignedMode));
}

/**
 * V7.0 雙語宇宙：將遊戲 session mode 與題目的 assignedMode 解析為
 * PracticeLogPayload 所需的標準化 gameDisplayMode 值。
 */
function resolveGameDisplayMode(
  sessionMode: GameSessionProps['mode'],
  assignedMode: QuizItemWithAssignedMode['assignedMode']
): PracticeLogPayload['gameDisplayMode'] {
  if (sessionMode === 'mixed') {
    return assignedMode === 'handwriting' ? 'canvas' : 'drag';
  }
  switch (sessionMode) {
    case 'handwriting': return 'canvas';
    case 'drag-drop':   return 'drag';
    case 'matching':    return 'match';
    case 'listening':   return 'listen';
    default:            return 'drag';
  }
}

export default function GameSession({ mode, subject, onBackToLobby, onBackToModeSelect }: GameSessionProps) {
  const [quizzes, setQuizzes] = useState<QuizItemWithMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // V5.0 加權抽題演算法 Hook
  const { recordWrongAttempt, generateWeightedQuizzes } = useQuizWeight();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [logsArray, setLogsArray] = useState<WrongAttempt[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'result'>('playing');

  // Timers
  const sessionStartTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());


  useEffect(() => {
    fetchQuizzes();
  }, []);

  /**
   * V7.4 fetchQuizzes — 雙語出題引擎
   *
   * 路由邏輯：
   *   - subject === 'phonics' → 直接使用本地 PHONICS_SEED_POOL，注入加權引擎
   *   - subject === 'zhuyin'  → 嘗試後端 API，失敗則 fallback 到 quizzes_seed.json
   */
  const fetchQuizzes = () => {
    setLoading(true);
    setError(null);

    // ── Phonics 路徑：直接使用本地英文題庫，不需要後端 API ────────────────
    if (subject === 'phonics') {
      try {
        const weightedPhonics = generateWeightedQuizzes(PHONICS_SEED_POOL, 15) as UniversalQuizItem[];
        setQuizzes(assignRandomDisplayModes(weightedPhonics));
        setLoading(false);
        sessionStartTimeRef.current = Date.now();
        questionStartTimeRef.current = Date.now();
      } catch (phonicsErr: any) {
        console.error('Failed to load phonics quiz pool:', phonicsErr);
        setError(phonicsErr.message || '英文題庫載入失敗');
        setLoading(false);
      }
      return;
    }

    // ── Zhuyin 路徑：後端 API → fallback 本地 seed ────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    fetch(`${API_BASE}/api/quizzes`, { signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('無法取得注音關卡資料');
        return res.json();
      })
      .then((data: Omit<QuizItem, 'subject'>[]) => {
        const processed: UniversalQuizItem[] = data.map(item => ({
          ...item,
          subject: 'zhuyin' as const,   // V7.0: 現階段所有 API 資料為注音科目
          imageUrl: getImageUrl(item.imageUrl)
        }));
        // V5.0：以加權演算法抽出 15 題，讓錯題優先複習
        // V6.0：為每題隨機分發 50/50 的展示模式（手寫 or 拖曳）
        const weightedQuizzes = generateWeightedQuizzes(processed, 15) as UniversalQuizItem[];
        setQuizzes(assignRandomDisplayModes(weightedQuizzes));
        setLoading(false);
        sessionStartTimeRef.current = Date.now();
        questionStartTimeRef.current = Date.now();
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.warn('Backend API fetch failed, falling back to local seed quizzes:', err);
        try {
          // V5.0：先 map imageUrl，再以加權演算法抽出 15 題
          const processedFallback: UniversalQuizItem[] = (fallbackQuizzes as Omit<QuizItem, 'subject'>[]).map(item => ({
            ...item,
            subject: 'zhuyin' as const,  // V7.0: fallback 種子資料全為注音科目
            imageUrl: getImageUrl(item.imageUrl)
          }));
          const weightedFallback = generateWeightedQuizzes(processedFallback, 15) as UniversalQuizItem[];
          // V6.0：Fallback 路徑同步套用隨機模式分發
          setQuizzes(assignRandomDisplayModes(weightedFallback));
          setLoading(false);
          sessionStartTimeRef.current = Date.now();
          questionStartTimeRef.current = Date.now();
        } catch (fallbackErr: any) {
          console.error('Fallback to local quizzes failed:', fallbackErr);
          setError(fallbackErr.message || '讀取資料時發生錯誤');
          setLoading(false);
        }
      });
  };

  // Telemetry: Log question-level attempt to backend and n8n
  const logQuestionAttempt = async (
    quizId: number,
    isCorrect: boolean,
    wrongAnswerObj: { initial: string; medial: string; final: string; tone: string } | null
  ) => {
    try {
      const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
      const gameWebhookUrl = import.meta.env.VITE_N8N_GAME_WEBHOOK_URL;
      const currentQuiz = quizzes[currentQuestionIndex];
      if (!currentQuiz) return;

      const hasMedial = currentQuiz.correctAnswer.medial && currentQuiz.correctAnswer.medial.trim() !== "";

      // Construct userAnswer
      const userAnswerObj = wrongAnswerObj || {
        initial: currentQuiz.correctAnswer.initial,
        medial: currentQuiz.correctAnswer.medial,
        final: currentQuiz.correctAnswer.final,
        tone: currentQuiz.correctAnswer.tone
      };

      // Construct wrongPart
      const wrongPartList: string[] = [];
      if (wrongAnswerObj) {
        if (wrongAnswerObj.initial !== currentQuiz.correctAnswer.initial) wrongPartList.push('initial');
        if (hasMedial && wrongAnswerObj.medial !== currentQuiz.correctAnswer.medial) wrongPartList.push('medial');
        if (wrongAnswerObj.final !== currentQuiz.correctAnswer.final) wrongPartList.push('final');
        if (wrongAnswerObj.tone !== currentQuiz.correctAnswer.tone) wrongPartList.push('tone');
      }

      /** V7.0：解析本題實際呈現的遊戲介面類型，供下游分析管線使用 */
      const resolvedGameDisplayMode = resolveGameDisplayMode(mode, currentQuiz.assignedMode);

      const logPayload: PracticeLogPayload = {
        quizId,
        isCorrect,
        spentSeconds: elapsed,
        subject: subject,
        correct: isCorrect,
        mode: mode === 'handwriting' ? 'canvas' : mode,
        gameDisplayMode: resolvedGameDisplayMode,
        learningSubject: subject,
        userAnswer: userAnswerObj,
        user_answer: userAnswerObj,
        wrongPart: wrongPartList,
        wrong_part: wrongPartList
      };

      // 1. Log to local backend Express endpoints (with 2s timeout)
      // Only log zhuyin to backend DB (phonics backend not yet implemented)
      if (subject === 'zhuyin') {
        let localLogId: number | null = null;
        try {
          const controllerLocal = new AbortController();
          const timeoutLocal = setTimeout(() => controllerLocal.abort(), 2000);

          const responseLocal = await fetch(`${API_BASE}/api/practice-logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId,
              isCorrect,
              spentSeconds: elapsed
            }),
            signal: controllerLocal.signal
          });
          clearTimeout(timeoutLocal);

          if (responseLocal.ok) {
            const resData = await responseLocal.json();
            localLogId = resData.id;

            if (!isCorrect && wrongAnswerObj && localLogId) {
              const controllerError = new AbortController();
              const timeoutError = setTimeout(() => controllerError.abort(), 2000);

              await fetch(`${API_BASE}/api/error-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  logId: localLogId,
                  wrongAnswer: wrongAnswerObj
                }),
                signal: controllerError.signal
              });
              clearTimeout(timeoutError);
            }
          }
        } catch (errLocal) {
          console.error('Failed to log to local DB:', errLocal);
        }
      }

      // 2. Log to external n8n webhook (with 3s timeout)
      if (gameWebhookUrl) {
        try {
          const controllerWebhook = new AbortController();
          const timeoutWebhook = setTimeout(() => controllerWebhook.abort(), 3000);

          const webhookPayload = {
            action: 'practice-log',
            ...logPayload
          };
          const responseWebhook = await fetch(gameWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload),
            signal: controllerWebhook.signal
          });
          clearTimeout(timeoutWebhook);

          if (responseWebhook.ok && !isCorrect && wrongAnswerObj) {
            const webData = await responseWebhook.json();
            const webhookLogId = webData.id;
            if (webhookLogId) {
              const controllerWebhookErr = new AbortController();
              const timeoutWebhookErr = setTimeout(() => controllerWebhookErr.abort(), 3000);

              await fetch(gameWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'error-analysis',
                  logId: webhookLogId,
                  ...logPayload
                }),
                signal: controllerWebhookErr.signal
              });
              clearTimeout(timeoutWebhookErr);
            }
          }
        } catch (errWebhook) {
          console.error('Failed to log to n8n webhook:', errWebhook);
        }
      }

    } catch (e) {
      console.error('Error logging question attempt:', e);
    }
  };

  // Telemetry: Log session complete to n8n
  const logSessionComplete = async (finalCorrectCount: number) => {
    const gameWebhookUrl = import.meta.env.VITE_N8N_GAME_WEBHOOK_URL;
    if (gameWebhookUrl) {
      try {
        const elapsed = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch(gameWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'session-complete',
            mode: mode === 'handwriting' ? 'canvas' : mode,
            learningSubject: subject,
            correctCount: finalCorrectCount,
            totalCount: quizzes.length,
            spentSeconds: elapsed,
            timestamp: new Date().toISOString()
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Failed to send session complete log to n8n:', err);
      }
    }
  };

  // Correct answer callback from DragMode / CanvasMode / EnglishCanvas
  const handleCorrectAnswer = (hasMadeMistake: boolean) => {
    let newCorrectCount = correctCount;
    if (!hasMadeMistake) {
      newCorrectCount = correctCount + 1;
      setCorrectCount(prev => prev + 1);
    }

    // Telemetry log
    logQuestionAttempt(quizzes[currentQuestionIndex].id, !hasMadeMistake, null);

    const isLast = currentQuestionIndex === quizzes.length - 1;

    if (isLast) {
      // For 15th question, wait 1000ms and switch to ResultScreen without showing intermediate popup
      setTimeout(() => {
        setGameState('result');
        logSessionComplete(newCorrectCount);
      }, 1000);
    }
  };

  // Wrong attempt callback from DragMode / CanvasMode / EnglishCanvas
  const handleWrongAttempt = (wrongAnswerObj: { initial: string; medial: string; final: string; tone: string }) => {
    // V5.0：立即將此題錯誤記入 localStorage，下次開局時提升其抽中權重
    const currentQuiz = quizzes[currentQuestionIndex];
    if (currentQuiz) {
      recordWrongAttempt(currentQuiz.id);
    }
    // Telemetry log
    logQuestionAttempt(quizzes[currentQuestionIndex].id, false, wrongAnswerObj);

    // Record wrong answer in logsArray (only record first mistake for each question)
    if (currentQuiz) {
      setLogsArray(prev => {
        if (prev.some(log => log.quizId === currentQuiz.id)) {
          return prev;
        }
        const newLog: WrongAttempt = {
          quizId: currentQuiz.id,
          wordText: currentQuiz.wordText,
          correctAnswer: currentQuiz.correctAnswer,
          wrongAnswer: wrongAnswerObj
        };
        return [...prev, newLog];
      });
    }
  };

  // Next level handler from DragMode / CanvasMode / EnglishCanvas Success Modal
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizzes.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      questionStartTimeRef.current = Date.now();
    }
  };

  // Restart session
  const handleRestartSession = () => {
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setLogsArray([]);
    setGameState('playing');
    fetchQuizzes();
  };

  // ── Header label helpers ──────────────────────────────────────────────────

  const getKingdomLabel = () => subject === 'phonics' ? '英文拼音王國' : '注音挑戰王國';

  const getModeLabel = () => {
    switch (mode) {
      case 'drag-drop':   return subject === 'phonics' ? '字母拼組答題' : '拖曳圖卡答題';
      case 'matching':    return '連連看挑戰';
      case 'listening':   return subject === 'phonics' ? '聽音辨字關卡' : '聽音選字關卡';
      case 'handwriting': return subject === 'phonics' ? '四線三格手寫板' : '手寫挑戰板';
      case 'mixed':       return subject === 'phonics' ? '英文混合冒險' : '混合隨機關卡';
      default:            return '練習';
    }
  };

  // ── Loading Screen ────────────────────────────────────────────────────────
  if (loading) {
    const isPhonics = subject === 'phonics';
    return (
      <div className="flex flex-col min-h-screen bg-[#faf8f5] items-center justify-center font-sans space-y-6">
        <div className="relative">
          <div className={`w-16 h-16 border-4 ${isPhonics ? 'border-violet-200 border-t-violet-500' : 'border-amber-200 border-t-amber-500'} rounded-full animate-spin`}></div>
          <Sparkles className={`w-6 h-6 ${isPhonics ? 'text-violet-500' : 'text-amber-500'} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse`} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-extrabold text-stone-750">
            {isPhonics ? '正在載入英文拼音題庫...' : '正在載入專屬星系題庫...'}
          </h2>
          <p className="text-xs text-stone-400 font-bold">
            {isPhonics ? '注入弱項加權引擎，抽選 15 道英文關卡' : '隨機抽選 15 道精采關卡中'}
          </p>
        </div>
      </div>
    );
  }

  // ── Error Screen ──────────────────────────────────────────────────────────
  if (error || quizzes.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-[#faf8f5] items-center justify-center font-sans p-6 text-center max-w-md mx-auto space-y-6">
        <div className="bg-red-50 p-4 rounded-3xl border-2 border-red-100 flex items-center justify-center text-red-500">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-stone-850">連接題庫星系時發生錯誤</h2>
          <p className="text-sm font-bold text-stone-500">{error || '星系中沒有發現關卡資料'}</p>
        </div>
        <div className="flex space-x-4 w-full">
          <button
            onClick={fetchQuizzes}
            className="flex-1 bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-white font-extrabold py-3 px-6 rounded-2xl shadow-md cursor-pointer flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>重新載入</span>
          </button>
          <button
            onClick={onBackToModeSelect}
            className="flex-1 bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-700 font-extrabold py-3 px-6 rounded-2xl shadow-sm cursor-pointer"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizzes.length - 1;

  // ── Result Screen ─────────────────────────────────────────────────────────
  if (gameState === 'result') {
    return (
      <ResultScreen
        correctCount={correctCount}
        totalCount={quizzes.length}
        modeName={getModeLabel()}
        wrongAttempts={logsArray}
        onRestart={handleRestartSession}
        onSelectMode={onBackToModeSelect}
        onGoLobby={onBackToLobby}
      />
    );
  }

  // ── Header accent color ───────────────────────────────────────────────────
  const isPhonics = subject === 'phonics';
  const headerAccentClass = isPhonics
    ? 'bg-violet-100/60 border-violet-200'
    : 'bg-amber-100/60 border-amber-200';
  const scoreTextClass = isPhonics ? 'text-violet-700' : 'text-amber-700';

  return (
    <div className="flex flex-col min-h-screen bg-[#faf8f5] text-stone-800 font-sans select-none overflow-hidden pb-6">

      {/* Header Info */}
      <header className="px-6 py-4 bg-white/95 border-b border-stone-200/60 flex justify-between items-center shadow-sm relative z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToModeSelect}
            className="text-xs bg-stone-150 hover:bg-stone-200/80 border border-stone-250 text-stone-700 font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            放棄挑戰
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide text-stone-850">
              {getKingdomLabel()}
            </h1>
            <p className="text-[10px] text-stone-400 font-bold">Mode：{getModeLabel()}</p>
          </div>
        </div>

        {/* Live Score stats */}
        <div className={`${headerAccentClass} px-4 py-1.5 rounded-full border flex items-center space-x-2 shadow-inner`}>
          <span className={`text-xs ${scoreTextClass} font-bold`}>第一嘗試答對數:</span>
          <span className={`font-black ${scoreTextClass} text-sm`}>{correctCount}</span>
        </div>
      </header>

      {/* Progress Bar Component */}
      <ProgressBar current={currentQuestionIndex + 1} total={quizzes.length} />

      {/* ── Gameplay Board — V7.4 雙語視圖路由 ──────────────────────────── */}

      {/* Mixed mode: handwriting slot */}
      {mode === 'mixed' && currentQuiz.assignedMode === 'handwriting' && (
        isPhonics ? (
          <EnglishCanvas
            key={currentQuestionIndex}
            quiz={currentQuiz}
            isLastQuestion={isLastQuestion}
            onCorrect={handleCorrectAnswer}
            onWrongAttempt={handleWrongAttempt}
            onNext={handleNextQuestion}
          />
        ) : (
          <CanvasMode
            key={currentQuestionIndex}
            quiz={currentQuiz}
            isLastQuestion={isLastQuestion}
            onCorrect={handleCorrectAnswer}
            onWrongAttempt={handleWrongAttempt}
            onNext={handleNextQuestion}
          />
        )
      )}

      {/* Mixed mode: drag slot */}
      {mode === 'mixed' && currentQuiz.assignedMode === 'drag' && (
        <DragMode
          key={currentQuestionIndex}
          quiz={currentQuiz}
          isLastQuestion={isLastQuestion}
          onCorrect={handleCorrectAnswer}
          onWrongAttempt={handleWrongAttempt}
          onNext={handleNextQuestion}
        />
      )}

      {/* Pure handwriting mode — V7.4 學科路由 */}
      {mode === 'handwriting' && (
        isPhonics ? (
          <EnglishCanvas
            key={currentQuestionIndex}
            quiz={currentQuiz}
            isLastQuestion={isLastQuestion}
            onCorrect={handleCorrectAnswer}
            onWrongAttempt={handleWrongAttempt}
            onNext={handleNextQuestion}
          />
        ) : (
          <CanvasMode
            key={currentQuestionIndex}
            quiz={currentQuiz}
            isLastQuestion={isLastQuestion}
            onCorrect={handleCorrectAnswer}
            onWrongAttempt={handleWrongAttempt}
            onNext={handleNextQuestion}
          />
        )
      )}

      {/* Drag-drop mode */}
      {mode === 'drag-drop' && (
        <DragMode
          key={currentQuestionIndex}
          quiz={currentQuiz}
          isLastQuestion={isLastQuestion}
          onCorrect={handleCorrectAnswer}
          onWrongAttempt={handleWrongAttempt}
          onNext={handleNextQuestion}
        />
      )}

      {/* Listening mode */}
      {mode === 'listening' && (
        <ListenMode
          key={currentQuestionIndex}
          quiz={currentQuiz}
          isLastQuestion={isLastQuestion}
          onCorrect={handleCorrectAnswer}
          onWrongAttempt={handleWrongAttempt}
          onNext={handleNextQuestion}
        />
      )}

      {/* Matching mode */}
      {mode === 'matching' && (
        <MatchMode
          key={Math.floor(currentQuestionIndex / 5)}
          quizzes={quizzes}
          currentQuestionIndex={currentQuestionIndex}
          onCorrect={(quizId, hadMistake) => {
            let newCorrectCount = correctCount;
            if (!hadMistake) {
              newCorrectCount = correctCount + 1;
              setCorrectCount(prev => prev + 1);
            }
            logQuestionAttempt(quizId, !hadMistake, null);
            const isLast = currentQuestionIndex === quizzes.length - 1;
            if (isLast) {
              setTimeout(() => {
                setGameState('result');
                logSessionComplete(newCorrectCount);
              }, 1000);
            } else {
              setCurrentQuestionIndex(prev => prev + 1);
              questionStartTimeRef.current = Date.now();
            }
          }}
          onWrongAttempt={(leftQuiz, wrongAnswer) => {
            logQuestionAttempt(leftQuiz.id, false, wrongAnswer);
            setLogsArray(prev => {
              if (prev.some(log => log.quizId === leftQuiz.id)) {
                return prev;
              }
              const newLog = {
                quizId: leftQuiz.id,
                wordText: leftQuiz.wordText,
                correctAnswer: leftQuiz.correctAnswer,
                wrongAnswer: wrongAnswer
              };
              return [...prev, newLog];
            });
          }}
        />
      )}

    </div>
  );
}

