// components/auth/AuthForm.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User } from "lucide-react";
import { useState } from "react";

export type AuthField = {
  name: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

type AuthFormProps = {
  fields: AuthField[];
  onSubmit: (e: React.FormEvent) => void;
  buttonLabel: string;
  showRemember?: boolean;
  showForgotPassword?: boolean;
  forgotPasswordLink?: string;
  error?: string;
};

export const AuthForm = ({
  fields,
  onSubmit,
  buttonLabel,
  showRemember = false,
  showForgotPassword = false,
  forgotPasswordLink = "/forgot-password",
  error,
}: AuthFormProps) => {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {fields.map((field) => (
        <div className="relative" key={field.name}>
          {field.icon}
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={field.value}
            onChange={field.onChange}
            className="pl-12 bg-cub-mint-light border-0 rounded-full h-12"
            required
          />
        </div>
      ))}

      {error && <p className="text-red-500">{error}</p>}

      <Button type="submit" className="w-full rounded-full h-12">
        {buttonLabel}
      </Button>

      {(showRemember || showForgotPassword) && (
        <div className="flex items-center justify-between text-sm mt-4">
          {showRemember && (
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" className="border-primary data-[state=checked]:bg-primary" />
              <label htmlFor="remember" className="text-muted-foreground cursor-pointer">
                Remember me
              </label>
            </div>
          )}
          {showForgotPassword && (
            <a href={forgotPasswordLink} className="text-primary hover:underline italic">
              Forgot password?
            </a>
          )}
        </div>
      )}
    </form>
  );
};
