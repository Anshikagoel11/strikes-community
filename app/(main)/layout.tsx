import NavigationSidebar from "@/components/navigation/navigation-sidebar";
import { ModalProvider } from "@/components/providers/modal-provider";
import { SocketProvider } from "@/components/providers/socket-provider";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen flex">
            <div className="hidden md:flex h-full w-18 z-30 flex-col fixed inset-y-0">
                <NavigationSidebar />
            </div>
            <main className="md:ml-18 flex-1 min-h-screen flex flex-col">
                <SocketProvider>
                    <ModalProvider />
                    {children}
                </SocketProvider>
            </main>
        </div>
    )
}

export default MainLayout;