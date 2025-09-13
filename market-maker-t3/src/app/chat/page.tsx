import { redirect } from 'next/navigation';

export default function ChatPage() {
  // Redirect to main page since chat is handled there
  redirect('/');
}