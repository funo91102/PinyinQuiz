/**
 * useQuizWeight — V5.0 錯誤題加權抽題演算法 Hook
 *
 * 設計理念：
 *   採用「輪盤賭選擇法（Roulette Wheel Selection）」，讓錯誤次數
 *   越多的題目被抽中的機率越高，但不完全排除其他題目，保持多元性。
 *
 * 權重公式：
 *   題目權重 = 1 + 該題累積錯誤次數 × 1.5
 *   ─ 從未答錯 → 權重 1.0
 *   ─ 答錯 1 次 → 權重 2.5
 *   ─ 答錯 2 次 → 權重 4.0
 *   ─ 依此類推
 *
 * 持久化策略：
 *   錯題紀錄以 { [quizId]: wrongCount } 的形式存入 localStorage，
 *   key 為 STORAGE_KEY，跨 session 保留，直到家長手動清除。
 */

import { useCallback } from 'react';

// ── 型別定義 ────────────────────────────────────────────────────────────────

/** 與各 mode 組件共享的題目資料結構（與 GameSession 中的 QuizItem 保持一致） */
export interface QuizItem {
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

/**
 * localStorage 中儲存的錯題紀錄格式。
 * key 為 quizId 的字串形式，value 為累積錯誤次數。
 *
 * @example { "3": 2, "17": 1, "42": 4 }
 */
export type WrongCountRegistry = Record<string, number>;

// ── 常數 ────────────────────────────────────────────────────────────────────

/** localStorage 中存放錯題紀錄的唯一金鑰 */
const STORAGE_KEY = 'pinyinQuiz_wrongCountRegistry_v1';

/** 基礎權重：任何題目在未答錯時的最低被抽中機率基底 */
const BASE_WEIGHT = 1;

/** 每答錯一次所增加的額外權重倍率 */
const WRONG_PENALTY_MULTIPLIER = 1.5;

// ── 純函式工具 ──────────────────────────────────────────────────────────────

/**
 * 從 localStorage 讀取錯題紀錄。
 * 若 key 不存在或 JSON 格式損毀，回傳空物件，不拋出例外。
 */
const loadWrongCountRegistry = (): WrongCountRegistry => {
  try {
    const serializedRegistry = localStorage.getItem(STORAGE_KEY);
    if (!serializedRegistry) return {};
    return JSON.parse(serializedRegistry) as WrongCountRegistry;
  } catch {
    // JSON 損毀時靜默降級為空狀態，避免影響正常遊戲流程
    return {};
  }
};

/**
 * 將更新後的錯題紀錄序列化並寫回 localStorage。
 * @param registry - 最新的錯題計數物件
 */
const persistWrongCountRegistry = (registry: WrongCountRegistry): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // localStorage 寫入失敗（如私密瀏覽模式容量限制）時靜默忽略
    console.warn('[useQuizWeight] localStorage 寫入失敗，本次錯題紀錄將不被保留。');
  }
};

/**
 * 根據題目 id 與現有的錯題紀錄，計算該題目的選取權重。
 *
 * @param quizId - 題目的唯一識別 id
 * @param registry - 目前的錯題計數紀錄
 * @returns 正數權重值（最小為 BASE_WEIGHT）
 */
const calculateItemWeight = (quizId: number, registry: WrongCountRegistry): number => {
  const accumulatedWrongCount = registry[String(quizId)] ?? 0;
  return BASE_WEIGHT + accumulatedWrongCount * WRONG_PENALTY_MULTIPLIER;
};

// ── Hook 主體 ────────────────────────────────────────────────────────────────

export interface UseQuizWeightReturn {
  /**
   * 記錄某題目的一次錯誤。
   * 會直接更新並持久化至 localStorage，無需傳入目前 state。
   *
   * @param quizId - 答錯的題目 id
   */
  recordWrongAttempt: (quizId: number) => void;

  /**
   * 以加權輪盤賭選擇法從題庫中抽出指定數量的題目。
   * 內建去重機制，確保同次挑戰中同一題目最多出現一次；
   * 若題庫總數不足 count，則回傳全數題目（打亂順序後）。
   *
   * @param pool  - 完整題庫陣列
   * @param count - 欲抽取的題目數量（例如 15）
   * @returns 已加權排序、去重後的題目陣列
   */
  generateWeightedQuizzes: (pool: QuizItem[], count: number) => QuizItem[];

  /**
   * 取得目前 localStorage 中的完整錯題計數紀錄，供偵錯或統計頁面使用。
   */
  getWrongCountRegistry: () => WrongCountRegistry;

  /**
   * 清除 localStorage 中的全部錯題紀錄。
   * 適用於「重置學習進度」功能。
   */
  clearWrongCountRegistry: () => void;
}

/**
 * useQuizWeight
 *
 * 管理錯題加權邏輯的自訂 Hook。
 * 所有 callback 均以 useCallback 包裹，避免在父組件 re-render 時
 * 不必要地重新建立函式引用，提升效能。
 */
export function useQuizWeight(): UseQuizWeightReturn {

  // ── recordWrongAttempt ───────────────────────────────────────────────────

  const recordWrongAttempt = useCallback((quizId: number): void => {
    const currentRegistry = loadWrongCountRegistry();
    const quizIdKey = String(quizId);
    const previousWrongCount = currentRegistry[quizIdKey] ?? 0;

    const updatedRegistry: WrongCountRegistry = {
      ...currentRegistry,
      [quizIdKey]: previousWrongCount + 1
    };

    persistWrongCountRegistry(updatedRegistry);
  }, []);

  // ── generateWeightedQuizzes ──────────────────────────────────────────────

  const generateWeightedQuizzes = useCallback(
    (pool: QuizItem[], count: number): QuizItem[] => {

      // 邊界情況：題庫為空
      if (pool.length === 0) return [];

      // 題庫數量不足時，直接回傳全部題目（費雪–葉茲洗牌後）
      if (pool.length <= count) {
        return [...pool].sort(() => Math.random() - 0.5);
      }

      const currentRegistry = loadWrongCountRegistry();

      // 將剩餘可選題目初始化為完整題庫的副本（去重用的可選池）
      let remainingCandidatePool: QuizItem[] = [...pool];

      /** 最終抽出的題目清單（有序，去重） */
      const selectedQuizzes: QuizItem[] = [];

      // ── 輪盤賭選擇迴圈 ────────────────────────────────────────────────────
      while (selectedQuizzes.length < count && remainingCandidatePool.length > 0) {

        // 步驟 1：計算當前可選池中每道題目的權重
        const weightedCandidates = remainingCandidatePool.map(quizItem => ({
          quizItem,
          weight: calculateItemWeight(quizItem.id, currentRegistry)
        }));

        // 步驟 2：累加所有候選題目的權重，得到輪盤總和
        const weightSum = weightedCandidates.reduce(
          (accumulator, candidate) => accumulator + candidate.weight,
          0
        );

        // 步驟 3：在 [0, weightSum) 區間內隨機投擲一個選擇點
        const randomSelector = Math.random() * weightSum;

        // 步驟 4：沿輪盤累積行走，找到隨機點落入的題目區段
        let selectionThreshold = 0;
        let selectedIndex = 0;

        for (let candidateIndex = 0; candidateIndex < weightedCandidates.length; candidateIndex++) {
          selectionThreshold += weightedCandidates[candidateIndex].weight;

          if (randomSelector < selectionThreshold) {
            selectedIndex = candidateIndex;
            break;
          }

          // 安全防線：若浮點誤差導致隨機點恰好等於 weightSum，
          // 則預設選擇最後一個候選題目
          if (candidateIndex === weightedCandidates.length - 1) {
            selectedIndex = candidateIndex;
          }
        }

        // 步驟 5：將選中的題目加入結果清單
        const chosenQuiz = remainingCandidatePool[selectedIndex];
        selectedQuizzes.push(chosenQuiz);

        // 步驟 6：從可選池中移除已選題目（去重）
        remainingCandidatePool = remainingCandidatePool.filter(
          (_, poolIndex) => poolIndex !== selectedIndex
        );
      }

      return selectedQuizzes;
    },
    []
  );

  // ── getWrongCountRegistry ────────────────────────────────────────────────

  const getWrongCountRegistry = useCallback((): WrongCountRegistry => {
    return loadWrongCountRegistry();
  }, []);

  // ── clearWrongCountRegistry ──────────────────────────────────────────────

  const clearWrongCountRegistry = useCallback((): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      console.warn('[useQuizWeight] 無法清除 localStorage 中的錯題紀錄。');
    }
  }, []);

  // ── 回傳 API ─────────────────────────────────────────────────────────────

  return {
    recordWrongAttempt,
    generateWeightedQuizzes,
    getWrongCountRegistry,
    clearWrongCountRegistry
  };
}
