import { useState } from "react";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import api from "../api/axios";
import useList from "../hooks/useList";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";

// Customers aur Suppliers ka ek hi page, bas title aur url alag
export default function Directory({ title, singular, url }) {
  const { user } = useSelector((state) => state.auth);
  const canDelete = user?.role === "admin";
  const list = useList(url);
  const [editing, setEditing] = useState(undefined); // undefined = band, null = naya, object = edit

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    try {
      await api.delete(`${url}/${row._id}`);
      toast.success(`${singular} deleted`);
      list.refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const columns = [
    { label: "Name", render: (r) => <Typography fontWeight={600}>{r.name}</Typography> },
    { label: "Phone", render: (r) => r.contact || "-" },
    { label: "Email", render: (r) => r.email || "-" },
    { label: "Address", render: (r) => r.address || "-" },
    {
      label: "Actions",
      align: "center",
      render: (r) => (
        <>
          <IconButton size="small" onClick={() => setEditing(r)}><EditIcon fontSize="small" /></IconButton>
          {canDelete && (
            <IconButton size="small" color="error" onClick={() => handleDelete(r)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={title}
        subtitle={`Manage your ${title.toLowerCase()}`}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(null)}>
            Add {singular}
          </Button>
        }
      />
      <SearchBar value={list.search} onChange={list.onSearch} placeholder="Search by name, phone or email" />
      <DataTable columns={columns} rows={list.items} list={list} emptyText={`No ${title.toLowerCase()} found`} />

      {editing !== undefined && (
        <DirectoryDialog
          singular={singular}
          url={url}
          row={editing}
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

function DirectoryDialog({ singular, url, row, onClose, onSaved }) {
  const isEdit = Boolean(row);

  const formik = useFormik({
    initialValues: {
      name: row?.name || "",
      contact: row?.contact || "",
      email: row?.email || "",
      address: row?.address || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string().email("Invalid email"),
      contact: Yup.string().matches(/^[0-9+\-\s]*$/, "Only numbers, + and - allowed"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (isEdit) await api.put(`${url}/${row._id}`, values);
        else await api.post(url, values);
        toast.success(`${singular} ${isEdit ? "updated" : "added"}`);
        onSaved();
      } catch (err) {
        toast.error(err.response?.data?.message || "Save failed");
        setSubmitting(false);
      }
    },
  });

  const field = (name, label, extra = {}) => (
    <TextField
      fullWidth
      margin="dense"
      label={label}
      name={name}
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      {...extra}
    />
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{isEdit ? `Edit ${singular}` : `Add ${singular}`}</DialogTitle>
        <DialogContent>
          {field("name", "Name")}
          {field("contact", "Phone")}
          {field("email", "Email")}
          {field("address", "Address", { multiline: true, rows: 2 })}
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
