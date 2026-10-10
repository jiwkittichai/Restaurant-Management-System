import type { Feedback } from "../types";

export default function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p role={feedback.type === "error" ? "alert" : "status"} className={`mt-4 text-sm ${feedback.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
      {feedback.text}
    </p>
  );
}
