"use client";

import { useState } from "react";
import Link from "next/link";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Gestion de la connexion
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la connexion");
      }

      const data = await response.json();
      console.log("Connexion réussie:", data.token);
      onClose(); // Fermer la modale après la connexion
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    }
  };

  // Gestion de la connexion avec Google
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`);
      if (!response.ok) {
        throw new Error("Échec de l'initialisation de la connexion Google");
      }

      // Rediriger l'utilisateur vers l'URL d'autorisation Google
      window.location.href = response.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    }
  };

  // Gestion du mot de passe oublié
  const handleForgotPassword = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la demande de réinitialisation du mot de passe");
      }

      console.log("Demande de réinitialisation du mot de passe envoyée");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    }
  };

  // Gestion de l'inscription
  const handleSignUp = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de l'inscription");
      }

      const data = await response.json();
      console.log("Inscription réussie:", data.token);
      onClose(); // Fermer la modale après l'inscription
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose} // Fermer la modale en cliquant en dehors
    >
      <div
        className="bg-white p-10 rounded-lg text-center w-[550px]"
        onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic à l'intérieur de la modale
      >
        <h2 className="font-bold text-xl mb-6">Connexion</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse e-mail"
              className="w-4/5 p-2 border-b-2 border-[#3D2683] focus:outline-none focus:ring-0 focus:border-t focus:border-r focus:border-l focus:border-[#3D2683] focus:border-b-2 focus:bg-gray-100 rounded-t-lg transition hover:bg-gray-200"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-4/5 p-2 border-b-2 border-[#3D2683] focus:outline-none focus:ring-0 focus:border-t focus:border-r focus:border-l focus:border-[#3D2683] focus:border-b-2 focus:bg-gray-100 rounded-t-lg transition hover:bg-gray-200"
            />
            {/* Lien "Mot de passe oublié" */}
            <div className="text-left w-4/5 mx-auto mt-2">
              <Link
                href="/mot-de-passe-oublie"
                className="text-sm text-gray-600 hover:text-customPurple"
                onClick={(e) => {
                  e.preventDefault();
                  handleForgotPassword();
                }}
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="w-[210px] py-2 mt-6 mx-2 bg-[#F15B4E] text-white rounded-md hover:opacity-80"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="w-[210px] py-2 mt-6 mx-2 bg-[#3D2683] text-white rounded-md hover:opacity-80"
            >
              Se connecter
            </button>
          </div>
        </form>

        {/* Bouton "Se connecter avec Google" */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleGoogleLogin}
            className="w-[calc(420px+1rem)] py-2 bg-red-600 text-white rounded-md hover:opacity-80"
          >
            Se connecter avec Google
          </button>
        </div>

        {/* Lien "Inscription" */}
        <div className="mt-4 text-center">
          <Link
            href="/inscription"
            className="text-sm text-gray-600 hover:text-customPurple"
            onClick={(e) => {
              e.preventDefault();
              handleSignUp();
            }}
          >
            Inscription
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;