import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Velkommen!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Dette er dit dashboard. Her vil du finde overblik over dine spil, beskeder og seneste aktivitet.</p>
                    </CardContent>
                </Card>
                {/* Flere placeholder cards kan tilføjes her */}
            </div>
        </div>
    );
}
