import AccountTokenForm from "../_components/AccountTokenForm";
export const metadata = { title: "ยืนยันอีเมล", referrer: "no-referrer" };
export default function Page() { return <main className="grid min-h-screen place-items-center bg-[#f6f7f9] p-5"><AccountTokenForm mode="verify" /></main>; }
