export const orderStatuses = ['new', 'working', 'done'] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const statusLabel = { new: 'orderNew', working: 'orderWorking', done: 'orderDone' } as const

export interface Order {
  id: string
  createdAt: string
  totalMinor: number
  status: OrderStatus
  items: { id: string; name: string; quantity: number }[]
}
