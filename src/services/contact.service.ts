import type { ContactMessageInput, ContactMessageReceipt } from "../types/contact.types";
import { api } from "./api";

export function submitContactMessage(input: ContactMessageInput): Promise<ContactMessageReceipt> {
  return api.post<ContactMessageReceipt>("/contact/messages", input);
}
