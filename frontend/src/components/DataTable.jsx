import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  TablePagination, LinearProgress, Typography, Box,
} from "@mui/material";

// columns = [{ label, align, render: (row) => ... }]
export default function DataTable({ columns, rows, list, emptyText = "No records found" }) {
  return (
    <Paper sx={{ overflow: "hidden" }}>
      {list.loading && <LinearProgress />}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.label} align={c.align}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id} hover>
                {columns.map((c) => (
                  <TableCell key={c.label} align={c.align}>{c.render(row)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!list.loading && rows.length === 0 && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography color="text.secondary">{emptyText}</Typography>
          </Box>
        )}
      </TableContainer>
      <TablePagination
        component="div"
        count={list.total}
        page={list.page}
        onPageChange={(e, p) => list.setPage(p)}
        rowsPerPage={list.rowsPerPage}
        onRowsPerPageChange={(e) => list.setRowsPerPage(Number(e.target.value))}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
}
