import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { isAuthenticated } = await auth();
  return (

    <div>
      {/* Navbar */}
      <nav className="flex justify-between bg-gray-300 items-center">
        <div>Discord</div>
        <div className="flex items-center">
          {isAuthenticated ?
            <SignedIn>
              <Link href={"/dashboard"}><Button>Dashboard</Button></Link>
              <UserButton />
            </SignedIn>
            :
            <SignedOut>
              <Link href={"/sign-in"}><Button>Signin</Button></Link>
              <Link href={"/sign-up"}><Button>Signup</Button></Link>
            </SignedOut>
          }
        </div>
      </nav>
      <h1>home page</h1>
    </div>
  );
}
