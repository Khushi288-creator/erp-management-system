import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Avatar, Box, MenuItem, Select, Typography, FormControl, InputLabel } from "@mui/material";
import api from "../api/axios";
import useList from "../hooks/useList";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import { shortDate } from "../utils/format";

const ROLES = ["admin", "sales", "purchase", "inventory"];

export default function Admin() {
  const { user: me } = useSelector((state) => state.auth);
  const [role, setRole] = useState("");
  const list = useList("/users", { role: role || undefined });

  const changeRole = async (row, newRole) => {
    try {
      await api.put(`/users/${row._id}/role`, { role: newRole });
      toast.success(`${row.name} is now ${newRole}`);
      list.refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change role");
    }
  };

  const columns = [
    {
      label: "User",
      render: (u) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>{u.name?.[0]?.toUpperCase()}</Avatar>
          <Typography fontWeight={600}>{u.name}</Typography>
        </Box>
      ),
    },
    { label: "Email", render: (u) => u.email },
    { label: "Joined", render: (u) => shortDate(u.createdAt) },
    {
      label: "Role",
      render: (u) => (
        <Select
          size="small"
          value={u.role}
          disabled={u._id === me?._id}
          onChange={(e) => changeRole(u, e.target.value)}
          sx={{ minWidth: 130, textTransform: "capitalize" }}
        >
          {ROLES.map((r) => (
            <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>{r}</MenuItem>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="User Management" subtitle="Control who can do what in the system" />
      <SearchBar value={list.search} onChange={list.onSearch} placeholder="Search by name or email">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            label="Role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              list.setPage(0);
            }}
          >
            <MenuItem value="">All roles</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>{r}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </SearchBar>
      <DataTable columns={columns} rows={list.items} list={list} emptyText="No users found" />
    </>
  );
}
