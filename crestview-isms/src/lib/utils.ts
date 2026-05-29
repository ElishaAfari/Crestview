import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ANIMATIONS = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.1 } }
  },
  pageTransition: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
    transition: { duration: 0.25 }
  },
  cardHover: {
    whileHover: { scale: 1.02, y: -2 },
    transition: { duration: 0.2 }
  }
} as const;
