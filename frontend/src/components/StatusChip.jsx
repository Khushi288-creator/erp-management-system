import { Chip } from "@mui/material";

const colors = {
  pending: "warning",
  confirmed: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "error",
  ordered: "info",
  partially_received: "warning",
  received: "success",
  paid: "success",
  unpaid: "warning",
};

export const prettyStatus = (s = "") =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export default function StatusChip({ status }) {
  return <Chip size="small" label={prettyStatus(status)} color={colors[status] || "default"} />;
}
