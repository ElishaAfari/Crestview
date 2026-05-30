import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export function PublicSiteFooter() {
  return (
    <footer className="bg-[#040e3d] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="relative size-14 overflow-hidden rounded-lg bg-white">
              <Image src="/crestview-logo.png" alt="Crestview International School logo" fill sizes="56px" className="object-contain p-1" />
            </span>
            <span>
              <span className="block font-heading text-lg font-bold uppercase">Crestview</span>
              <span className="block text-xs font-semibold uppercase text-[#fff27c]">International School</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">
            A lively learning community where strong academics, character, creativity, and confidence grow together.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase text-[#fff27c]">Explore</h2>
          <div className="mt-4 grid gap-2 text-sm text-blue-100">
            {siteConfig.mainNav.slice(1).map((item) => <Link key={item.href} href={item.href} className="hover:text-white">{item.title}</Link>)}
          </div>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase text-[#fff27c]">Visit Crestview</h2>
          <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-blue-100"><MapPin className="mt-1 size-4 flex-none text-[#42d6d0]" aria-hidden />{siteConfig.address}</p>
          <div className="mt-3 grid gap-2">
            {siteConfig.phones.map((phone) => (
              <a key={phone.href} href={phone.href} className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#fff27c]">
                <Phone className="size-4 text-[#42d6d0]" aria-hidden />
                {phone.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-blue-200">
        &copy; {new Date().getFullYear()} Crestview International School. {siteConfig.motto}.
      </div>
    </footer>
  );
}
