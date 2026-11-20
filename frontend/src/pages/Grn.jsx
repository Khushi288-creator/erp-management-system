import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import api from "../api/axios";
import useList from "../hooks/useList";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import { shortDate } from "../utils/format";

export default function Grn() {
  const { user } = useSelector((state) => state.auth);
  const canCreate = ["admin", "inventory"].includes(user?.role);
  const list = useList("/grn");
  const [creating, setCreating] = useState(false);

  const columns = [
    { label: "GRN No", render: (g) => <Typography fontWeight={600}>{g.grnNo}</Typography> },
    { label: "Purchase Order", render: (g) => g.purchaseOrder?.orderNo || "-" },
    { label: "Supplier", render: (g) => g.purchaseOrder?.supplier?.name || "-" },
    { label: "Items Received", render: (g) => g.items.map((i) => `${i.title} x ${i.receivedQty}`).join(", ") },
    { label: "Received By", render: (g) => g.receivedBy?.name || "-" },
    { label: "Date", render: (g) => shortDate(g.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Goods Receipt Notes"
        subtitle="Record goods that arrive against a purchase order. Stock goes up automatically."
        action={
          canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
              New GRN
            </Button>
          )
        }
      />
      <SearchBar value={list.search} onChange={list.onSearch} placeholder="Search by GRN number" />
      <DataTable columns={columns} rows={list.items} list={list} emptyText="No goods receipts yet" />

      {creating && (
        <GrnDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            list.refresh();
          }}
        />
      )}
    </>
  );
}

function GrnDialog({ onClose, onSaved }) {
  const [orders, setOrders] = useState([]);
  const [poId, setPoId] = useState("");
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/purchase-orders", { params: { status: "ordered,partially_received", limit: 100 } })
      .then((r) => setOrders(r.data.items));
  }, []);

  const pickOrder = async (id) => {
    setPoId(id);
    try {
      const { data } = await api.get(`/purchase-orders/${id}`);
      setLines(
        data.items.map((i) => {
          const remaining = i.quantity - i.receivedQty;
          return {
            product: i.product, title: i.title, ordered: i.quantity,
            received: i.receivedQty, remaining, receiveNow: remaining,
          };
        })
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load order");
    }
  };

  const updateQty = (index, value) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, receiveNow: value } : l)));

  const submit = async () => {
    if (!poId) return toast.error("Select a purchase order");
    for (const l of lines) {
      const q = Number(l.receiveNow);
      if (q < 0 || q > l.remaining) return toast.error(`${l.title}: enter 0 to ${l.remaining}`);
    }
    setSaving(true);
    try {
      await api.post("/grn", {
        purchaseOrder: poId,
        notes,
        items: lines.map((l) => ({ product: l.product, receivedQty: Number(l.receiveNow) })),
      });
      toast.success("GRN saved and stock updated");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save GRN");
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>New Goods Receipt Note</DialogTitle>
      <DialogContent>
        {orders.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No purchase orders are waiting for goods. A purchase order must be in "Ordered" status first.
          </Alert>
        )}
        <TextField
          select fullWidth margin="dense" label="Purchase Order" value={poId}
          onChange={(e) => pickOrder(e.target.value)}
        >
          {orders.map((o) => (
            <MenuItem key={o._id} value={o._id}>
              {o.orderNo} - {o.supplier?.name}
            </MenuItem>
          ))}
        </TextField>

        {lines.length > 0 && (
          <Box sx={{ overflowX: "auto", mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Ordered</TableCell>
                  <TableCell align="right">Already received</TableCell>
                  <TableCell align="right">Receive now</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((l, i) => (
                  <TableRow key={l.product}>
                    <TableCell>{l.title}</TableCell>
                    <TableCell align="right">{l.ordered}</TableCell>
                    <TableCell align="right">{l.received}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" value={l.receiveNow}
                        disabled={l.remaining === 0}
                        onChange={(e) => updateQty(i, e.target.value)}
                        slotProps={{ htmlInput: { min: 0, max: l.remaining } }} sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        <TextField
          fullWidth margin="normal" label="Notes (optional)" value={notes}
          onChange={(e) => setNotes(e.target.value)} multiline rows={2}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving || !poId}>
          {saving ? "Saving..." : "Save GRN"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
