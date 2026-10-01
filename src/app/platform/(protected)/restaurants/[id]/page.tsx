"use client";

import { useParams, useRouter } from "next/navigation";
import PlatformRestaurantDetail from "./_components/PlatformRestaurantDetail";

export default function PlatformRestaurantPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  return <PlatformRestaurantDetail id={Number(params.id)} back={() => router.push("/platform/restaurants")} />;
}
