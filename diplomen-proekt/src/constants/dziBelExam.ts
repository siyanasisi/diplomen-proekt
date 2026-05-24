export const DZI_BEL_EXAM_DATE = new Date(2027, 4, 20);
DZI_BEL_EXAM_DATE.setHours(0, 0, 0, 0);

export type DziBelCountdown = {
  daysRemaining: number;
  hasPassed: boolean;
  isExamDay: boolean;
  examDateLabel: string;
};

export function getDziBelCountdown(from: Date = new Date()): DziBelCountdown {
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  const exam = new Date(DZI_BEL_EXAM_DATE);
  const diffMs = exam.getTime() - today.getTime();
  const rawDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const hasPassed = rawDays < 0;
  const isExamDay = rawDays === 0;

  return {
    daysRemaining: rawDays > 0 ? rawDays : 0,
    hasPassed,
    isExamDay,
    examDateLabel: exam.toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}
