interface VerticalZhuyinProps {
  correctAnswer: {
    initial: string;
    medial: string;
    final: string;
    tone: string;
  };
  className?: string;
}

export default function VerticalZhuyin({ correctAnswer, className = '' }: VerticalZhuyinProps) {
  const initial = correctAnswer.initial || '';
  const medial = correctAnswer.medial || '';
  const final = correctAnswer.final || '';

  const getToneChar = (tone: string) => {
    switch (tone) {
      case '1': return ''; // 1st tone is unmarked in standard Taiwan Zhuyin
      case '2': return 'ˊ';
      case '3': return 'ˇ';
      case '4': return 'ˋ';
      case '5': return '•';
      default: return '';
    }
  };

  const toneSymbol = getToneChar(correctAnswer.tone);

  return (
    <div className={`inline-flex items-center justify-center space-x-1.5 leading-none select-none ${className}`}>
      {/* Vowel characters vertical column stack */}
      <div className="flex flex-col items-center justify-center space-y-0.5">
        {initial && <span className="text-2xl sm:text-3xl font-black">{initial}</span>}
        {medial && <span className="text-2xl sm:text-3xl font-black">{medial}</span>}
        {final && <span className="text-2xl sm:text-3xl font-black">{final}</span>}
      </div>
      {/* Tone mark placed on the right side */}
      {toneSymbol && (
        <div className="w-4 flex items-center justify-start text-amber-600 font-bold self-center shrink-0">
          <span className="text-xl sm:text-2xl leading-none">{toneSymbol}</span>
        </div>
      )}
    </div>
  );
}
