/**
 * EmployeeFormFields เป็นฟอร์มสำหรับพนักงานและสิทธิ์การใช้งาน
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

type EmployeeFormFieldsProps = {
  displayName: string;
  username: string;
  usernameDisabled?: boolean;
  onDisplayName: (value: string) => void;
  onUsername?: (value: string) => void;
};

export default function EmployeeFormFields({
  displayName,
  username,
  usernameDisabled = false,
  onDisplayName,
  onUsername,
}: EmployeeFormFieldsProps) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">ชื่อพนักงาน</span>
        <input
          required
          maxLength={100}
          value={displayName}
          onChange={(event) => onDisplayName(event.target.value)}
          placeholder="กรอกชื่อพนักงาน"
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</span>
        <input
          required
          disabled={usernameDisabled}
          value={username}
          onChange={(event) => onUsername?.(event.target.value.toLowerCase())}
          placeholder="กรอกชื่อผู้ใช้"
          className={`mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none ${usernameDisabled ? "cursor-not-allowed bg-gray-50 text-gray-400" : "focus:border-blue-400"}`}
        />
        {usernameDisabled && <span className="mt-1 block text-xs text-gray-400">ชื่อผู้ใช้ไม่สามารถแก้ไขได้</span>}
      </label>
    </div>
  );
}
