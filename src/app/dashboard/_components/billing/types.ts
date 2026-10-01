export type PaymentMethod = "CASH" | "PROMPTPAY";

export type BillOrder = {
  id: number;
  orderNumber: string;
  subtotal?: number;
  discount?: number;
  total: number;
  tableName?: string;
  queueNumber?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt?: string;
  items: Array<{ id: number; name: string; qty: number; price: number; note?: string | null; status?: string; modifiers?: Array<{ id: number; name: string; price: number }> }>;
};

export type PromptPaySettings = {
  promptPayEnabled: boolean;
  promptPayAccountName?: string;
  promptPayIdentifier?: string;
  promptPayQrImageUrl?: string;
};

export type BillModalProps = {
  order: BillOrder | null;
  title?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: { orderId: number; method: PaymentMethod; receivedAmount: number; changeAmount: number }) => Promise<void>;
  promptPaySettings?: PromptPaySettings | null;
};
