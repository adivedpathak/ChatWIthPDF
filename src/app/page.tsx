import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

export default async function Home() {
  const user = await currentUser();
  const userId = user?.id;
  const isAuth = !!userId;

  return (
    <div className="w-screen min-h-screen bg-black text-white">
      {/* Main container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-center space-x-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-violet-500">
              Chat with any PDF
            </h1>
            {/* Login Icon */}
            <div className="ml-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

          {/* Description */}
          <p className="max-w-xl mt-2 text-lg text-gray-400 sm:text-xl">
            Join millions of students, researchers, and professionals to instantly
            answer questions and understand research with AI.
          </p>

          {/* Call-to-action Buttons */}
          <div className="flex space-x-4 mt-6">
            {!isAuth ? (
              <>
                <Link href="/login">
                  <Button className="px-6 py-3 text-lg font-medium text-white bg-violet-600 rounded-lg shadow-md hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 transition-transform transform hover:scale-105">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="px-6 py-3 text-lg font-medium text-violet-500 border border-violet-500 rounded-lg hover:bg-violet-100 focus:outline-none focus:ring focus:ring-violet-400 transition-transform transform hover:scale-105">
                    Log In
                    <LogIn className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button className="px-6 py-3 text-lg font-medium text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-400 transition-transform transform hover:scale-105">
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer or Decorative Section */}
      <footer className="absolute bottom-4 left-[50%] -translate-x-[50%] text-center text-sm text-gray-500">
        Made with ❤️ by Aditya Vedpathak
      </footer>
    </div>
  );
}
