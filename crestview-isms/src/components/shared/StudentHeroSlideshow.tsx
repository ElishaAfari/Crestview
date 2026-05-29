"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const slides = [
  "/landing/students-outdoor-group.jpg",
  "/landing/students-with-teacher.jpg",
  "/landing/students-classroom-window.jpg",
  "/landing/students-classroom-smiling.jpg"
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
