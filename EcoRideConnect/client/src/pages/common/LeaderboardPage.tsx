import { Card } from "@/components/ui/card";

export default function LeaderboardPage() {
  const entries = [
    { name: "Aarav", points: 1200 },
    { name: "Diya", points: 980 },
    { name: "Karan", points: 860 },
  ];
  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
      <Card className="p-4">
        <div className="text-lg font-semibold">Green Leaderboard</div>
        <div className="mt-3 space-y-2">
          {entries.map((e, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>{i+1}. {e.name}</div>
              <div className="font-semibold">{e.points} pts</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
