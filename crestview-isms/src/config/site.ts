import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/lib/constants";

export const siteConfig = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: APP_URL,
  mainNav: [
    { title: "Admissions", href: "/admissions" },
    { title: "Recruitment", href: "/recruitment" },
    { title: "News", href: "/news" },
    { title: "Events", href: "/events" },
    { title: "Contact", href: "/contact" }
  ]
} as const;
