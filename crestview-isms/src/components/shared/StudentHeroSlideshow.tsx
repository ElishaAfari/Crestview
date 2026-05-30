"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const slides = [
  "/landing/hero/hybrid-curriculum-hero.png",
  "/landing/hero/robotics-hero.png",
  "/landing/hero/stem-hero.png",
  "/landing/hero/music-hero.png"
];

export function StudentHeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {slides.map((slide, index) => (
        <Image
          key={slide}
          src={slide}
          alt=""
          fill
          priority={index === 0}
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-1000 ease-out",
            index === activeIndex ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
    </div>
  );
}
