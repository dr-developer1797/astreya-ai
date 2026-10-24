import Image from "next/image";
import type { ReactNode } from "react";
import { F } from "@/shared/constants/theme";
import { FONT_IMPORT } from "@/shared/styles/fontImport";

export default function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0C11] px-4 py-10">
      <style>{FONT_IMPORT}</style>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Image
          src="/astreya-logo-dark.png"
          alt="Astreya"
          width={48}
          height={48}
          priority
        />
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight text-[#EEEEF5]"
            style={{ fontFamily: F.serif }}
          >
            Astreya
          </h1>
          <p className="mt-1 text-sm text-[#8B8BA8]">
            AI-powered legal workspace
          </p>
        </div>
      </div>
      <div className="w-full max-w-[420px]">{children}</div>
    </div>
  );
}
