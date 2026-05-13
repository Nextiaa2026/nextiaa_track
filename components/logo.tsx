import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2.5", className)}>
      <div className="relative size-8 shrink-0 overflow-hidden rounded-lg shadow-sm border border-white/10">
        <Image
          src="/favicon.png"
          alt="Nexiaa Track"
          fill
          className="object-cover"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            Nexiaa <span className="text-primary">Track</span>
          </span>
          <span className="text-[10px] font-medium text-muted-foreground/60 tracking-wider uppercase">
            Logistics
          </span>
        </div>
      )}
    </Link>
  );
}

export function WordLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-8 w-32", className)}>
      <Image
        src="/logo.png"
        alt="Nexiaa Track"
        fill
        className="object-contain"
      />
    </div>
  );
}
