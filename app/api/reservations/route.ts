import { forwardForm } from '@/lib/api/forward'

export async function POST(request: Request): Promise<Response> {
  return forwardForm(request, '/reservations')
}
