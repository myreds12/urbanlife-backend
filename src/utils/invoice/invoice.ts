// src/utils/xendit-invoice.ts
import { Xendit } from 'xendit-node';

export interface CreateInvoiceParams {
  secretKey: string;
  externalId: string;
  amount: number;
  payerEmail?: string;
  description?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
}

export async function createXenditInvoice(params: CreateInvoiceParams) {
  const {
    secretKey,
    externalId,
    amount,
    payerEmail,
    description = '',
    successRedirectUrl,
    failureRedirectUrl,
  } = params;

  const xenditClient = new Xendit({ secretKey });
  const Invoice = xenditClient.Invoice; // instance

  const resp = await Invoice.createInvoice({
    data: {
      externalId,
      amount,
      payerEmail,
      description,
      successRedirectUrl,
      failureRedirectUrl,
    },
  });

  return resp; // contains { id, invoice_url, status, ... }
}
