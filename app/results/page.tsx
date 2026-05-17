import ResultsView from '@/components/ResultsView'

interface ResultsPageProps {
  searchParams: Promise<{ sample?: string }>
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams
  return <ResultsView initialSample={params.sample === 'true'} />
}
