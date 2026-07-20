export interface Email {
  from: string | null;
  toAddress: string | null;
  ccSender: boolean | false;
  ccEmail: string | null;
  subject: string | null;
  message: string | null;
  attachment: [] | null;
  isHtml: boolean | false;
}
