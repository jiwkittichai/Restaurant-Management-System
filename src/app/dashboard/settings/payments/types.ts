export type PaymentSettings = {
  promptPayEnabled: boolean;
  promptPayAccountName: string;
  promptPayIdentifier: string;
  promptPayQrImageUrl: string;
};

export const emptyPaymentSettings: PaymentSettings = {
  promptPayEnabled: false,
  promptPayAccountName: "",
  promptPayIdentifier: "",
  promptPayQrImageUrl: "",
};
