import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import ResultScreen from '../shared/ResultScreen';
import DragMode from '../modes/DragMode';
import MatchMode from '../modes/MatchMode';
import ListenMode from '../modes/ListenMode';
import CanvasMode from '../modes/CanvasMode';
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
 *   - 'canvas' : 手寫辨識板 (CanvasMode)
 *   - 'match'  : 連連看配對 (MatchMode)
 *   - 'listen' : 聽音辨義選字 (ListenMode)
 * @field learningSubject - 本次作答的學習科目（課程維度）。
 *   - 'zhuyin'  : 注音符號拼音練習
 *   - 'english' : 英語學習課程（未來擴充）
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
 *
 * 解析規則：
 *   - 混合模式 ('mixed')  → 讀取當前題目的 assignedMode 並對映至標準值
 *   - 單一模式            → 直接對映當前 session 的 mode 至標準值
 *
 * @param sessionMode    - 目前遊戲 session 的整體模式
 * @param assignedMode   - 混合模式下當前題目被分配到的展示模式
 * @returns 標準化的 gameDisplayMode（供 PracticeLogPayload 使用）
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

export default function GameSession({ mode, onBackToLobby, onBackToModeSelect }: GameSessionProps) {
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

  const fetchQuizzes = () => {
    setLoading(true);
    setError(null);

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
        subject: 'zhuyin',
        correct: isCorrect,
        mode: mode === 'handwriting' ? 'canvas' : mode,
        gameDisplayMode: resolvedGameDisplayMode,
        learningSubject: 'zhuyin',
        userAnswer: userAnswerObj,
        user_answer: userAnswerObj,
        wrongPart: wrongPartList,
        wrong_part: wrongPartList
      };

      // 1. Log to local backend Express endpoints (with 2s timeout)
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

  // Correct answer callback from DragMode
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

  // Wrong attempt callback from DragMode
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

  // Next level handler from DragMode Success Modal
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

  // Loading Screen
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#faf8f5] items-center justify-center font-sans space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
          <Sparkles className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-extrabold text-stone-750">正在載入專屬星系題庫...</h2>
          <p className="text-xs text-stone-400 font-bold">隨機抽選 15 道精采關卡中</p>
        </div>
      </div>
    );
  }

  // Error Screen
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

  const getModeLabel = () => {
    switch (mode) {
      case 'drag-drop': return '拖曳圖卡答題';
      case 'matching': return '連連看挑戰';
      case 'listening': return '聽音選字關卡';
      case 'handwriting': return '手寫挑戰板';
      case 'mixed': return '混合隨機關卡';
      default: return '注音練習';
    }
  };


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
              注音挑戰王國
            </h1>
            <p className="text-[10px] text-stone-400 font-bold">Mode：{getModeLabel()}</p>
          </div>
        </div>

        {/* Live Score stats */}
        <div className="bg-amber-100/60 px-4 py-1.5 rounded-full border border-amber-200 flex items-center space-x-2 shadow-inner">
          <span className="text-xs text-amber-700 font-bold">第一嘗試答對數:</span>
          <span className="font-black text-amber-700 text-sm">{correctCount}</span>
        </div>
      </header>

      {/* Progress Bar Component */}
      <ProgressBar current={currentQuestionIndex + 1} total={quizzes.length} />

      {/* Gameplay Board — V6.0 動態視圖路由 */}
      {mode === 'mixed' && currentQuiz.assignedMode === 'handwriting' && (
        <CanvasMode
          key={currentQuestionIndex}
          quiz={currentQuiz}
          isLastQuestion={isLastQuestion}
          onCorrect={handleCorrectAnswer}
          onWrongAttempt={handleWrongAttempt}
          onNext={handleNextQuestion}
        />
      )}
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
      {mode === 'handwriting' && (
        <CanvasMode
          key={currentQuestionIndex}
          quiz={currentQuiz}
          isLastQuestion={isLastQuestion}
          onCorrect={handleCorrectAnswer}
          onWrongAttempt={handleWrongAttempt}
          onNext={handleNextQuestion}
        />
      )}
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
