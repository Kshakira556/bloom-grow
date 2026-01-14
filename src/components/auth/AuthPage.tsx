// components/auth/AuthPage.tsx
import { Navbar } from "@/components/layout/Navbar";

type AuthPageProps = {
  title: string;
  illustration: string;
  children: React.ReactNode;
};

export const AuthPage = ({ title, illustration, children }: AuthPageProps) => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-3xl">
          <div className="bg-card rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gradient-to-br from-cub-teal-light to-cub-mint-light p-8 flex items-center justify-center">
              <img src={illustration} alt={title} className="w-full max-w-[200px] h-auto object-contain" />
            </div>
            <div className="md:w-1/2 p-8">
              <h1 className="text-2xl font-display font-bold text-center mb-8">{title}</h1>
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
