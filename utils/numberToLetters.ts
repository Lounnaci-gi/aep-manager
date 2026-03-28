// @ts-ignore
import writtenNumber from 'written-number';

export function numberToFrenchLetters(amount: number): string {
  const roundedAmount = Math.round(amount * 100) / 100;
  const wholePart = Math.floor(roundedAmount);
  const fractionalPartStr = ((roundedAmount - wholePart) * 100).toFixed(0);
  
  const dinarsInWords = writtenNumber(wholePart, { lang: 'fr' });
  
  let result = `La somme de ce présent devis est arrêtée à : ${dinarsInWords} dinars`;
  
  if (parseInt(fractionalPartStr) > 0) {
    result += ` et ${fractionalPartStr} centimes`;
  }
  
  return result;
}
