import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #1f1f35 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-900/15 blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <SignIn
          appearance={{
            variables: {
              colorBackground: "#12121c",
              colorInputBackground: "#161a2b",
              colorInputText: "#f8fafc",
              colorText: "#e8ecf8",
              colorTextSecondary: "#b0b8d0",
              colorPrimary: "#7c3aed",
              colorDanger: "#ef4444",
              borderRadius: "12px",
            },
            elements: {
              card: "shadow-2xl shadow-black/60 border border-[#3a4060] bg-[#0f1324]/95",
              headerTitle: "text-white font-semibold",
              headerSubtitle: "text-slate-300",
              socialButtonsBlockButton: "border-[#3a4060] bg-[#161a2b] hover:bg-[#1f243a]",
              socialButtonsBlockButtonText: "text-slate-100",
              socialButtonsIconButton: "border-[#3a4060] bg-[#161a2b] hover:bg-[#1f243a]",
              dividerLine: "bg-[#3a4060]",
              dividerText: "text-slate-400",
              formFieldLabel: "text-slate-200",
              formFieldInput:
                "border-[#3a4060] bg-[#161a2b] text-slate-100 placeholder:text-slate-400",
              formButtonPrimary:
                "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95",
              footerActionText: "text-slate-300",
              footerActionLink: "text-violet-300 hover:text-violet-200",
              identityPreviewText: "text-slate-200",
            },
          }}
        />
      </div>
    </div>
  );
}
