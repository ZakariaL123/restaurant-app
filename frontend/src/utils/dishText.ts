import type { Language } from '../i18n'

type Text = [name: string, description: string]
type FrenchAndArabic = Record<Exclude<Language, 'en'>, Text> & { sourceDescription: string }

// Keys match the English names already saved in Neon, including in old orders.
const dishes: Partial<Record<string, FrenchAndArabic>> = {
  'Chicken Tagine': {
    sourceDescription: 'Chicken with preserved lemon, olives, and Moroccan spices.',
    fr: ['Tajine de poulet', 'Poulet au citron confit, aux olives et aux épices marocaines.'],
    ar: ['طاجين الدجاج', 'دجاج بالليمون المصير والزيتون والتوابل المغربية.'],
  },
  'Chicken Pastilla': {
    sourceDescription: 'Flaky pastry filled with chicken, almonds, and cinnamon.',
    fr: [
      'Pastilla au poulet',
      'Feuilles croustillantes garnies de poulet, d’amandes et de cannelle.',
    ],
    ar: ['بسطيلة الدجاج', 'رقائق مقرمشة محشوة بالدجاج واللوز والقرفة.'],
  },
  'Kefta Tagine': {
    sourceDescription: 'Spiced meatballs simmered in tomato sauce and topped with an egg.',
    fr: [
      'Tajine de kefta',
      'Boulettes de viande épicées mijotées dans une sauce tomate, avec un œuf.',
    ],
    ar: ['طاجين الكفتة', 'كرات لحم متبّلة مطهوة في صلصة الطماطم مع البيض.'],
  },
  'Moroccan Mint Tea': {
    sourceDescription: 'Green tea brewed with fresh mint.',
    fr: ['Thé marocain à la menthe', 'Thé vert infusé à la menthe fraîche.'],
    ar: ['شاي مغربي بالنعناع', 'شاي أخضر بالنعناع الطازج.'],
  },
  'Harira Soup': {
    sourceDescription: 'Tomato soup with chickpeas, lentils, and fresh herbs.',
    fr: ['Harira', 'Soupe de tomates aux pois chiches, aux lentilles et aux herbes fraîches.'],
    ar: ['حريرة', 'شوربة الطماطم بالحمص والعدس والأعشاب الطازجة.'],
  },
  'Vegetable Couscous': {
    sourceDescription: 'Steamed couscous topped with seasonal vegetables and chickpeas.',
    fr: [
      'Couscous aux légumes',
      'Couscous cuit à la vapeur, garni de légumes de saison et de pois chiches.',
    ],
    ar: ['كسكس بالخضار', 'كسكس مطهو على البخار مع خضار الموسم والحمص.'],
  },
  Chebakia: {
    sourceDescription: 'Sesame pastries coated in honey and served with tea.',
    fr: ['Chebakia', 'Pâtisserie au sésame enrobée de miel et servie avec du thé.'],
    ar: ['شباكية', 'حلوى بالسمسم مغطاة بالعسل وتُقدّم مع الشاي.'],
  },
  Zaalouk: {
    sourceDescription: 'Aubergine and tomato salad seasoned with garlic and cumin.',
    fr: ['Zaalouk', 'Salade d’aubergines et de tomates assaisonnée d’ail et de cumin.'],
    ar: ['زعلوك', 'سلطة الباذنجان والطماطم بالثوم والكمون.'],
  },
}

function getTranslation(name: string, language: Language) {
  return language !== 'en' && Object.hasOwn(dishes, name) ? dishes[name]?.[language] : undefined
}

export function dishName(name: string, language: Language) {
  return getTranslation(name, language)?.[0] ?? name
}

export function dishDescription(name: string, description: string, language: Language) {
  // If staff edit the description, show the saved text until it has a new translation.
  return Object.hasOwn(dishes, name) && dishes[name]?.sourceDescription === description
    ? (getTranslation(name, language)?.[1] ?? description)
    : description
}
