import { api } from "../../lib/api";

export interface PaymentInitResponse {
  authorizationUrl: string;
  reference: string;
}

export interface PaymentResult {
  success: boolean;
  orderStatus: string;
  trackingToken: string;
  publicReference: string;
  message: string | null;
}

/** Starts payment for a pending order; returns the gateway redirect URL. */
export async function initiatePayment(trackingToken: string): Promise<PaymentInitResponse> {
  const { data } = await api.post<PaymentInitResponse>("/payments/initiate", { trackingToken });
  return data;
}

/** Verifies a transaction on redirect return (idempotent; webhook is authoritative). */
export async function verifyPayment(reference: string): Promise<PaymentResult> {
  const { data } = await api.post<PaymentResult>("/payments/verify", { reference });
  return data;
}
