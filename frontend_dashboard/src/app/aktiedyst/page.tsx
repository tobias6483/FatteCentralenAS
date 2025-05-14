import DashboardLayout from '@/components/DashboardLayout';
import AktiedystTabs from '@/components/aktiedyst/AktiedystTabs';
import ProfileCard from '@/components/ProfileCard'; // Import ProfileCard
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Import Card components
 
export default function AktiedystPage() {
  return (
    <DashboardLayout profileCard={<ProfileCard />}> {/* Add ProfileCard here */}
      <div className="container mx-auto py-8">
        {/* Enhanced Hero Section */}
        <header className="mb-12 p-8 rounded-lg bg-gradient-to-r from-sky-700 to-teal-600 text-white shadow-xl">
          <h1 className="text-5xl font-bold mb-3">Gør Investering Sjovere</h1>
          <p className="text-xl text-sky-100 mb-6">
            Handl aktier, ETF'er, krypto og mere. Analyser markeder og byg din portefølje med Fattecentralen Aktiedyst.
          </p>
          {/* Optional: Add a primary call to action button if desired */}
          {/* <button className="bg-white text-sky-700 font-semibold py-2 px-6 rounded-lg hover:bg-sky-50 transition-colors">
            Start din første handel
          </button> */}
        </header>

        {/* Informational Cards Section */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--foreground)]">Opdag Nye Muligheder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)] text-sm">
                Udforsk et bredt udvalg af aktiver og find din næste store investering.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--foreground)]">Lær og Konkurrer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)] text-sm">
                Test dine strategier risikofrit og dyst mod dine venner om den bedste portefølje.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[var(--foreground)]">Følg Dine Fremskridt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)] text-sm">
                Detaljerede analyser og historik hjælper dig med at forstå dine handler.
              </p>
            </CardContent>
          </Card>
        </section>
 
        <AktiedystTabs />
        
      </div>
    </DashboardLayout>
  );
}