// Shared by the server query and both history screens.
export const auditGroups = [
  { id: "orders", label: "ออเดอร์", actions: ["CREATE_ORDER", "ADD_ORDER_ITEMS", "PICKUP_ORDER", "CANCEL_ORDER", "UPDATE_KITCHEN_STATUS"] },
  { id: "payments", label: "การชำระเงิน", actions: ["PAY_ORDER"] },
  { id: "menu", label: "หมวดหมู่และเมนู", actions: ["CREATE_CATEGORY", "UPDATE_CATEGORY", "DELETE_CATEGORY", "CREATE_MENU", "UPDATE_MENU", "DELETE_MENU", "TOGGLE_MENU", "UPLOAD_MENU_IMAGE"] },
  { id: "stock", label: "วัตถุดิบ สต็อก และสูตรอาหาร", actions: ["CREATE_INGREDIENT", "UPDATE_INGREDIENT", "DELETE_INGREDIENT", "STOCK_IN", "ADJUST_STOCK", "UPDATE_RECIPE"] },
  { id: "tables", label: "โต๊ะและ QR", actions: ["CREATE_TABLE", "UPDATE_TABLE_STATUS", "QR_TABLE_ROTATE", "QR_TABLE_OPEN", "QR_TABLE_PAUSE", "QR_TABLE_RESUME", "QR_TABLE_CLOSE", "QR_TABLE_CLEAR-BILL"] },
  { id: "staff", label: "บัญชีพนักงาน", actions: ["CREATE_EMPLOYEE", "UPDATE_EMPLOYEE"] },
  { id: "settings", label: "ข้อมูลร้านและการตั้งค่า", actions: ["UPDATE_RESTAURANT_PROFILE", "UPDATE_PAYMENT_SETTINGS", "UPLOAD_RESTAURANT_LOGO", "UPLOAD_PROMPTPAY_QR"] },
  { id: "security", label: "การเข้าสู่ระบบและความปลอดภัย", actions: ["LOGIN", "LOGIN_FAILED", "LOGIN_INACTIVE", "LOGOUT", "VERIFY_EMAIL", "RESET_PASSWORD", "UPDATE_ACCOUNT"] },
] as const;

export const quietAuditActions = ["LOGIN", "LOGOUT", "UPDATE_KITCHEN_STATUS", "QR_TABLE_OPEN", "QR_TABLE_PAUSE", "QR_TABLE_RESUME", "QR_TABLE_CLOSE", "QR_TABLE_CLEAR-BILL", "UPLOAD_MENU_IMAGE", "UPLOAD_RESTAURANT_LOGO", "UPLOAD_PROMPTPAY_QR"];
