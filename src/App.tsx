import { useShips } from "./api/encyclopedia";

export default function App() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Ships />
    </main>
  );
}

function Ships() {
  const ships = useShips();

  if (ships.error) {
    return <div>error</div>;
  }

  if (ships.isPending) {
    return <div>loading</div>;
  }

  return <div>{ships.data.length} result(s)</div>;
}
