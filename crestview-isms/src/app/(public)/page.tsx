"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  FlaskConical,
  GraduationCap,
  MapPin,
  Music2,
  Phone,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StudentHeroSlideshow } from "@/components/shared/StudentHeroSlideshow";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const programmes = [
  {
    title: "Hybrid Curriculum",
    kicker: "Cambridge and GES",
    description: "A thoughtful blend of global learning standards and strong Ghanaian foundations.",
    image: "/landing/real/crestview-pair-reading.jpg",
    icon: BookOpenCheck,
    accent: "bg-[#42d6d0] text-[#06165b]",
  },
  {
    title: "Robotics",
    kicker: "Build, code, explore",
    description: "Hands-on challenges that turn bright ideas into practical problem-solving skills.",
    image: "/landing/real/crestview-board-learning.jpg",
    icon: Bot,
    accent: "bg-[#ffd83d] text-[#06165b]",
  },
  {
    title: "STEM Education",
    kicker: "Curiosity in action",
    description: "Experiments, projects, and discovery that help learners understand their world.",
    image: "/landing/real/crestview-writing-red.jpg",
    icon: FlaskConical,
    accent: "bg-[#cf1017] text-white",
  },
  {
    title: "Music",
    kicker: "Creativity and confidence",
    description: "A lively creative outlet that strengthens expression, discipline, and collaboration.",
    image: "/landing/real/crestview-blue-portrait.jpg",
    icon: Music2,
    accent: "bg-[#082b91] text-white",
  },
];

const stages = [
  { title: "Creche and Nursery", label: "A gentle beginning", color: "border-[#1b9b4f]" },
  { title: "Kindergarten", label: "Curiosity takes shape", color: "border-[#ff9c23]" },
  { title: "Primary", label: "Strong foundations", color: "border-[#42d6d0]" },
  { title: "Junior High School", label: "Ready for what is next", color: "border-[#cf1017]" },
];

const highlights = [
  "Cambridge and GES learning pathways",
  "Future-ready STEM and robotics",
  "A caring, values-led community",
  "Creative confidence through music",
];

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <main>
      <section className="relative min-h-[76svh] overflow-hidden bg-[#06165b]">
        <StudentHeroSlideshow />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061341] via-[#061341]/90 to-[#061341]/35" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#061341]/75 to-transparent" />
        <div className="relative mx-auto flex min-h-[76svh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase text-[#ffd83d] backdrop-blur-sm">
              <Sparkles className="size-4" aria-hidden />
              Admission in progress
            </div>
            <h1 className="mt-5 max-w-3xl font-heading text-4xl font-black uppercase leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              Crestview <span className="text-[#ffd83d]">International</span> School
            </h1>
            <p className="mt-4 text-sm font-black uppercase text-[#42d6d0] sm:text-base">{siteConfig.motto}</p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
              A lively learning community in Asamankese where children build strong foundations, discover their talents, and grow ready for the world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/admissions" className={buttonVariants({ className: "bg-[#cf1017] text-white shadow-lg shadow-black/20 hover:bg-[#ad0d13]" })}>
                Enroll today <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/#programmes" className={buttonVariants({ variant: "secondary", className: "border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20" })}>
                Explore programmes
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 bg-[#ffd83d]">
        <div className="mx-auto grid max-w-7xl gap-px bg-[#d2aa00] sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((highlight) => (
            <div key={highlight} className="flex items-center gap-3 bg-[#ffd83d] px-5 py-5 text-sm font-black text-[#06165b]">
              <CheckCircle2 className="size-5 shrink-0 text-[#cf1017]" aria-hidden />
              {highlight}
            </div>
          ))}
        </div>
      </section>

      <section id="programmes" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-3xl">
            <p className="text-xs font-black uppercase text-[#cf1017]">Learning with purpose</p>
            <h2 className="mt-3 font-heading text-3xl font-black leading-tight text-[#06165b] sm:text-5xl">
              Programmes that keep young minds moving.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Our academic foundation is strengthened by practical exploration, creativity, and the confidence to try something new.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {programmes.map((programme, index) => {
              const Icon = programme.icon;
              return (
                <motion.article
                  key={programme.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={programme.image} alt={programme.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 25vw" />
                  </div>
                  <div className="p-5">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${programme.accent}`}>
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <p className="mt-5 text-xs font-black uppercase text-[#cf1017]">{programme.kicker}</p>
                    <h3 className="mt-1 font-heading text-xl font-black text-[#06165b]">{programme.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{programme.description}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#06165b] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <Reveal>
            <p className="text-xs font-black uppercase text-[#42d6d0]">A place to grow</p>
            <h2 className="mt-3 font-heading text-3xl font-black leading-tight sm:text-5xl">One school journey. Four important stages.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100">
              Every stage is designed around the needs of the learner in front of us: the right care, the right challenge, and room to flourish.
            </p>
            <Link href="/admissions" className={buttonVariants({ className: "mt-7 bg-[#ffd83d] text-[#06165b] hover:bg-[#ffe36b]" })}>
              Start an application <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={`rounded-lg border-l-4 ${stage.color} bg-white/10 p-5 backdrop-blur-sm`}
              >
                <GraduationCap className="size-6 text-[#ffd83d]" aria-hidden />
                <h3 className="mt-5 text-lg font-black">{stage.title}</h3>
                <p className="mt-1 text-sm text-blue-100">{stage.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eaf8f7] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-lg bg-white shadow-sm lg:grid-cols-2">
          <div className="relative min-h-72">
            <Image src="/landing/real/crestview-orange-reading.jpg" alt="Crestview student reading in class" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <Reveal className="p-7 sm:p-10 lg:p-14">
            <p className="text-xs font-black uppercase text-[#cf1017]">Hybrid curriculum</p>
            <h2 className="mt-3 font-heading text-3xl font-black leading-tight text-[#06165b]">Grounded at home. Ready for the world.</h2>
            <p className="mt-5 leading-7 text-slate-600">
              Cambridge and GES learning pathways work together to give students a confident academic foundation with a broad outlook.
            </p>
            <Link href="/admissions" className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#cf1017] transition hover:text-[#06165b]">
              Learn about enrollment <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#cf1017] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <Reveal>
            <p className="text-xs font-black uppercase text-[#ffd83d]">Admission in progress</p>
            <h2 className="mt-3 font-heading text-3xl font-black leading-tight sm:text-5xl">Give your child a bright place to begin.</h2>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-red-50">
              <span className="flex items-center gap-2"><MapPin className="size-4 text-[#ffd83d]" aria-hidden />{siteConfig.address}</span>
              <a href={siteConfig.phones[0].href} className="flex items-center gap-2 transition hover:text-[#ffd83d]"><Phone className="size-4 text-[#ffd83d]" aria-hidden />{siteConfig.phones[0].label}</a>
            </div>
          </Reveal>
          <Link href="/admissions" className={buttonVariants({ className: "w-fit bg-[#ffd83d] text-[#06165b] hover:bg-white" })}>
            Apply for admission <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
