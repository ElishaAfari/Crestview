import Image from "next/image";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-4 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <Image src="/crestview-logo.png" alt="Crestview International School" width={72} height={72} className="size-16 object-contain" />
        <h1 className="mt-6 font-heading text-3xl font-black text-[#06165b]">Choose a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use at least ten characters and keep your new password private.</p>
        <div className="mt-7"><ResetPasswordForm /></div>
      </section>
    </main>
  );
}
