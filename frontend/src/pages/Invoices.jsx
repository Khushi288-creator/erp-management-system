import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Divider, Alert, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import api from "../api/axios";
import useList from "../hooks/useList";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatusChip from "../components/StatusChip";
import { money, shortDate } from "../utils/format";
import { downloadInvoicePdf } from "../utils/invoicePdf";

export default function Invoices() {
  const [status, setStatus] = useState("");
  const list = useList("/invoices", { status: status || undefined });
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);

  // list me customer ka poora data nahi hota, isliye PDF ke liye pura invoice mangwate hain
  const fetchFull = async (id) => {
    try {
      const { data } = await api.get(`/invoices/${id}`);
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load invoice");
      return null;
    }
  };

  const openView = async (row) => {
    const full = await fetchFull(row._id);
    if (full) setViewing(full);
  };

  const downloadPdf = async (row) => {
    const full = await fetchFull(row._id);
    if (full) downloadInvoicePdf(full);
  };

  const markPaid = async (row) => {
    try {
      await api.put(`/invoices/${row._id}/pay`);
      toast.success(`${row.invoiceNo} marked as paid`);
      list.refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update invoice");
    }
  };

  const columns = [
    { label: "Invoice No", render: (i) => <Typography fontWeight={600}>{i.invoiceNo}</Typography> },
    { label: "Customer", render: (i) => i.customer?.name || "-" },
    { label: "Order", render: (i) => i.salesOrder?.orderNo || "-" },
    { label: "Total", align: "right", render: (i) => money(i.total) },
    { label: "Status", render: (i) => <StatusChip status={i.status} /> },
    { label: "Date", render: (i) => shortDate(i.createdAt) },
    {
      label: "Actions",
      align: "center",
      render: (i) => (
        <>
          <Tooltip title="View"><IconButton size="small" onClick={() => openView(i)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Download PDF"><IconButton size="small" color="primary" onClick={() => downloadPdf(i)}><PictureAsPdfIcon fontSize="small" /></IconButton></Tooltip>
          {i.status === "unpaid" && (
            <Tooltip title="Mark as paid"><IconButton size="small" color="success" onClick={() => markPaid(i)}><CheckCircleIcon fontSize="small" /></IconButton></Tooltip>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Bills created from your sales orders"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
            New Invoice
          </Button>
        }
      />
      <SearchBar value={list.search} onChange={list.onSearch} placeholder="Search by invoice number">
        <TextField
          select size="small" label="Status" value={status} sx={{ minWidth: 160 }}
          onChange={(e) => {
            setStatus(e.target.value);
            list.setPage(0);
          }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="unpaid">Unpaid</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
        </TextField>
      </SearchBar>
      <DataTable columns={columns} rows={list.items} list={list} emptyText="No invoices yet" />

      {creating && (
        <InvoiceDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            list.refresh();
          }}
        />
      )}
      {viewing && <ViewDialog invoice={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function InvoiceDialog({ onClose, onSaved }) {
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [taxRate, setTaxRate] = useState(18);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/sales-orders", { params: { status: "confirmed,shipped,delivered", invoiced: "false", limit: 100 } })
      .then((r) => setOrders(r.data.items));
  }, []);

  const order = orders.find((o) => o._id === orderId);
  const taxAmount = order ? (order.totalPrice * Number(taxRate || 0)) / 100 : 0;

  const submit = async () => {
    setSaving(true);
    try {
      await api.post("/invoices", { salesOrder: orderId, taxRate: Number(taxRate), dueDate: dueDate || undefined });
      toast.success("Invoice created");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create invoice");
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>New Invoice</DialogTitle>
      <DialogContent>
        {orders.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No sales orders are ready for invoicing. Confirm a sales order first.
          </Alert>
        )}
        <TextField
          select fullWidth margin="dense" label="Sales Order" value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        >
          {orders.map((o) => (
            <MenuItem key={o._id} value={o._id}>
              {o.orderNo} - {o.customer?.name} ({money(o.totalPrice)})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth margin="dense" type="number" label="Tax rate (%)" value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)} slotProps={{ htmlInput: { min: 0, max: 100 } }}
        />
        <TextField
          fullWidth margin="dense" type="date" label="Due date (optional)" value={dueDate}
          onChange={(e) => setDueDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
        />
        {order && (
          <Box sx={{ mt: 2 }}>
            <Typography>Subtotal: {money(order.totalPrice)}</Typography>
            <Typography>Tax: {money(taxAmount)}</Typography>
            <Typography variant="h6">Total: {money(order.totalPrice + taxAmount)}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!orderId || saving}>
          {saving ? "Creating..." : "Create Invoice"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ViewDialog({ invoice, onClose }) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {invoice.invoiceNo}
        <StatusChip status={invoice.status} />
      </DialogTitle>
      <DialogContent>
        <Typography><b>{invoice.customer?.name}</b></Typography>
        <Typography color="text.secondary">{invoice.customer?.address}</Typography>
        <Typography color="text.secondary">
          Order {invoice.salesOrder?.orderNo} | {shortDate(invoice.createdAt)}
          {invoice.dueDate && ` | Due ${shortDate(invoice.dueDate)}`}
        </Typography>
        <Box sx={{ overflowX: "auto", mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.title}</TableCell>
                  <TableCell align="right">{i.quantity}</TableCell>
                  <TableCell align="right">{money(i.price)}</TableCell>
                  <TableCell align="right">{money(i.quantity * i.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography align="right">Subtotal: {money(invoice.subtotal)}</Typography>
        <Typography align="right">Tax ({invoice.taxRate}%): {money(invoice.taxAmount)}</Typography>
        <Typography align="right" variant="h6">Total: {money(invoice.total)}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={() => downloadInvoicePdf(invoice)}>
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
