import { Newspaper } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type NewsPost = { id: string; title: string; excerpt: string | null; published_at: string | null; created_at: string | null };

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value)) : "School update";
}

export default async function NewsPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("news_posts").select("id,title,excerpt,published_at,created_at").eq("status", "published").order("published_at", { ascending: false });
  const posts = (data ?? []) as NewsPost[];

  return (
    <main className="bg-[#f7f9fc] text-slate-950">
      <section className="bg-[#06165b] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase text-[#ffd83d]">School updates</p>
          <h1 className="mt-3 font-heading text-4xl font-black sm:text-6xl">News from Crestview.</h1>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {posts.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase text-[#cf1017]">{formatDate(post.published_at ?? post.created_at)}</p>
                <h2 className="mt-3 font-heading text-xl font-black text-[#06165b]">{post.title}</h2>
                {post.excerpt ? <p className="mt-3 text-sm leading-6 text-slate-600">{post.excerpt}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Newspaper className="mx-auto size-7 text-[#cf1017]" aria-hidden />
            <h2 className="mt-4 font-heading text-2xl font-black text-[#06165b]">News updates are on the way</h2>
            <p className="mt-2 text-sm text-slate-600">Published school stories will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
