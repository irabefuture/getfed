import { UserProvider } from '@/context/UserContext'
import Sidebar from '@/components/Sidebar'
import MealPlanner from '@/components/MealPlanner'

export default function Home() {
  return (
    <UserProvider>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content - offset by sidebar width */}
        <main className="ml-64 p-8">
          <div className="max-w-4xl">
            <MealPlanner />
          </div>
        </main>
      </div>
    </UserProvider>
  )
}
