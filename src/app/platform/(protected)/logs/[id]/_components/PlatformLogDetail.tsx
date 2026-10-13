/**
 * PlatformLogDetail แสดงรายละเอียดกิจกรรมของผู้ดูแลแพลตฟอร์ม
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, Database, FileClock, UserRound } from "lucide-react";
import { formatRelativeDate } from "@/app/dashboard/formatters";
import {
  logActionTone,
  logComparisonRows,
  logDetailRows,
  logEntityLabel,
  logLabels,
  logSummary,
  platformAdminName,
  restaurantCode,
} from "../../../_lib/formatters";
import type { PlatformLog } from "../../../_lib/types";

function DetailTile({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 gap-3 bg-white p-4 sm:p-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <div className="mt-1 break-words text-sm font-medium text-gray-900">{children}</div>
      </div>
    </div>
  );
}

export default function PlatformLogDetail({ log }: { log: PlatformLog }) {
  const details = logDetailRows(log.details);
  const changes = logComparisonRows(log.details);
  const detailGridColumns = details.length === 1
    ? "grid-cols-1"
    : details.length === 2 || details.length === 4
      ? "sm:grid-cols-2"
      : "sm:grid-cols-2 lg:grid-cols-3";
  const entityLabel = logEntityLabel(log.action);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-4 sm:space-y-5">
      <Link href="/platform/logs" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600">
        <ArrowLeft size={17} />
        กลับ
      </Link>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 sm:h-12 sm:w-12">
              <FileClock size={21} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium text-gray-400">รายละเอียดประวัติ</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${logActionTone(log.action)}`}>
                  {logLabels[log.action] || log.action}
                </span>
              </div>
              <h2 className="mt-1 break-words text-lg font-semibold text-gray-900 sm:text-xl">{logSummary(log)}</h2>
            </div>
          </div>
        </div>

        <div className="grid gap-px border-t border-gray-100 bg-gray-100 sm:grid-cols-3">
          <DetailTile icon={<UserRound size={17} />} label="ผู้ทำรายการ">{platformAdminName}</DetailTile>
          <DetailTile icon={<Clock3 size={17} />} label="เวลาทำรายการ">
            <time dateTime={log.createdAt} title={new Date(log.createdAt).toLocaleString("th-TH")}>{formatRelativeDate(log.createdAt)}</time>
          </DetailTile>
          <DetailTile icon={<Database size={17} />} label="ประเภทข้อมูล">
            {log.restaurantId ? `${entityLabel} · ${restaurantCode(log.restaurantId)}` : entityLabel}
          </DetailTile>
        </div>
      </section>

      {(details.length > 0 || changes.length > 0) && (
        <div className={`grid items-start gap-4 sm:gap-5 ${details.length > 0 && changes.length > 0 ? "lg:grid-cols-[1fr_380px]" : ""}`}>
          {details.length > 0 && (
            <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <h2 className="font-semibold text-gray-900">รายละเอียดการทำรายการ</h2>
                <p className="mt-1 text-xs text-gray-400">ข้อมูลที่บันทึกไว้ ณ เวลาทำรายการ</p>
              </div>
              <dl className={`grid gap-3 p-4 sm:p-5 ${detailGridColumns}`}>
                {details.map((row, index) => (
                  <div key={`${row.label}-${index}`} className="min-w-0 rounded-xl bg-gray-50 px-4 py-3.5">
                    <dt className="text-xs text-gray-400">{row.label}</dt>
                    <dd className="mt-1 break-words text-sm font-medium text-gray-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {changes.length > 0 && (
            <section className={`overflow-hidden rounded-2xl border border-gray-100 bg-white ${details.length > 0 ? "lg:sticky lg:top-6" : ""}`}>
              <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <h2 className="font-semibold text-gray-900">สรุปการเปลี่ยนแปลง</h2>
                <p className="mt-1 text-xs text-gray-400">เปรียบเทียบค่าก่อนและหลังทำรายการ</p>
              </div>
              <div className="divide-y divide-gray-100">
                {changes.map((row, index) => (
                  <div key={`${row.label}-${index}`} className={`grid gap-3 px-4 py-4 text-sm sm:px-5 ${details.length > 0 ? "" : "sm:grid-cols-[minmax(140px,0.35fr)_1fr] sm:items-center"}`}>
                    <p className="font-medium text-gray-900">{row.label}</p>
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="min-w-0 flex-1 rounded-xl bg-gray-50 px-3 py-2.5">
                        <p className="text-[11px] text-gray-400">ก่อน</p>
                        <p className="mt-0.5 break-words font-medium text-gray-600">{row.before || "-"}</p>
                      </div>
                      <ArrowRight size={16} className="shrink-0 text-gray-300" />
                      <div className="min-w-0 flex-1 rounded-xl bg-blue-50 px-3 py-2.5">
                        <p className="text-[11px] text-blue-400">หลัง</p>
                        <p className="mt-0.5 break-words font-medium text-blue-700">{row.after || "-"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
