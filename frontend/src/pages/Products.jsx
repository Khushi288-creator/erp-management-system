import { useState } from "react";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  Button, TextField, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, FormControlLabel, Switch, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import api from "../api/axios";
import useList from "../hooks/useList";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import { money } from "../utils/format";

export default function Products() {
  const { user } = useSelector((state) => state.auth);
  const canEdit = ["admin", "inventory"].includes(user?.role);
  const canDelete = user?.role === "admin";

  const [lowStock, setLowStock] = useState(false);
  const list = useList("/products", { lowStock: lowStock ? "true" : undefined });
  const [editing, setEditing] = useState(undefined); // undefined = band, null = naya, object = edit

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.title}"?`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      toast.success("Product deleted");
      list.refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const columns = [
    { label: "Title", render: (p) => <Typography fontWeight={600}>{p.title}</Typography> },
    { label: "SKU", render: (p) => p.sku },
    { label: "Price", align: "right", render: (p) => money(p.price) },
    {
      label: "Stock",
      align: "right",
      render: (p) =>
        p.stock <= p.reorderLevel ? <Chip label={p.stock} color="error" size="small" /> : p.stock,
    },
    { label: "Reorder Level", align: "right", render: (p) => p.reorderLevel },
  ];

  if (canEdit) {
    columns.push({
      label: "Actions",
      align: "center",
      render: (p) => (
        <>
          <IconButton size="small" onClick={() => setEditing(p)}><EditIcon fontSize="small" /></IconButton>
          {canDelete && (
            <IconButton size="small" color="error" onClick={() => handleDelete(p)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </>
      ),
    });
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Your catalogue and stock levels"
        action={
          canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(null)}>
              Add Product
            </Button>
          )
        }
      />
      <SearchBar value={list.search} onChange={list.onSearch} placeholder="Search by title or SKU">
        <FormControlLabel
          control={
            <Switch
              checked={lowStock}
              onChange={(e) => {
                setLowStock(e.target.checked);
                list.setPage(0);
              }}
            />
          }
          label="Low stock only"
        />
      </SearchBar>
      <DataTable columns={columns} rows={list.items} list={list} emptyText="No products found" />

      {editing !== undefined && (
        <ProductDialog
          product={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            list.refresh();
          }}
        />
      )}
    </>
  );
}

// Add aur Edit dono ke liye ek hi form
function ProductDialog({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);

  const formik = useFormik({
    initialValues: {
      title: product?.title || "",
      sku: product?.sku || "",
      price: product?.price ?? "",
      stock: product?.stock ?? 0,
      reorderLevel: product?.reorderLevel ?? 10,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Title is required"),
      sku: Yup.string().required("SKU is required"),
      price: Yup.number().typeError("Enter a number").min(0, "Cannot be negative").required("Price is required"),
      stock: Yup.number().typeError("Enter a number").min(0, "Cannot be negative").required("Stock is required"),
      reorderLevel: Yup.number().typeError("Enter a number").min(0, "Cannot be negative").required("Required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (isEdit) {
          await api.put(`/products/${product._id}`, values);
          toast.success("Product updated");
        } else {
          await api.post("/products", values);
          toast.success("Product added");
        }
        onSaved();
      } catch (err) {
        toast.error(err.response?.data?.message || "Save failed");
        setSubmitting(false);
      }
    },
  });

  const field = (name, label, type = "text") => (
    <TextField
      fullWidth
      margin="dense"
      label={label}
      name={name}
      type={type}
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
    />
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogContent>
          {field("title", "Title")}
          {field("sku", "SKU")}
          {field("price", "Price", "number")}
          {field("stock", "Stock", "number")}
          {field("reorderLevel", "Reorder Level", "number")}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
            {isEdit ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
