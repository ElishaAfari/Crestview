import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users
} from "lucide-react";
import { StudentHeroSlideshow } from "@/components/shared/StudentHeroSlideshow";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "About", href: "#about" },
  { label: "Academics", href: "#academics" },
  { label: "Admissions", href: "/admissions" },
  { label: "School Life", href: "#life" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" }
];

const stats = [
  { value: "18+", label: "Years nurturing learners" },
  { value: "24", label: "Bright, active classrooms" },
  { value: "96%", label: "Weekly attendance average" },
  { value: "1:14", label: "Teacher mentor ratio" }
];

const values = [
  {
    title: "Academic confidence",
    body: "Every lesson is planned to build strong foundations, clear thinking, and the courage to ask better questions.",
    icon: BookOpen,
    tone: "bg-blue-50 text-blue-700"
  },
  {
    title: "Character and discipline",
    body: "Learners grow in kindness, responsibility, respect, and the quiet habits that make achievement sustainable.",
    icon: ShieldCheck,
    tone: "bg-emerald-50 text-emerald-700"
  },
  {
    title: "Joyful discovery",
    body: "Music, clubs, science, sport, reading, service, and leadership give each child room to find their spark.",
    icon: Sparkles,
    tone: "bg-amber-50 text-amber-700"
  }
];

const programmes = [
  {
    title: "Early Years",
    stage: "Nursery and Kindergarten",
    body: "Warm routines, phonics, number sense, movement, art, and guided play for confident first steps."
  },
  {
    title: "Primary School",
    stage: "Grades 1 to 6",
    body: "Literacy, numeracy, science, social studies, technology, creativity, and character in balance."
  },
  {
    title: "Middle School",
    stage: "Grades 7 to 10",
    body: "Focused subject mastery, project work, mentoring, and preparation for advanced pathways."
  }
];

const life = [
  "Student leadership and assemblies",
  "Clubs for STEM, reading, music, art, and debate",
  "Sports, wellness, and teamwork",
  "Parent partnership and progress updates",
  "Safe campus routines and caring supervision",
  "Service projects that teach responsibility"
];

const news = [
  { title: "Admissions are open", date: "2026 Intake", body: "Families can begin applications for available spaces across early years, primary, and middle school." },
  { title: "Science and creativity week", date: "June", body: "Learners will present experiments, art, design projects, and practical problem-solving challenges." },
  { title: "Parent open morning", date: "Upcoming", body: "Visit classrooms, meet teachers, and see how Crestview balances excellence with care." }
];

export default function PublicHomePage() {
  return (
    <main className="bg-slate-50 text-slate-950">
      <section className="relative min-h-[86svh] overflow-hidden bg-slate-950 text-white">
        <StudentHeroSlideshow />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/78 to-slate-950/20" />
        <div className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-slate-950/45 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 text-xs text-slate-200 sm:px-6 lg:px-8">
            <div className="hidden items-center gap-4 md:flex">
              <span className="inline-flex items-center gap-2"><MapPin className="size-3.5" aria-hidden /> International District</span>
              <span className="inline-flex items-center gap-2"><Phone className="size-3.5" aria-hidden /> +1 000 000 0000</span>
            </div>
            <span className="inline-flex items-center gap-2"><Mail className="size-3.5" aria-hidden /> admissions@crestview.edu</span>
            <Link href="/login" className="font-semibold text-amber-200 hover:text-white">Portal</Link>
          </div>
        </div>

        <nav className="absolute inset-x-0 top-10 z-20">
          <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <span className="relative size-12 overflow-hidden rounded-xl bg-white shadow-lg shadow-slate-950/25 ring-1 ring-white/30">
                <Image src="/crestview-logo.png" alt="Crestview International School logo" fill sizes="48px" className="object-contain p-1" />
              </span>
              <span className="font-heading text-base font-semibold leading-tight sm:text-lg">Crestview International School</span>
            </Link>
            <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/10 p-1 backdrop-blur md:flex">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/15 hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[86svh] max-w-7xl flex-col justify-center px-4 pb-20 pt-36 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-100">
              <Star className="size-4" aria-hidden />
              Quality education, strong character, bright futures
            </p>
            <h1 className="mt-6 max-w-4xl font-heading text-5xl font-semibold leading-[1.03] text-white sm:text-6xl lg:text-7xl">
              A lively school where every learner is known, stretched, and celebrated.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Crestview blends rigorous academics, joyful discovery, discipline, and pastoral care so children grow with confidence in class and character in life.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/admissions" className={buttonVariants({ className: "bg-amber-400 text-slate-950 hover:bg-amber-300" })}>
                Apply for admission <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="#academics" className={buttonVariants({ variant: "secondary", className: "border-white/20 bg-white/10 text-white hover:bg-white/20" })}>
                Explore academics
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-10 relative z-20 mx-auto grid max-w-7xl gap-3 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70">
            <p className="font-heading text-3xl font-semibold text-blue-700">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
          </div>
        ))}
      </section>

      <section id="about" className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">About Crestview</p>
          <h2 className="mt-3 max-w-3xl font-heading text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
            Education for the total development of the child.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Inspired by warm, community-minded schools that put children first, Crestview offers a calm but energetic learning environment where academic excellence sits beside empathy, faithfulness to duty, creativity, and service.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className={cn("grid size-11 place-items-center rounded-lg", value.tone)}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-slate-950">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{value.body}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl">
          <Image src="/crestview-logo.png" alt="Crestview International School badge" width={900} height={700} className="h-full min-h-[420px] w-full object-contain p-8 sm:p-12" />
          <div className="absolute inset-x-5 bottom-5 rounded-xl bg-white/92 p-5 text-slate-950 shadow-lg backdrop-blur">
            <p className="text-sm font-semibold text-blue-700">Our promise</p>
            <p className="mt-1 text-lg font-semibold leading-7">A safe, inspiring campus where every child can belong, work hard, and shine.</p>
          </div>
        </div>
      </section>

      <section id="academics" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Academics</p>
              <h2 className="mt-3 max-w-3xl font-heading text-4xl font-semibold sm:text-5xl">
                Strong foundations, curious minds, excellent habits.
              </h2>
            </div>
            <Link href="/admissions" className={buttonVariants({ className: "w-fit bg-emerald-500 text-white hover:bg-emerald-400" })}>
              Begin admission <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {programmes.map((programme) => (
              <div key={programme.title} className="rounded-xl border border-white/10 bg-white/[0.06] p-6">
                <p className="text-sm font-semibold text-amber-200">{programme.stage}</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-white">{programme.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-300">{programme.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <div className="rounded-xl bg-blue-600 p-6">
              <Trophy className="size-8 text-blue-100" aria-hidden />
              <h3 className="mt-5 font-heading text-2xl font-semibold">Achievement with purpose</h3>
              <p className="mt-3 text-sm leading-6 text-blue-50">Assessment is used to guide support, celebrate growth, and help learners set meaningful goals.</p>
            </div>
            <div className="rounded-xl bg-emerald-600 p-6">
              <Heart className="size-8 text-emerald-100" aria-hidden />
              <h3 className="mt-5 font-heading text-2xl font-semibold">Care that notices</h3>
              <p className="mt-3 text-sm leading-6 text-emerald-50">Teachers know learners by name, monitor wellbeing, and keep families connected to progress.</p>
            </div>
            <div className="rounded-xl bg-amber-400 p-6 text-slate-950">
              <Users className="size-8 text-slate-900" aria-hidden />
              <h3 className="mt-5 font-heading text-2xl font-semibold">Community that lifts</h3>
              <p className="mt-3 text-sm leading-6 text-slate-800">Assemblies, clubs, service, and house activities help students practice leadership every week.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="life" className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:px-8">
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/80">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">School life</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold text-slate-950">A campus with energy, order, and heart.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            The best school days are full of rhythm: focused lessons, good manners, healthy play, creative work, and teachers who keep moving children forward.
          </p>
          <div className="mt-7 grid gap-3">
            {life.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                <CheckCircle2 className="mt-0.5 size-5 flex-none text-emerald-600" aria-hidden />
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-blue-700 p-6 text-white">
            <Clock className="size-7 text-blue-100" aria-hidden />
            <h3 className="mt-5 font-heading text-2xl font-semibold">A day with structure</h3>
            <p className="mt-3 text-sm leading-6 text-blue-50">Morning routines, guided learning blocks, enrichment, outdoor activity, reflection, and family updates.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/80">
            <Sparkles className="size-7 text-amber-500" aria-hidden />
            <h3 className="mt-5 font-heading text-2xl font-semibold text-slate-950">Expression encouraged</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">Students perform, present, build, debate, design, and learn to speak with confidence.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/80 sm:col-span-2">
            <CalendarDays className="size-7 text-emerald-600" aria-hidden />
            <h3 className="mt-5 font-heading text-2xl font-semibold text-slate-950">Families are part of the story</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">Open mornings, progress reviews, celebrations, and timely communication keep parents close to learning.</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Admissions</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold text-slate-950 sm:text-5xl">Begin your child&apos;s Crestview journey.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                We welcome families who want a school that is ambitious, caring, organized, and alive with opportunity.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/admissions" className={buttonVariants()}>Apply now <ArrowRight className="size-4" aria-hidden /></Link>
                <Link href="/contact" className={buttonVariants({ variant: "secondary", className: "bg-slate-100 text-slate-950 hover:bg-slate-200" })}>Book a visit</Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {["Visit", "Apply", "Interview"].map((step, index) => (
                <div key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <span className="grid size-10 place-items-center rounded-full bg-blue-700 text-sm font-bold text-white">{index + 1}</span>
                  <h3 className="mt-4 font-heading text-xl font-semibold text-slate-950">{step}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {index === 0 ? "Tour the campus and meet the team." : index === 1 ? "Share learner details and records." : "Plan the best start together."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">News and events</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold text-slate-950">What is happening at Crestview.</h2>
          </div>
          <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
            View all news <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {news.map((item) => (
            <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-emerald-700">{item.date}</p>
              <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Ready to visit?</p>
            <h2 className="mt-3 max-w-3xl font-heading text-4xl font-semibold">Come see the classrooms, meet the teachers, and feel the Crestview spirit.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className={buttonVariants({ className: "bg-amber-400 text-slate-950 hover:bg-amber-300" })}>Contact admissions</Link>
            <Link href="/login" className={buttonVariants({ variant: "secondary", className: "border-white/20 bg-white/10 text-white hover:bg-white/20" })}>Family portal</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
