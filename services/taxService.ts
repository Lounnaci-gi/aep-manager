import { TaxRate, TaxType } from '../types';

export class TaxService {
  /**
   * Returns the applicable tax rate for a given type and date.
   * Logic: Finds the most recent record where effectiveDate <= targetDate.
   */
  static getApplicableRate(rates: TaxRate[], type: TaxType, date: string | Date = new Date()): number {
    const targetDate = new Date(date);
    
    // Default fallback rates
    const DEFAULT_RATES: Record<TaxType, number> = {
      [TaxType.PRESTATION]: 19,
      [TaxType.EAU]: 9 // Par exemple 9% pour l'eau en Algérie (tarif social/réduit fréquent)
    };

    if (!rates || rates.length === 0) {
      return DEFAULT_RATES[type] || 19;
    }

    // Filter by type and sort by effectiveDate descending
    const relevantRates = rates
      .filter(r => r.type === type)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    // Find the first rate effective at or before the target date
    const applicable = relevantRates.find(r => new Date(r.effectiveDate) <= targetDate);

    if (applicable) {
      return applicable.rate;
    }

    // If no record found for the date (e.g., date is older than our oldest record)
    // Return the oldest record available for that type or the default
    const oldestPossible = relevantRates[relevantRates.length - 1];
    return oldestPossible ? oldestPossible.rate : (DEFAULT_RATES[type] || 19);
  }

  /**
   * Determines the TaxType for a given article category.
   */
  static getTaxTypeByCategory(category: string): TaxType {
    const eauCategories = [
      'CANALISATIONS (TUBES PEHD)',
      'PIÈCES SPÉCIALES',
      'Comptage'
    ];

    if (eauCategories.some(cat => category.includes(cat))) {
      return TaxType.EAU;
    }

    return TaxType.PRESTATION;
  }
}
