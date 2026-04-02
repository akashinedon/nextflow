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
              colorInputBackground: "#17172a",
              colorInputText: "#f1f5f9",
              colorText: "#f1f5f9",
              colorTextSecondary: "#94a3b8",
              colorPrimary: "#7c3aed",
              colorDanger: "#ef4444",
              borderRadius: "12px",
            },
            elements: {
              card: "shadow-2xl shadow-black/60 border border-[#2a2a40]",
              headerTitle: "text-white font-semibold",
              socialButtonsIconButton: "border-[#2a2a40] bg-[#17172a] hover:bg-[#1e1e30]",
              dividerLine: "bg-[#2a2a40]",
              formFieldInput: "border-[#2a2a40]",
            },
          }}
        />
      </div>
    </div>
  );
}
