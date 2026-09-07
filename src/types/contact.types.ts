export interface ContactMessageInput {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageReceipt {
  id: string;
  submittedAt: string;
}
