import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// jsPDF ke default font me ₹ symbol nahi hota, isliye PDF me "Rs." likha hai
const rs = (n) => `Rs. ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function downloadInvoicePdf(invoice) {
  const doc = new jsPDF();

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("INVOICE", 14, 20);
  doc.setFontSize(11);
  doc.text(invoice.invoiceNo, 196, 14, { align: "right" });
  doc.text(`Date: ${date(invoice.createdAt)}`, 196, 21, { align: "right" });
  if (invoice.dueDate) doc.text(`Due: ${date(invoice.dueDate)}`, 196, 28, { align: "right" });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Bill To", 14, 46);
  doc.setFont(undefined, "normal");
  const customer = invoice.customer || {};
  const lines = [customer.name, customer.address, customer.contact, customer.email].filter(Boolean);
  doc.text(lines, 14, 53);

  doc.text(`Order: ${invoice.salesOrder?.orderNo || "-"}`, 196, 46, { align: "right" });
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 196, 53, { align: "right" });

  autoTable(doc, {
    startY: 78,
    head: [["#", "Product", "SKU", "Qty", "Price", "Amount"]],
    body: invoice.items.map((i, idx) => [
      idx + 1, i.title, i.sku || "-", i.quantity, rs(i.price), rs(i.quantity * i.price),
    ]),
    headStyles: { fillColor: [79, 70, 229] },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });

  let y = doc.lastAutoTable.finalY + 10;
  doc.text("Subtotal:", 140, y);
  doc.text(rs(invoice.subtotal), 196, y, { align: "right" });
  y += 7;
  doc.text(`Tax (${invoice.taxRate}%):`, 140, y);
  doc.text(rs(invoice.taxAmount), 196, y, { align: "right" });
  y += 9;
  doc.setFont(undefined, "bold");
  doc.setFontSize(13);
  doc.text("Total:", 140, y);
  doc.text(rs(invoice.total), 196, y, { align: "right" });

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Thank you for your business.", 105, 285, { align: "center" });

  doc.save(`${invoice.invoiceNo}.pdf`);
}
