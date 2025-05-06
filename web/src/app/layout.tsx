import './globals.css';
import './analytics/analytics.css';


import SideNav from './ui/components/sidenav';

export const metadata = {
  title: 'SupMap - Navigation en Temps Réel',
  description: 'Application de navigation en temps réel avec alertes trafic.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://use.typekit.net/smm0etp.css"
        />
        <style>{`
          * {
            font-family: 'Indivisible', sans-serif;
          }
        `}</style>
      </head>
      <body className="h-screen w-full bg-gray-100 text-gray-800 overflow-hidden">
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
          <div className="w-full flex-none md:w-64">
            <SideNav />
          </div>
          <div className="flex-1 h-screen mx-3 my-4 overflow-auto">{children}</div>
        </div>
      </body>
    </html>
  );
}
