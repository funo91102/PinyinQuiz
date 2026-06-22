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

  // ── Phonics 近音字動態生成器 ───────────────────────────────────────────────
  /**
   * generatePhonicsDistractors — 三層防禦干擾選項生成器
   *
   * 為確保 phonics 模式永遠有 3 個干擾選項，依序採用以下策略：
   *   層 1：從題庫中篩出 phonics 題目（wordText 不同者）
   *   層 2：從近音字靜態庫補充（相同母音 or 相同首字母家族）
   *   層 3：動態換音素（替換 CVC 結構的聲母/韻母）兜底至 3 個
   *
   * @param word - 目前題目的英文單字（如 "hot"）
   * @returns 3 個干擾英文單字（如 ["hat", "not", "pot"]）
   */
  const generatePhonicsDistractors = (word: string): string[] => {
    const target = word.toLowerCase().trim();
    const result = new Set<string>();

    // ── 層 1：從種子題庫中撈 phonics 候選詞 ────────────────────
    const poolFromSeed = (allQuizzes as any[])
      .filter(q => q.subject === 'phonics' && q.wordText?.toLowerCase() !== target)
      .map(q => q.wordText?.toLowerCase())
      .filter((w): w is string => !!w && w !== target);

    const shuffledSeed = [...new Set(poolFromSeed)].sort(() => Math.random() - 0.5);
    shuffledSeed.slice(0, 3).forEach(w => result.add(w));

    if (result.size >= 3) return [...result].slice(0, 3);

    // ── 層 2：近音字靜態庫（CVC 家族 + 常見拼讀組合）───────────
    const CVC_FAMILIES: Record<string, string[]> = {
      // Short-a family
      'at':  ['bat','cat','fat','hat','mat','pat','rat','sat','vat'],
      'an':  ['ban','can','fan','man','pan','ran','tan','van'],
      'ap':  ['cap','gap','lap','map','nap','rap','tap','zap'],
      'ag':  ['bag','gag','lag','nag','rag','sag','tag','wag'],
      'ad':  ['bad','dad','had','lad','mad','sad'],
      'am':  ['dam','ham','jam','ram','yam'],
      // Short-i family
      'it':  ['bit','fit','hit','kit','lit','pit','sit','wit'],
      'in':  ['bin','din','fin','gin','kin','pin','sin','tin','win'],
      'ig':  ['big','dig','fig','gig','jig','pig','rig','wig'],
      'id':  ['bid','did','hid','kid','lid','rid'],
      'ip':  ['dip','hip','lip','nip','rip','sip','tip','zip'],
      // Short-o family
      'ot':  ['dot','got','hot','jot','lot','not','pot','rot','tot'],
      'og':  ['bog','cog','dog','fog','hog','jog','log'],
      'op':  ['cop','hop','mop','pop','shop','stop','top'],
      'ob':  ['bob','cob','gob','job','lob','mob','rob'],
      // Short-u family
      'un':  ['bun','fun','gun','nun','pun','run','sun'],
      'ug':  ['bug','dug','hug','jug','mug','pug','rug','tug'],
      'ut':  ['but','cut','gut','hut','nut','put','rut'],
      'ub':  ['cub','hub','pub','rub','sub','tub'],
      // Short-e family
      'en':  ['den','hen','men','pen','ten'],
      'et':  ['bet','get','jet','let','met','net','pet','set','vet','wet'],
      'eg':  ['beg','keg','leg','peg'],
      'ed':  ['bed','fed','led','red','wed'],
      // Long vowel / blend families
      'ake': ['bake','cake','fake','lake','make','rake','sake','take','wake'],
      'ame': ['came','fame','game','name','same','tame'],
      'ine': ['dine','fine','line','mine','nine','pine','vine','wine'],
      'ite': ['bite','kite','lite','mite','site','quite'],
      'one': ['bone','cone','lone','stone','tone','zone'],
      'oke': ['coke','joke','poke','smoke','spoke','woke'],
      'ube': ['cube','tube'],
      'une': ['dune','tune'],
    };

    // 擷取目標單字的韻尾（最後 2-3 個字母）找對應家族
    const endings = [target.slice(-3), target.slice(-2)];
    for (const ending of endings) {
      const family = CVC_FAMILIES[ending];
      if (family) {
        family
          .filter(w => w !== target)
          .sort(() => Math.random() - 0.5)
          .forEach(w => result.add(w));
        if (result.size >= 3) return [...result].slice(0, 3);
        break;
      }
    }

    // 也嘗試相同首字母家族
    const sameInitial = Object.values(CVC_FAMILIES)
      .flat()
      .filter(w => w[0] === target[0] && w !== target);
    sameInitial.sort(() => Math.random() - 0.5).forEach(w => result.add(w));
    if (result.size >= 3) return [...result].slice(0, 3);

    // ── 層 3：動態換音素兜底（替換 CVC 各部位）──────────────────
    const VOWELS = ['a','e','i','o','u'];
    const CONSONANTS = ['b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w','z'];

    if (target.length >= 2) {
      // 替換所有母音
      for (const v of VOWELS) {
        for (let i = 0; i < target.length; i++) {
          if ('aeiou'.includes(target[i]) && target[i] !== v) {
            const candidate = target.slice(0, i) + v + target.slice(i + 1);
            if (candidate !== target) result.add(candidate);
            if (result.size >= 3) return [...result].slice(0, 3);
          }
        }
      }
      // 替換首字母
      for (const c of CONSONANTS) {
        if (c !== target[0]) {
          const candidate = c + target.slice(1);
          if (candidate !== target) result.add(candidate);
          if (result.size >= 3) return [...result].slice(0, 3);
        }
      }
      // 替換末字母
      for (const c of [...CONSONANTS, ...VOWELS]) {
        const last = target[target.length - 1];
        if (c !== last) {
          const candidate = target.slice(0, -1) + c;
          if (candidate !== target) result.add(candidate);
          if (result.size >= 3) return [...result].slice(0, 3);
        }
      }
    }

    // 絕對兜底：補充通用常見詞
    const FALLBACK = ['cat','dog','big','hot','run','sun','hat','pin','pot','cup','bed','map'];
    FALLBACK.filter(w => w !== target).forEach(w => result.add(w));

    return [...result].slice(0, 3);
  };

  // Initialize options when quiz item changes
  useEffect(() => {
    if (quiz) {
      setSelectedSpelling(null);
      setWrongSpellings([]);
      setLevelCompleted(false);
      setHasMadeMistake(false);

      const isPhonics = quiz.subject === 'phonics';

      if (isPhonics) {
        // ── Phonics 分支：三層防禦干擾選項 ─────────────────────
        const distractorWords = generatePhonicsDistractors(quiz.wordText);

        // 確保正好 3 個干擾選項（不足則以 FALLBACK 補齊）
        const EXTRA_FALLBACK = ['cat','dog','big','hot','run','sun','hat','pin','pot','cup','bed','map'];
        const target = quiz.wordText.toLowerCase();
        while (distractorWords.length < 3) {
          const fb = EXTRA_FALLBACK.find(w => w !== target && !distractorWords.includes(w));
          if (fb) distractorWords.push(fb);
          else break;
        }

        const distractors: Choice[] = distractorWords.slice(0, 3).map(w => ({
          spelling: w,
          correctAnswer: quiz.correctAnswer, // phonics 模式下 correctAnswer 僅作為結構佔位
          isCorrect: false,
        }));

        const merged: Choice[] = [
          { spelling: quiz.wordText.toLowerCase(), correctAnswer: quiz.correctAnswer, isCorrect: true },
          ...distractors,
        ].sort(() => Math.random() - 0.5);

        setChoices(merged);
      } else {
        // ── Zhuyin 分支：原有注音選項邏輯（零改動）─────────────
        const correctText = formatZhuyin(quiz.correctAnswer);
        const candidates = (allQuizzes as any[]).filter(q => q.id !== quiz.id && formatZhuyin(q.correctAnswer) !== correctText);

        const uniqueMap = new Map<string, any>();
        candidates.forEach(q => {
          const spelling = formatZhuyin(q.correctAnswer);
          if (!uniqueMap.has(spelling)) uniqueMap.set(spelling, q.correctAnswer);
        });

        const spellingChoices = Array.from(uniqueMap.entries());
        const shuffledSpellings = spellingChoices.sort(() => Math.random() - 0.5);

        const distractors = shuffledSpellings.slice(0, 3).map(([spelling, ans]) => ({
          spelling,
          correctAnswer: ans,
          isCorrect: false,
        }));

        const merged = [
          { spelling: correctText, correctAnswer: quiz.correctAnswer, isCorrect: true },
          ...distractors,
        ].sort(() => Math.random() - 0.5);

        setChoices(merged);
      }

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
          <span>{quiz.subject === 'phonics' ? 'Listen & Choose' : '聽音選字挑戰'}</span>
        </span>
        <h2 className="text-lg sm:text-xl font-bold mt-2 text-stone-550">
          {quiz.subject === 'phonics'
            ? 'Listen and select the correct English word below!'
            : '點擊中央發音鍵，在下方選出對應的正確注音！'}
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
          const isPhonics = quiz.subject === 'phonics';

          return (
            <button
              key={idx}
              disabled={levelCompleted || isWrong}
              onClick={() => handleChoiceClick(choice)}
              className={`py-6 px-4 rounded-3xl border-3 font-black transition-all cursor-pointer shadow-sm select-none flex items-center justify-center
                ${isSelectedCorrect
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 scale-103'
                  : isWrong
                  ? 'border-red-450 bg-red-50 text-red-650 opacity-50 animate-shake'
                  : 'border-stone-200 bg-white hover:border-sky-300 hover:scale-102 hover:shadow-md text-stone-850 active:scale-98'
                }
              `}
            >
              {isPhonics ? (
                /* Phonics 模式：橫向英文字，禁止注音沙拉 */
                <span
                  className="text-2xl sm:text-3xl font-black text-sky-700 tracking-widest"
                  style={{ fontFamily: "'Courier New', Courier, monospace" }}
                >
                  {choice.spelling}
                </span>
              ) : (
                /* Zhuyin 模式：保留原 VerticalZhuyin */
                <VerticalZhuyin correctAnswer={choice.correctAnswer} />
              )}
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
