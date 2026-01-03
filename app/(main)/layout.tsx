import NavigationSidebar from "@/components/navigation/navigation-sidebar";
import { ModalProvider } from "@/components/providers/modal-provider";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="h-full">
            <div className="hidden md:flex h-full w-18 z-30 flex-col fixed inset-y-0">
                <NavigationSidebar />
            </div>
            <main className="p-3 ml-18 h-full">
                <ModalProvider>
                    {children}
                </ModalProvider>
            </main>
        </div>
    )
}

export default MainLayout;