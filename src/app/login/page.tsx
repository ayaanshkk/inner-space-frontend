"use client";
import Image from "next/image";
import { Globe } from "lucide-react";
import { APP_CONFIG } from "@/config/app-config";
import { LoginForm } from "@/app/(main)/auth/_components/login-form";
export default function LoginPage() {
  return (
    <div className="flex h-dvh">
      {/* Left Panel - Brand/Welcome Section */}
      <div className="bg-primary hidden lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            {/* InnerSpace Interiors Logo */}
            {/* <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <svg
                className="h-12 w-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div> */}

            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-primary-foreground text-5xl font-light">Welcome Back</h1>
              <p className="text-primary-foreground/80 text-xl">
                InnerSpace Interiors CRM
              </p>
              <p className="text-primary-foreground/60 text-sm pt-2">
                Kitchen & Bedroom Installation Management
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="bg-background relative flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          {/* Mobile Logo */}
          {/* <div className="lg:hidden flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <svg
                className="h-10 w-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
          </div> */}

          {/* Login Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-medium">Login to your account</h1>
            <p className="text-muted-foreground text-sm">
              Please enter your credentials to access the CRM
            </p>
          </div>

          {/* Login Form Component */}
          <div className="space-y-4">
            <LoginForm />
          </div>

          {/* Additional Links */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help?{" "}
              <a href="/support" className="text-primary hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="absolute bottom-5 flex w-full justify-between px-10">
          <div className="text-sm text-muted-foreground">
            {APP_CONFIG.copyright || "© 2024 InnerSpace Interiors. All rights reserved."}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Globe className="size-4" />
            ENG
          </div>
        </div>
      </div>
    </div>
  );
}