import Image from "next/image";

export function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return <Image src={src} alt={name} width={40} height={40} className="size-10 rounded-full object-cover" />;
  }

  return (
    <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-100">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}
