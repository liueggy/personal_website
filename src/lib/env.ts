type PublicEnv = {
  siteUrl: string | null;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type ServerEnv = PublicEnv & {
  supabaseServiceRoleKey: string;
  adminEmail: string | null;
};

function readEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPublicEnv(): PublicEnv {
  return {
    siteUrl: process.env.SITE_URL?.trim() || null,
    supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  };
}

export function getServerEnv(): ServerEnv {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() || null
  };
}
