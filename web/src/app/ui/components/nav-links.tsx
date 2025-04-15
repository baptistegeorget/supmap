'use client';

import {
  ChartPieIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Cookie from "js-cookie";
import { useEffect, useState } from "react";

// Définition du type pour les éléments de liens
type LinkItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export default function NavLinks() {
  const pathname = usePathname();
  const [links, setLinks] = useState<LinkItem[]>([]);  // Utilisation du type LinkItem
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || Cookie.get("auth_token");

    if (token) {
      setLinks([
        { name: 'Carte', href: '/', icon: MapIcon },
        { name: 'Analyse', href: '/analytics', icon: ChartPieIcon },
      ]);
    } else {
      setLinks([
        { name: 'Carte', href: '/', icon: MapIcon },
      ]);
    }

    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Évite le rendu pendant SSR
  }

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-customPurple hover:bg-opacity-15 hover:text-customOrange md:flex-none md:justify-start md:p-2 md:px-3',
              {
                'bg-customPurple bg-opacity-15 text-customOrange': pathname === link.href,
                'bg-gray-50 text-customPurple': pathname !== link.href,
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
