import GuestOrder from "./GuestOrder";
export const metadata = { title: "สั่งอาหารที่โต๊ะ", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GuestOrder token={token} />;
}
