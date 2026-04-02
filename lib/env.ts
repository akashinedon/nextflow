import { z } from "zod";

const envSchema = z.object({
  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),

  // Database
  MONGODB_URI: z.string().url(),

  // Gemini
  GEMINI_API_KEY: z.string().min(1),

  // Media Providers (Uploadcare & Cloudinary)
  NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),

  // Trigger.dev
  TRIGGER_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_TRIGGER_PROJECT_ID: z.string().min(1),

  // Next.js
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>;

// Called server-side only — throws with descriptive errors if misconfigured
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `❌ Invalid environment variables:\n${formatted}\n\nCheck your .env file.`
    );
  }
  return result.data;
}

// Export a validated, typed env object
export const env = validateEnv();
