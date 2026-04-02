import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, #1f1f35 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Purple glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">NextFlow</span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-none">
          Build AI workflows
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            visually
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed">
          Chain Gemini LLM calls, image processing, and video analysis into
          powerful workflows — all with a drag-and-drop node editor.
        </p>

        {/* CTAs */}
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/sign-up"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
          >
            Get started free
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mt-12 justify-center">
          {["6 node types", "Gemini models", "Visual DAG editor", "Auto-save"].map(
            (feat) => (
              <span
                key={feat}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-xs text-slate-400 font-medium"
              >
                {feat}
              </span>
            )
          )}
        </div>
      </div>
    </main>
  );
}
