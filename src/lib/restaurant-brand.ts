export type RestaurantBrand = { name: string; logoUrl: string | null; address: string | null; phone: string | null; welcomeMessage: string | null; receiptFooter: string | null };
export const brandSelect = { id: true, name: true, logoUrl: true, address: true, phone: true, welcomeMessage: true, receiptFooter: true, updatedAt: true } as const;
export function publicBrand(restaurant: RestaurantBrand & { id: number; updatedAt: Date }) {
  return { name: restaurant.name, address: restaurant.address, phone: restaurant.phone, welcomeMessage: restaurant.welcomeMessage, receiptFooter: restaurant.receiptFooter,
    logoUrl: restaurant.logoUrl ? `/api/restaurants/${restaurant.id}/logo?v=${restaurant.updatedAt.getTime()}` : null };
}
