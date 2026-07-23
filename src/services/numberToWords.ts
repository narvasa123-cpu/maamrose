/**
 * Utility to convert numeric currency values into formal written words for Check Printing.
 * Supports USD / PHP format (e.g. "TEN THOUSAND FIVE HUNDRED PESOS & 25/100 ONLY").
 */

const ONES = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
];

const TENS = [
  '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
];

const SCALES = ['', 'THOUSAND', 'MILLION', 'BILLION', 'TRILLION'];

function convertGroup(num: number): string {
  let result = '';
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundred > 0) {
    result += `${ONES[hundred]} HUNDRED`;
    if (remainder > 0) result += ' ';
  }

  if (remainder >= 20) {
    const ten = Math.floor(remainder / 10);
    const unit = remainder % 10;
    result += TENS[ten];
    if (unit > 0) result += `-${ONES[unit]}`;
  } else if (remainder > 0) {
    result += ONES[remainder];
  }

  return result;
}

export function convertAmountToWords(amount: number, currency: 'PHP' | 'USD' = 'PHP'): string {
  if (isNaN(amount) || amount === 0) {
    return currency === 'PHP' ? 'ZERO PESOS ONLY' : 'ZERO DOLLARS ONLY';
  }

  const absoluteAmount = Math.abs(amount);
  const wholePart = Math.floor(absoluteAmount);
  const cents = Math.round((absoluteAmount - wholePart) * 100);

  if (wholePart === 0 && cents === 0) {
    return currency === 'PHP' ? 'ZERO PESOS ONLY' : 'ZERO DOLLARS ONLY';
  }

  let wordsArray: string[] = [];
  let tempNumber = wholePart;
  let scaleIndex = 0;

  if (wholePart === 0) {
    wordsArray.push('ZERO');
  } else {
    while (tempNumber > 0) {
      const group = tempNumber % 1000;
      if (group > 0) {
        const groupWords = convertGroup(group);
        const scale = SCALES[scaleIndex];
        wordsArray.unshift(scale ? `${groupWords} ${scale}` : groupWords);
      }
      tempNumber = Math.floor(tempNumber / 1000);
      scaleIndex++;
    }
  }

  const mainWords = wordsArray.join(' ');
  const currencyName = currency === 'PHP' 
    ? (wholePart === 1 ? 'PESO' : 'PESOS') 
    : (wholePart === 1 ? 'DOLLAR' : 'DOLLARS');

  const centsString = cents > 0 ? `${cents.toString().padStart(2, '0')}/100` : '00/100';

  return `*** ${mainWords} ${currencyName} & ${centsString} ONLY ***`;
}
