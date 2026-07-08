import { SimulatorView } from "@/features/simulator/SimulatorView";

interface SimulatorProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function SimulatorProjectPage({
  params,
}: SimulatorProjectPageProps) {
  const { id } = await params;
  return <SimulatorView projectId={id} />;
}
