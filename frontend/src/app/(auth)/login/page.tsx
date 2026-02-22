"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { LogoIcon } from "@/components/logo";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleToken = async (idToken: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.googleAuth({ idToken });
      if (response.newUser) {
        localStorage.setItem("accessToken", response.accessToken);
        const payload = JSON.parse(atob(response.accessToken.split(".")[1]));
        localStorage.setItem("pendingEmail", payload.email || "");
        toast.success("Almost there!", {
          description: "Verify your phone number to activate your wallet.",
        });
        router.push("/verify-otp");
      } else {
        localStorage.setItem("accessToken", response.accessToken);
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Google sign-in failed", {
        description: apiError.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { triggerGoogleLogin } = useGoogleAuth(handleGoogleToken);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      localStorage.setItem("accessToken", response.accessToken);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Login failed", {
        description: apiError.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <img
          src="/images/auth-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14 h-full">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <LogoIcon size={36} />
            <span className="text-white font-bold text-xl tracking-tight drop-shadow-md">NeoBank</span>
          </Link>

          <div className="flex-1" />

          <div>
            <h2 className="text-[28px] xl:text-[34px] font-bold text-white leading-[1.2] max-w-[500px] drop-shadow-lg">
              Join <span className="text-emerald-400">1,200+</span> Users that Trust
              NeoBank to Manage their Finances
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {["Instant Transfers", "Secure Wallet", "Powerful Dashboard"].map(
                (pill) => (
                  <span
                    key={pill}
                    className="inline-flex items-center gap-2 text-[13px] font-medium text-white/90"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400" />
                      <polyline points="8 12 11 15 16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" />
                    </svg>
                    {pill}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[40%] flex items-center justify-center bg-white dark:bg-slate-950 px-6 py-12 sm:px-12 lg:px-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <LogoIcon size={44} />
          </div>

          <div className="mb-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">Welcome to <span className="font-semibold text-slate-700 dark:text-slate-200">NeoBank</span></p>
          </div>
          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-slate-900 dark:text-white leading-tight">
              Sign in to your account
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading}
                className="h-11"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
                className="h-11"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11 text-[15px] font-semibold">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z" />
                  </svg>
                  Signing inâ€¦
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-950 px-3 text-slate-400 dark:text-slate-500">or continue with</span>
            </div>
          </div>

          <Button variant="outline" type="button" disabled={isLoading} onClick={triggerGoogleLogin} className="w-full h-11 text-sm font-medium">
            <svg className="mr-2 h-[18px] w-[18px]" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.09A6.99 6.99 0 0 1 5.49 12c0-.72.13-1.43.35-2.09V7.07H2.18A11.01 11.01 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
            </svg>
            Google
          </Button>

          <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
            By continuing you agree to our{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            {" "}and{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
