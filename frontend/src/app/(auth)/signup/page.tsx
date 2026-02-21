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
import { toast } from "sonner";

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await authApi.signup({
        email: data.email,
        password: data.password,
      });

      localStorage.setItem("pendingEmail", data.email);

      toast.success("Account created!", {
        description: "Verify your phone number to continue.",
      });

      router.push("/verify-otp");
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Signup failed", {
        description: apiError.message || "Please try again.",
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
            <div className="h-9 w-9 rounded-lg bg-blue-600 grid place-items-center shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight drop-shadow-md">NeoBank</span>
          </Link>

          <div className="flex-1" />

          <div>
            <h2 className="text-[28px] xl:text-[34px] font-bold text-white leading-[1.2] max-w-[500px] drop-shadow-lg">
              Join <span className="text-emerald-400">1,200+</span> Users that Trust
              NeoBank to Supercharge their Finances
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {["No Setup Fees", "Easy Onboarding", "Powerful Dashboard"].map(
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

      <div className="w-full lg:w-[40%] flex items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <div className="h-11 w-11 rounded-xl bg-blue-600 grid place-items-center shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              </svg>
            </div>
          </div>

          <div className="mb-1">
            <p className="text-sm text-slate-500">Welcome to <span className="font-semibold text-slate-700">NeoBank</span></p>
          </div>
          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-slate-900 leading-tight">
              Get started with your<br />email address
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
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
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                disabled={isLoading}
                className="h-11"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={isLoading}
                className="h-11"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11 text-[15px] font-semibold">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z" />
                  </svg>
                  Creating accountâ€¦
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or continue with</span>
            </div>
          </div>

          <Button variant="outline" type="button" disabled={isLoading} className="w-full h-11 text-sm font-medium">
            <svg className="mr-2 h-[18px] w-[18px]" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.09A6.99 6.99 0 0 1 5.49 12c0-.72.13-1.43.35-2.09V7.07H2.18A11.01 11.01 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
            </svg>
            Google
          </Button>

          <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
