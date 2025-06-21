import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Mi Proyecto",
  description: "Página web con Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 p-4 text-white">
          <ul className="flex space-x-4 justify-center">
            <li>
              <Link href="/screens/home">Home</Link>
            </li>
            <li>
              <Link href="/screens/login">Login</Link>
            </li>
            <li>
              <Link href="/screens/signup">SignUp</Link>
            </li>
            <li>
              <Link href="/screens/recuperarContraseña">
                Recuperar Contraseña
              </Link>
            </li>
          </ul>
        </nav>
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
