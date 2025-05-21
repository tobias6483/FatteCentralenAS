// /app/(dashboard)/messages/compose/[recipientUsername]/page.tsx
import { ComposeMessageWithRecipientPage } from '../page'; // Importerer fra den almindelige compose side

// Denne side genbruger blot komponenten fra den almindelige compose-side.
// Next.js vil automatisk give `params.recipientUsername` til komponenten.
export default ComposeMessageWithRecipientPage;
