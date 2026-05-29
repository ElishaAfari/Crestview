import { Card, CardContent } from "@/components/ui/card";

const news = [
  "Crestview Science Fair finalists announced",
  "New parent engagement portal launching this term",
  "Grade 10 service learning showcase scheduled"
];

export default function NewsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl font-semibold text-white">News</h1>
      <div className="mt-8 grid gap-4">
        {news.map((item) => <Card key={item}><CardContent className="p-5 text-slate-200">{item}</CardContent></Card>)}
      </div>
    </main>
  );
}
