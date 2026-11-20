import { localeTags, type Language } from '../i18n'

const options = { style: 'currency', currency: 'MAD' } as const
const prices = {
  en: new Intl.NumberFormat(localeTags.en, options),
  fr: new Intl.NumberFormat(localeTags.fr, options),
  ar: new Intl.NumberFormat(localeTags.ar, options),
}

export function formatPrice(priceMinor: number, language: Language = 'en'): string {
  return prices[language].format(priceMinor / 100)
}
