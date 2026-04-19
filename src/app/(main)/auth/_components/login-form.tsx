"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const FormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true);

    try {
      console.log("🔄 Attempting login with username:", data.username);
      const result = await login(data.username, data.password);

      if (result.success) {
        toast.success("Login successful!", {
          description: "Welcome back! Redirecting to dashboard...",
        });

        // ✅ Wait a bit for localStorage to persist
        await new Promise(resolve => setTimeout(resolve, 100));

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // ✅ Use replace + add trailing slash + use window.location as fallback
          console.log("🔄 Redirecting to dashboard...");
          
          // Try Next.js router first
          router.replace('/dashboard/default/');
          
          // Fallback: If router doesn't work, use window.location
          setTimeout(() => {
            if (window.location.pathname === '/login' || window.location.pathname === '/login/') {
              console.log("⚠️ Router didn't redirect, using window.location");
              window.location.href = '/dashboard/default/';
            }
          }, 500);
        }
      } else {
        toast.error("Login failed", {
          description: result.error || "Please check your credentials and try again.",
        });
        setLoading(false); // Only reset loading on failure
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      setLoading(false); // Only reset loading on failure
    }
    // Don't reset loading on success - let the redirect happen
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="size-4"
                  disabled={loading}
                />
              </FormControl>
              <FormLabel htmlFor="login-remember" className="text-muted-foreground ml-1 text-sm font-medium">
                Remember me for 30 days
              </FormLabel>
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              New to InnerSpace Interiors?
            </span>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/auth/register" className="text-primary hover:underline font-medium">
              Contact your administrator
            </a>
          </p>
        </div>
      </form>
    </Form>
  );
}