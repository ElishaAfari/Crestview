"use client";

import { CloudSun, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

type Weather = { temperature: number; label: string };

function weatherLabel(code: number) {
  if (code <= 1) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 67) return "Rain";
  return "Showers";
}

export function CampusStatus({ variant = "top" }: { variant?: "top" | "hero" }) {
  const [time, setTime] = useState("");
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    const setLocalTime = () =>
      setTime(
        new Intl.DateTimeFormat("en-GH", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      );
    setLocalTime();
    const timer = window.setInterval(setLocalTime, 60_000);
    void fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=5.861&longitude=-0.663&current=temperature_2m,weather_code&timezone=Africa%2FAccra",
    )
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const current = data?.current;
        if (typeof current?.temperature_2m !== "number") return;
        setWeather({
          temperature: Math.round(current.temperature_2m),
          label: weatherLabel(Number(current.weather_code ?? 3)),
        });
      })
      .catch(() => undefined);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={variant === "hero" ? "dashboard-weather-card" : "hidden items-center gap-3 border-r border-[var(--portal-border)] pr-4 xl:flex"}>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--portal-muted)]">
        <Clock3 className="size-3.5" aria-hidden /> {time || "--:--"}
      </span>
      {weather ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--portal-muted)]">
          <CloudSun className="size-4 text-blue-500" aria-hidden />
          {weather.temperature}C {weather.label}
        </span>
      ) : variant === "hero" ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--portal-muted)]">
          <CloudSun className="size-4 text-blue-500" aria-hidden /> Campus weather
        </span>
      ) : null}
    </div>
  );
}
