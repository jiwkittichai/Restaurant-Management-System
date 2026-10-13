/**
 * รวมรูปแบบข้อมูลที่ใช้ในการตั้งค่าการชำระเงิน
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

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
