$env_vars = @{
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" = "pk_test_cmFwaWQtY29sdC01LmNsZXJrLmFjY291bnRzLmRldiQ"
    "CLERK_SECRET_KEY" = "sk_test_7kRigEqKfZnU0vTyNcIuM85633tfw5JLee4wHWm55Q"
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL" = "/sign-in"
    "NEXT_PUBLIC_CLERK_SIGN_UP_URL" = "/sign-up"
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL" = "/dashboard"
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL" = "/dashboard"
    "DATABASE_URL" = "postgresql://neondb_owner:npg_iW4vMxjH0Kae@ep-flat-violet-ani2jjn6-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    "GEMINI_API_KEY" = "AIzaSyAc2d1gvdD--gGUJmHxtAxmzrU4Ki23Jlw"
    "NEXT_PUBLIC_TRANSLOADIT_KEY" = "aakashthedon"
    "TRANSLOADIT_SECRET" = "5644501e8d4f11b8655234535c8a6e5dd56cf5d2"
    "TRIGGER_API_KEY" = "tr_dev_ALVcvjxHqzNyvGyAqmiy"
    "NEXT_PUBLIC_TRIGGER_PROJECT_ID" = "proj_ocevngspjnccnlgrvbgi"
}

foreach ($key in $env_vars.Keys) {
    $value = $env_vars[$key]
    Write-Host "Adding $key..."
    $value | vercel env add $key production
    Write-Host "Done: $key"
}

Write-Host "`nAll environment variables added!"
