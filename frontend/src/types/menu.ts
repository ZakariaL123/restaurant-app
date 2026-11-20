export interface MenuItem {
  id: string
  name: string
  description: string
  priceMinor: number
  isAvailable: boolean
  imageUrl?: string | null
}
