import { Navbar } from '@/components/Navbar';
import { LobbiesList } from '@/components/LobbiesList';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <ProtectedRoute>
                <main className="container mx-auto px-4 py-8 max-w-5xl">
                    <div className="mb-12 text-center">
                        <h1 className="text-5xl font-bold text-white mb-4">
                            Public Lobbies
                        </h1>
                        <p className="text-xl text-gray-300 mb-2">
                            Join a lobby and compete with other players
                        </p>
                        <p className="text-gray-400">
                            Select 8 cryptocurrencies, choose Captain (2×) and Vice-Captain (1.5×), earn points from price movements
                        </p>
                    </div>

                    <LobbiesList />
                </main>
            </ProtectedRoute>

            <footer className="border-t border-gray-800 mt-16">
                <div className="container mx-auto px-4 py-8 text-center text-black">
                    <p>Crypto Fantasy League • Transform passive crypto watching into competitive gaming</p>
                </div>
            </footer>
        </div>
    );
}
