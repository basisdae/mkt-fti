import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/forms/Input";
import { APP_SHORT, APP_TITLE, APP_VERSION } from "@/lib/constants";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md" padding="lg" interactive>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-sm">
            FTI
          </div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {APP_TITLE}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{APP_SHORT}</p>
        </div>

        <form className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@fti.co.th"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
          />
          <Button type="button" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Authentication not yet configured · Mock login screen
        </p>
      </Card>

      <p className="mt-6 text-center text-[11px] font-medium text-gray-400">
        {APP_VERSION}
      </p>
    </div>
  );
}
