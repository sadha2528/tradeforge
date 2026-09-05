import { redirect } from 'next/navigation';

export default function NewSessionRedirect() {
  redirect('/session/new');
}
