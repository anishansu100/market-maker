import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to main page since home is handled there
  redirect('/');
}