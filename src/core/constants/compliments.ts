/**
 * Short, calm praise — no hype, no scores, no streak language.
 * Rotated randomly so it stays fresh without feeling like a reward machine.
 */
export const CALM_COMPLIMENTS = [
  'Nice work.',
  'You did it.',
  'Gentle and steady.',
  'That fits well.',
  'Well done.',
  'You figured it out.',
  'Good thinking.',
  'That was careful.',
  'Nice and clear.',
  'You matched it.',
  'Lovely.',
  'That works.',
  'You took your time.',
  'That fits.',
  'Good job.',
  'That looks right.',
  'You found it.',
  'Steady work.',
] as const;

export function randomCompliment(): string {
  const i = Math.floor(Math.random() * CALM_COMPLIMENTS.length);
  return CALM_COMPLIMENTS[i] ?? 'Nice work.';
}
