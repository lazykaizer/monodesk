const { jsPDF } = require("jspdf");

const doc = new jsPDF();

doc.setFontSize(22);
doc.text("Tech Cafe", 20, 20);
doc.setFontSize(12);
doc.text("123 Innovation Dr, Tech City, CA 94000", 20, 28);
doc.text("Date: 2024-06-15", 20, 36);

doc.setLineWidth(0.5);
doc.line(20, 42, 190, 42);

doc.text("Item", 20, 50);
doc.text("Price", 160, 50, { align: "right" });

doc.text("Server Hosting (AWS)", 20, 60);
doc.text("$50.00", 160, 60, { align: "right" });

doc.text("Domain Renewal", 20, 70);
doc.text("$15.00", 160, 70, { align: "right" });

doc.text("Cloud Storage Upgrade", 20, 80);
doc.text("$10.50", 160, 80, { align: "right" });

doc.line(20, 90, 190, 90);

doc.setFontSize(14);
doc.setFont("helvetica", "bold");
doc.text("TOTAL", 20, 100);
doc.text("$75.50", 160, 100, { align: "right" });

doc.setFontSize(10);
doc.setFont("helvetica", "normal");
doc.text("Thank you for your business!", 105, 120, { align: "center" });

doc.save("test_receipt.pdf");
console.log("Receipt generated: test_receipt.pdf");
