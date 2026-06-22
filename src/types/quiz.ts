/**
 * quiz.ts — V7.0 雙語宇宙通用題庫型別定義中心
 *
 * 設計理念：
 *   將原先散落於各 mode 組件的 QuizItem 區域性 interface 升級為
 *   全專案共享的 UniversalQuizItem，以「學習科目 (learningSubject)」
 *   維度作為核心分支，支援注音（zhuyin）及英語自然發音（phonics）。
 *
 * 版本歷史：
 *   V5.0 — 初版 QuizItem (注音專用)
 *   V6.0 — 擴展 assignedMode 混合模式支援
 *   V7.0 — 升級為 UniversalQuizItem，引入 subject 學習科目維度
 */

// ── 核心通用題目型別 ──────────────────────────────────────────────────────────

/**
 * 學習科目識別碼。
 *   - 'zhuyin'  : 注音符號拼音練習（現階段主科目）
 *   - 'phonics' : 英語自然發音學習（V7.0 擴充，未來課程）
 */
export type LearningSubjectCode = 'zhuyin' | 'phonics';

/**
 * V7.2 通用字母槽定義。
 *
 * 代表 DragMode 中一個放置艙位的完整定義。
 * 注音科目由組件從 correctAnswer 合成；
 * phonics 科目由資料源直接提供。
 *
 * @field slotKey   - 唯一識別此槽位的 key（如 'initial'、'L0'、'L1'）
 * @field answer    - 此槽位期望的正確字母/符號
 * @field slotLabel - 空艙時顯示的提示標籤（如 '聲母'、'L1'）
 * @field colorTier - 配色分組（決定積木與艙位的視覺主題）
 */
export interface LetterSlot {
  slotKey: string;
  answer: string;
  slotLabel: string;
  colorTier: 'teal' | 'sky' | 'rose' | 'amber' | 'violet' | 'indigo';
}

/**
 * UniversalQuizItem — V7.0 雙語宇宙通用題目資料結構。
 *
 * 設計為向上相容原有 QuizItem 介面的超集型別：
 *   - 所有原有欄位（id, wordText, imageUrl, audioUrl, correctAnswer）完整保留
 *   - 新增 `subject` 欄位作為課程科目識別碼
 *   - 注音科目的 `correctAnswer` 沿用原有四維結構（initial / medial / final / tone）
 *
 * @field id           - 題目唯一流水號（資料庫主鍵）
 * @field subject      - 學習科目維度，決定 TTS 語言策略與評分邏輯
 * @field wordText     - 題目核心文字（中文詞彙 或 英語單字，通用欄位）
 * @field imageUrl     - 題目配圖的 URL 路徑（通用欄位）
 * @field audioUrl     - 題目音檔的 URL 路徑（預留，TTS 優先時可空）
 * @field correctAnswer - 正確答案結構（注音四維：initial / medial / final / tone）
 * @field letters      - V7.2 動態字母槽陣列（英語拼字模式用，注音科目由組件自動合成）
 */
export interface UniversalQuizItem {
  id: number;
  subject: LearningSubjectCode;
  wordText: string;
  imageUrl: string;
  audioUrl: string;
  correctAnswer: {
    initial: string;
    medial: string;
    final: string;
    tone: string;
  };
  /**
   * V7.2：動態字母槽定義陣列。
   *   - phonics 科目：由後端/資料源提供，每個元素代表一個拼字位置
   *   - zhuyin 科目：此欄位為空（undefined），組件從 correctAnswer 自動合成 4 槽結構
   */
  letters?: LetterSlot[];
}

/**
 * V6.0/V7.0 混合模式題目型別。
 *
 * 繼承自 UniversalQuizItem，附加 assignedMode 欄位，
 * 記錄本題在本次 session 中被隨機指派的展示形式。
 *
 * @field assignedMode - 本題被分發到的展示模式（手寫關卡 或 拖曳關卡）
 */
export interface QuizItemWithAssignedMode extends UniversalQuizItem {
  /** 本題被分發到的展示模式：手寫關卡或拖曳關卡 */
  assignedMode: 'handwriting' | 'drag';
}

/**
 * TTS 語音播放參數設定型別。
 *
 * 由 resolveUtteranceParameters 函式根據 LearningSubjectCode 動態產生，
 * 供 SpeechSynthesisUtterance 直接消費。
 *
 * @field lang - BCP 47 語言標籤
 * @field rate - 語速倍率（1.0 為正常速度）
 */
export interface UtteranceParameters {
  lang: string;
  rate: number;
}

/**
 * resolveUtteranceParameters — V7.0 雙語 TTS 語音參數解析器
 *
 * 根據學習科目，動態決定最適合兒童學習的 TTS 語言與語速參數。
 *
 * 參數策略：
 *   - 'zhuyin'  → zh-TW，rate 0.70（台灣中文，偏慢利於辨識注音）
 *   - 'phonics' → en-US，rate 0.85（美式英語，略慢利於兒童音素辨識）
 *
 * @param subject - 學習科目識別碼
 * @returns TTS utterance 所需的語言與語速設定
 */
export function resolveUtteranceParameters(subject: LearningSubjectCode): UtteranceParameters {
  switch (subject) {
    case 'phonics':
      return { lang: 'en-US', rate: 0.85 };
    case 'zhuyin':
    default:
      return { lang: 'zh-TW', rate: 0.70 };
  }
}
