import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios.js";

/**
 * A small "Report" link that expands into a reason field + submit/cancel.
 * `endpoint` is the report API path, e.g. `/questions/${id}/report`.
 */
const ReportButton = ({ endpoint }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(endpoint, { reason });
      toast.success("Reported. An admin will review it.");
      setReported(true);
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to report");
    } finally {
      setSubmitting(false);
    }
  };

  if (reported) {
    return <span className="text-xs text-muted">Reported</span>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted hover:text-coral transition-colors"
      >
        Report
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        required
        className="input-field !py-1 !px-2 text-xs w-40"
        placeholder="Reason..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <button
        type="submit"
        disabled={submitting}
        className="text-xs font-medium text-coral hover:underline disabled:opacity-50"
      >
        {submitting ? "..." : "Submit"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-chalk">
        Cancel
      </button>
    </form>
  );
};

export default ReportButton;
