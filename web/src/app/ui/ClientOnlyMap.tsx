"use client";

import dynamic from 'next/dynamic';

// Charger dynamiquement le composant MapPage, en s'assurant qu'il est uniquement rendu côté client
const MapPage = dynamic(() => import('./MapPage'), { ssr: false });

const ClientOnlyMap = () => {
  return <MapPage />;
};

export default ClientOnlyMap;