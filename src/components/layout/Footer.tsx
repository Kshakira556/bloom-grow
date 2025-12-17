import { Instagram, Facebook, Twitter } from "lucide-react";

// TikTok icon (not in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-6">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <p className="text-sm flex items-center gap-2">
          <span className="text-lg">©</span> CUB 2025
        </p>
        
        <div className="flex items-center gap-4">
          <span className="text-sm mr-2">Follow us</span>
          <a 
            href="#" 
            className="hover:opacity-80 transition-opacity"
            aria-label="Instagram"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a 
            href="#" 
            className="hover:opacity-80 transition-opacity"
            aria-label="TikTok"
          >
            <TikTokIcon className="w-6 h-6" />
          </a>
          <a 
            href="#" 
            className="hover:opacity-80 transition-opacity"
            aria-label="Facebook"
          >
            <Facebook className="w-6 h-6" />
          </a>
          <a 
            href="#" 
            className="hover:opacity-80 transition-opacity"
            aria-label="Twitter"
          >
            <Twitter className="w-6 h-6" />
          </a>
        </div>
      </div>
    </footer>
  );
}
