export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET() {
  return Response.json({ result: [{ id: 1, name: 'John' }] });
}
