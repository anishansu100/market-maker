import { redirect } from 'next/navigation';

export default function LobbyPage() {
  // Redirect to main page since lobby is handled there
  redirect('/');
}