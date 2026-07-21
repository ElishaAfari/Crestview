"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const slides = [
  { src: "/landing/real/crestview-group-reading.jpg", position: "object-center" },
  { src: "/landing/real/crestview-board-learning.jpg", position: "object-[42%_45%]" },
  { src: "/landing/real/crestview-pair-reading.jpg", position: "object-[48%_44%]" },
  { src: "/landing/real/crestview-writing-red.jpg", position: "object-[50%_42%]" }
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
          key={slide.src}
          src={slide.src}
          alt=""
          fill
          priority={index === 0}
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-1000 ease-out",
            slide.position,
            index === activeIndex ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
    </div>
  );
}
