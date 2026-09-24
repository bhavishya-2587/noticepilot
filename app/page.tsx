import Image from "next/image";

import { NoticeUploadIngestion } from "./components/notice-upload-ingestion";

export default function Home() {
  return (
    <main className="min-h-screen flex-1 bg-[#020812] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mx-auto flex max-w-4xl items-center gap-5 lg:mx-0">
          <div className="flex shrink-0 items-center border-r border-cyan-200/30 pr-5">
            <Image
              src="/noticepilot-icon.png"
              alt="NoticePilot"
              width={96}
              height={96}
              priority
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
            />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80 sm:text-sm">
              Academic notice intelligence
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              NoticePilot
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Turn dense academic notices into clear, actionable information.
            </p>
          </div>
        </header>

        <div className="mt-10">
          <NoticeUploadIngestion />
        </div>
      </div>
    </main>
  );
}