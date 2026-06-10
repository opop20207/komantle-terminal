import type { GuessResult } from '../services/komantleApi';

export const sortGuessesBySimilarity = (guesses: GuessResult[]): GuessResult[] => {
  return guesses.toSorted((firstGuess, secondGuess) => {
    return secondGuess.similarity - firstGuess.similarity;
  });
};

export const formatRankRows = (guesses: GuessResult[]): string => {
  return guesses
    .map((guess, index) => {
      return [
        `#${index + 1}`,
        guess.word.padEnd(10),
        'SIM',
        guess.similarity.toFixed(2).padStart(5),
        'RANK',
        String(guess.rank ?? '-'),
      ].join('  ');
    })
    .join('\n');
};

export const formatGuessTimestamp = (createdAt: number): string => {
  const date = new Date(createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
