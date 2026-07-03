import { APP_VERSION } from "@/lib/constants";

export function AppFooter() {
  return (
    <footer className="shrink-0 border-t border-gray-100 bg-card/80 px-4 py-3 sm:px-6 lg:px-8">
      <p className="text-center text-[11px] font-medium text-gray-400 sm:text-left">
        {APP_VERSION}
      </p>
    </footer>
  );
}
