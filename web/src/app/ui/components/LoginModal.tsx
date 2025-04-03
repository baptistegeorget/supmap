"use client";

import { useState } from "react";
import Cookie from "js-cookie";


interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const url = isSignUp
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signin`;
    
    const body = isSignUp ? { email, name, password } : { email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de l'opération");
      }

      const data = await response.json();
      console.log(`${isSignUp ? "Inscription" : "Connexion"} réussie:`, data.token);

          // Stocker le token dans un cookie
      Cookie.set('auth_token', data.token, { expires: 7, secure: true, sameSite: 'Strict' });
      window.location.reload(); // Recharger la page pour mettre à jour l'état de l'application

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white p-10 rounded-lg text-center w-[550px]" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-xl mb-6">{isSignUp ? "Inscription" : "Connexion"}</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="mb-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom"
                className="w-4/5 p-2 border rounded-lg"
              />
            </div>
          )}
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse e-mail"
              className="w-4/5 p-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-4/5 p-2 border rounded-lg"
            />
          </div>
          {isSignUp && (
            <div className="mb-4">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                className="w-4/5 p-2 border rounded-lg"
              />
            </div>
          )}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="w-[210px] py-2 mt-6 mx-2 bg-customOrange text-white rounded-md hover:opacity-80"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="w-[210px] py-2 mt-6 mx-2 bg-customPurple text-white rounded-md hover:opacity-80"
            >
              {isSignUp ? "S'inscrire" : "Se connecter"}
            </button>
          </div>
        </form>
        <div className="mt-6 flex justify-center">
          <button
            className="w-[calc(420px+1rem)] py-2 bg-red-600 text-white rounded-md hover:opacity-80"
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`}
          >
            Se connecter avec Google
          </button>
        </div>
        <div className="mt-4 text-center">
          <button
            className="text-sm text-gray-600 hover:text-blue-600"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? Inscription"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
