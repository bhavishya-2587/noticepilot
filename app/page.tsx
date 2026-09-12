import { NoticeUploadIngestion } from "./components/notice-upload-ingestion";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12 sm:py-20">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">NoticePilot</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Turn academic notices into clear, actionable information.
        </p>
      </div>
      <div className="mt-8 w-full max-w-xl">
        <NoticeUploadIngestion />
      </div>
    </main>
  );
}
