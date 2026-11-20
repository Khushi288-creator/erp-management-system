import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import api from "../api/axios";
import useList from "../hooks/useList";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatusChip, { prettyStatus } from "../components/StatusChip";
import { money, shortDate } from "../utils/format";

// Sales Orders aur Purchase Orders dono isi ek page se chalte hain.
// Farak sirf `config` me hai (url, party, statuses, roles)
export default function OrdersPage({ config }) {
  const { user } = useSelector((state) => state.auth);
  const canWrite = config.writeRoles.includes(user?.role);

  const [status, setStatus] = useState("");
  const list = useList(config.url, { status: status || undefined });
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);

  const changeStatus = async (order, newStatus) => {
    if (newStatus === "cancelled" && !window.confirm(`Cancel ${order.orderNo}?`)) return;
    try {
      await api.put(`${config.url}/${order._id}/status`, { status: newStatus });
      toast.success(`${order.orderNo} is now ${prettyStatus(newStatus).toLowerCase()}`);
      list.refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update status");
    }
  };

  const columns = [
    { label: "Order No", render: (o) => <Typography fontWeight={600}>{o.orderNo}</Typography> },
    { label: config.partyLabel, render: (o) => o[config.partyKey]?.name || "-" },
    { label: "Items", align: "right", render: (o) => o.items.length },
    { label: "Total", align: "right", render: (o) => money(o.totalPrice) },
    { label: "Status", render: (o) => <StatusChip status={o.status} /> },
    { label: "Date", render: (o) => shortDate(o.createdAt) },
    {
      label: "Actions",
      align: "center",
      render: (o) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, flexWrap: "wrap" }}>
          <IconButton size="small" onClick={() => setViewing(o)}><VisibilityIcon fontSize="small" /></IconButton>
          {canWrite &&
            (config.next[o.status] || []).map((s) => (
              <Button
                key={s}
                size="small"
                variant="outlined"
                color={s === "cancelled" ? "error" : "primary"}
                onClick={() => changeStatus(o, s)}
              >
                {config.actionLabel[s]}
              </Button>
            ))}
        </Box>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        action={
          canWrite && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
              New {config.singular}
            </Button>
          )
        }
      />
      <SearchBar value={list.search} onChange={list.onSearch} placeholder="Search by order number">
        <TextField
          select size="small" label="Status" value={status} sx={{ minWidth: 180 }}
          onChange={(e) => {
            setStatus(e.target.value);
            list.setPage(0);
          }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {config.statuses.map((s) => (
            <MenuItem key={s} value={s}>{prettyStatus(s)}</MenuItem>
          ))}
        </TextField>
      </SearchBar>
      <DataTable columns={columns} rows={list.items} list={list} emptyText={`No ${config.title.toLowerCase()} found`} />

      {creating && (
        <OrderDialog
          config={config}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            list.refresh();
          }}
        />
      )}
      {viewing && <ViewDialog config={config} order={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function ViewDialog({ config, order, onClose }) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {order.orderNo}
        <StatusChip status={order.status} />
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          {config.partyLabel}: <b>{order[config.partyKey]?.name}</b> | {shortDate(order.createdAt)}
        </Typography>
        <Box sx={{ overflowX: "auto", mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Amount</TableCell>
                {config.showReceived && <TableCell align="right">Received</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items.map((i) => (
                <TableRow key={i.product}>
                  <TableCell>{i.title} <Typography component="span" variant="caption" color="text.secondary">({i.sku})</Typography></TableCell>
                  <TableCell align="right">{i.quantity}</TableCell>
                  <TableCell align="right">{money(i.price)}</TableCell>
                  <TableCell align="right">{money(i.quantity * i.price)}</TableCell>
                  {config.showReceived && <TableCell align="right">{i.receivedQty}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography align="right" variant="h6">Total: {money(order.totalPrice)}</Typography>
        {order.notes && <Typography color="text.secondary">Notes: {order.notes}</Typography>}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function OrderDialog({ config, onClose, onSaved }) {
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [party, setParty] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([{ product: "", quantity: 1, price: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(config.partyUrl, { params: { limit: 100 } }).then((r) => setParties(r.data.items));
    api.get("/products", { params: { limit: 100 } }).then((r) => setProducts(r.data.products));
  }, [config.partyUrl]);

  const updateLine = (index, changes) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...changes } : l)));

  const pickProduct = (index, productId) => {
    const p = products.find((x) => x._id === productId);
    updateLine(index, { product: productId, price: p ? p.price : 0 });
  };

  const total = lines.reduce((sum, l) => sum + Number(l.quantity || 0) * Number(l.price || 0), 0);

  const submit = async () => {
    if (!party) return toast.error(`Please select a ${config.partyLabel.toLowerCase()}`);
    if (lines.some((l) => !l.product || Number(l.quantity) < 1)) {
      return toast.error("Select a product and a quantity of at least 1 in every row");
    }
    setSaving(true);
    try {
      await api.post(config.url, {
        [config.partyKey]: party,
        notes,
        items: lines.map((l) => ({ product: l.product, quantity: Number(l.quantity), price: Number(l.price) })),
      });
      toast.success(`${config.singular} created`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create order");
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>New {config.singular}</DialogTitle>
      <DialogContent>
        <TextField
          select fullWidth margin="dense" label={config.partyLabel} value={party}
          onChange={(e) => setParty(e.target.value)}
        >
          {parties.map((p) => (
            <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
          ))}
        </TextField>

        <Typography fontWeight={700} sx={{ mt: 2, mb: 1 }}>Products</Typography>
        {lines.map((l, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              select size="small" label="Product" value={l.product}
              onChange={(e) => pickProduct(i, e.target.value)}
              sx={{ flex: "2 1 220px" }}
            >
              {products.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.title} ({p.sku}) - stock {p.stock}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small" type="number" label="Qty" value={l.quantity}
              onChange={(e) => updateLine(i, { quantity: e.target.value })}
              slotProps={{ htmlInput: { min: 1 } }} sx={{ flex: "1 1 80px" }}
            />
            <TextField
              size="small" type="number" label="Unit price" value={l.price}
              onChange={(e) => updateLine(i, { price: e.target.value })}
              disabled={!config.editablePrice} sx={{ flex: "1 1 110px" }}
            />
            <Typography sx={{ flex: "1 1 100px" }} align="right" fontWeight={600}>
              {money(Number(l.quantity || 0) * Number(l.price || 0))}
            </Typography>
            <IconButton
              color="error" disabled={lines.length === 1}
              onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button size="small" startIcon={<AddIcon />} onClick={() => setLines((p) => [...p, { product: "", quantity: 1, price: 0 }])}>
          Add another product
        </Button>

        <TextField
          fullWidth margin="normal" label="Notes (optional)" value={notes}
          onChange={(e) => setNotes(e.target.value)} multiline rows={2}
        />
        <Typography align="right" variant="h6">Total: {money(total)}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          {saving ? "Saving..." : `Create ${config.singular}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
