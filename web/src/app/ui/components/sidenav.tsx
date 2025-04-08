"use client";

import Link from "next/link";
import { Cog6ToothIcon, UserIcon } from "@heroicons/react/24/outline";
import NavLinks from "./nav-links";
import Image from "next/image";
import clsx from "clsx";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import LoginModal from "./LoginModal";
import Cookie from "js-cookie";

function SideNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || Cookie.get("auth_token");
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.name) {
            setUserName(data.name);
          }
        })
        .catch(() => {
          Cookie.remove("auth_token"); // Supprimer le token si invalide
          localStorage.removeItem("token"); // Supprimer le token local
          setUserName(null);
        });
    }
  }, []);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleGoogleCallback(code);
    }
  }, [searchParams]);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleGoogleCallback = async (code: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Échec de la connexion Google");
      }

      const data = await response.json();
      Cookie.set("auth_token", data.token, { expires: 7, secure: true, sameSite: "None" });
      localStorage.setItem("token", data.token);
      setUserName(data.name);
      setIsLoginModalOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Erreur lors de la connexion Google:", error);
    }
  };

  const handleLogout = () => {
    Cookie.remove("auth_token");
    localStorage.removeItem("token");
    setUserName(null);
    window.location.reload(); // Recharge la page pour appliquer les changements
  };

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      {/* Logo */}
      <Link className="mb-2 flex h-20 items-center justify-center rounded-md bg-gray-50 p-4 md:h-40" href="/">
        <div className="flex items-center justify-center w-32 h-full md:w-40">
          <Image src="/logo_SupMap.svg" alt="Logo de l'application" width={100} height={116} priority />
        </div>
      </Link>

      {/* Liens de navigation */}
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>

        {/* Lien vers les paramètres */}
        <Link
          href="/settings"
          className={clsx(
            "flex h-[48px] grow items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-customPurple hover:bg-opacity-15 hover:text-customOrange md:flex-none md:justify-start md:p-2 md:px-3",
            {
              "bg-customPurple bg-opacity-15 text-customOrange": pathname === "/settings",
              "bg-gray-50 text-customPurple": pathname !== "/settings",
            }
          )}
        >
          <Cog6ToothIcon className="w-6" />
          <div className="hidden md:block">Paramètres</div>
        </Link>

        {/* Bouton connexion/déconnexion */}
        {userName ? (
          <div className="flex h-[48px] w-full grow items-center text-customPurple justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-customPurple hover:bg-opacity-15 hover:text-customOrange md:flex-none md:justify-start md:p-2 md:px-3">
          <UserIcon className="w-6" />
          <div className="flex flex-col ml-2">
            <span className="text-customPurple font-medium">{userName}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 mt-1"
            >
              Déconnexion
            </button>
          </div>
        </div>
        
        ) : (
          <button
            onClick={handleLoginClick}
            className="flex h-[48px] w-full grow items-center text-customPurple justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-customPurple hover:bg-opacity-15 hover:text-customOrange md:flex-none md:justify-start md:p-2 md:px-3"
          >
            <UserIcon className="w-6" />
            <div className="hidden md:block">Connexion</div>
          </button>
        )}
      </div>

      {/* Modale de connexion */}
      <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseModal} />
    </div>
  );
}

export default function SideNav() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SideNavContent />
    </Suspense>
  );
}
