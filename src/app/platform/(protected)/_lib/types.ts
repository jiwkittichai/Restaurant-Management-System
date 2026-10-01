export type PlatformRestaurant = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  approvalStatus: string;
  createdAt: string;
  owner: { displayName: string; email: string | null } | null;
  _count: { employees: number; orders: number; menuItems: number };
};

export type RestaurantList = {
  restaurants: PlatformRestaurant[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    pending: number;
    rejected: number;
    restaurants: number;
    active: number;
    suspended: number;
    employees: number;
    orders: number;
  };
};

export type PlatformLog = {
  id: number;
  actorName: string;
  action: string;
  restaurantId: number | null;
  details: unknown;
  createdAt: string;
};

export type RestaurantAction = {
  restaurant: PlatformRestaurant;
  action: "APPROVED" | "REJECTED" | "SUSPEND" | "RESUME";
};
