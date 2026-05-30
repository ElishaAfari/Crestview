import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/lib/constants";

export const siteConfig = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: APP_URL,
  motto: "Where excellence meets the world",
  address: "Asamankese Yayo, former Omega School premises",
  phones: [
    { label: "024 513 1619", href: "tel:+233245131619" },
    { label: "024 450 4332", href: "tel:+233244504332" },
    { label: "050 816 8358", href: "tel:+233508168358" }
  ],
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Programmes", href: "/#programmes" },
    { title: "Admissions", href: "/admissions" },
    { title: "Recruitment", href: "/recruitment" },
    { title: "News", href: "/news" },
    { title: "Events", href: "/events" },
    { title: "Contact", href: "/contact" }
  ]
} as const;
