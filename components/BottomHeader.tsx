import { Compass, Plus, Wallet } from "lucide-react";
import Link from "next/link";

const BottomHeader = () => {
  const navLinks = [
    { href: "/app/memes", icon: Compass, label: "Explore" },
    { href: "/app/memes/create", icon: Plus, label: "Create" },
    { href: "/app/memes/settlements", icon: Wallet, label: "Settlements" },
    // { href: "/app/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2">
      <div className="flex justify-around items-center">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="p-2 flex flex-col items-center"
            >
              <Icon
                className={`h-8 w-8 md:h-6 md:w-6 ${"text-muted-foreground hover:text-primary"}`}
              />
              <span className="text-xs mt-1 hidden md:block">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomHeader;
