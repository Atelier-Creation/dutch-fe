// CustomerBillCopy.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Table, Typography, Divider, message } from "antd";
import dayjs from "dayjs";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import companyLogo from "../../components/assets/Company_logo.png"; // ✅ update path

const { Title, Text } = Typography;

// ✅ Attach fonts once (prevents vfs undefined error)
if (pdfFonts && pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else {
  pdfMake.vfs = pdfFonts.vfs; // fallback (for some builds)
}

const CustomerBillCopy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { billing } = location.state || {};

  if (!billing) {
    return (
      <div style={{ padding: 12 }}>
        <Text>No billing data found.</Text>
        <Button
          type="primary"
          onClick={() => navigate(-1)}
          style={{ marginTop: 12, fontSize: 12 }}
        >
          Back
        </Button>
      </div>
    );
  }

  // ✅ Calculations
  const subtotal = billing.items.reduce(
    (sum, i) => sum + Number(i.unit_price || 0) * Number(i.quantity || 0),
    0
  );
  const totalTax = billing.items.reduce(
    (sum, i) => sum + Number(i.tax_amount || 0),
    0
  );
  const grandTotal = subtotal + totalTax;

  // 📌 PDF Generator with pdfmake
  const generatePDF = async () => {
  const getBase64Image = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
    });

  const logoBase64 = await getBase64Image(companyLogo);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      // HEADER
      {
        columns: [
          { image: logoBase64, width: 80 },
          [
            { text: "Atelier Creations Pvt Ltd", style: "companyName" },
            { text: "123 Main Street, City, State - 600001", style: "companyInfo" },
            { text: "Phone: +91 98765 43210 | Email: info@atelier.com", style: "companyInfo" },
            { text: "GSTIN: 33ABCDE1234F1Z5", style: "companyInfo" },
          ],
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },

      // INVOICE TITLE
      { text: "TAX INVOICE", style: "invoiceTitle" },

      // CUSTOMER & BILL INFO
      {
        columns: [
          [
            { text: `Invoice No: INV-${billing.id || "001"}`, style: "billInfo" },
            { text: `Date: ${dayjs(billing.billing_date).format("DD-MM-YYYY")}`, style: "billInfo" },
            { text: `Status: ${billing.status}`, style: "billInfo" },
          ],
          [
            { text: "Bill To:", style: "billToTitle" },
            { text: billing.customer_name, style: "billToName" },
            billing.customer_address && { text: billing.customer_address, style: "billToInfo" },
            billing.customer_phone && { text: `Phone: ${billing.customer_phone}`, style: "billToInfo" },
          ],
        ],
        columnGap: 20,
        margin: [0, 15, 0, 15],
      },

      // ITEMS TABLE
      {
        table: {
          headerRows: 1,
          widths: ["auto", "*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "S.no", style: "tableHeader" },
              { text: "Product", style: "tableHeader" },
              { text: "Qty", style: "tableHeader" },
              { text: "Unit Price", style: "tableHeader" },
              { text: "Tax %", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...billing.items.map((item, i) => [
              { text: i + 1, style: "tableData" },
              { text: item.product_name, style: "tableData" },
              { text: item.quantity, style: "tableData", alignment: "center" },
              { text: `₹${Number(item.unit_price || 0).toFixed(2)}`, style: "tableData", alignment: "right" },
              { text: `${Number(item.tax_percentage || 0).toFixed(2)}%`, style: "tableData", alignment: "right" },
              { text: `₹${Number(item.total_price || 0).toFixed(2)}`, style: "tableData", alignment: "right" },
            ]),
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#eeeeee" : rowIndex % 2 === 0 ? "#f9f9f9" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
        },
      },

      // TOTALS
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            table: {
              body: [
                [{ text: "Subtotal", alignment: "left" }, { text: `₹${subtotal.toFixed(2)}`, alignment: "right" }],
                [{ text: "Total Tax", alignment: "left" }, { text: `₹${totalTax.toFixed(2)}`, alignment: "right" }],
                [{ text: "Grand Total", bold: true, alignment: "left" }, { text: `₹${grandTotal.toFixed(2)}`, bold: true, alignment: "right" }],
              ],
            },
            layout: "noBorders",
            margin: [0, 10, 0, 20],
          },
        ],
      },

      // FOOTER
      { text: "Thank you for your business!", style: "footer", margin: [0, 0, 0, 5] },
      { text: "Authorized Signatory", style: "footerSign", alignment: "right" },
    ],
    styles: {
      companyName: { fontSize: 16, bold: true },
      companyInfo: { fontSize: 10 },
      invoiceTitle: { fontSize: 14, bold: true, alignment: "center", margin: [0, 15, 0, 15] },
      billInfo: { fontSize: 10 },
      billToTitle: { fontSize: 10, bold: true },
      billToName: { fontSize: 12, bold: true },
      billToInfo: { fontSize: 10 },
      tableHeader: { bold: true, fontSize: 10, fillColor: "#eeeeee" },
      tableData: { fontSize: 10 },
      footer: { italics: true, fontSize: 9 },
      footerSign: { fontSize: 10 },
    },
  };

  pdfMake.createPdf(docDefinition).download(`Invoice_${billing.customer_name}_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
  message.success("PDF Downloaded!");
};


  return (
    <div
      style={{
        padding: 12,
        maxWidth: 360,
        margin: "0 auto",
        background: "#fff",
        fontSize: 12,
      }}
    >
      <Title
        level={4}
        style={{ textAlign: "center", fontSize: 14, marginBottom: 8 }}
      >
        Customer Billing Copy
      </Title>
      <Divider style={{ margin: "4px 0" }} />

      <div style={{ fontSize: 12, lineHeight: 1.2 }}>
        <Text strong>Customer: </Text>
        {billing.customer_name} <br />
        <Text strong>Date: </Text>
        {dayjs(billing.billing_date).format("DD-MM-YYYY")} <br />
        <Text strong>Status: </Text>
        {billing.status} <br />
        {billing.remarks && (
          <>
            <Text strong>Remarks: </Text>
            {billing.remarks} <br />
          </>
        )}
      </div>

      <Divider style={{ margin: "4px 0" }} />

      <div style={{ overflowX: "auto" }}>
        <Table
          dataSource={billing.items}
          columns={[
            { title: "Name", dataIndex: "product_name" },
            { title: "Qty", dataIndex: "quantity" },
            {
              title: "Unit",
              dataIndex: "unit_price",
              render: (v) => `₹${Number(v || 0).toFixed(2)}`,
            },
            {
              title: "Tax %",
              dataIndex: "tax_percentage",
              render: (v) => `${Number(v || 0).toFixed(2)}%`,
            },
            {
              title: "Total",
              dataIndex: "total_price",
              render: (v) => `₹${Number(v || 0).toFixed(2)}`,
            },
          ]}
          pagination={false}
          rowKey={(r, idx) => idx}
          size="small"
          bordered
          style={{ fontSize: 11 }}
        />
      </div>

      <Divider style={{ margin: "4px 0" }} />

      <div style={{ textAlign: "right", fontSize: 12, lineHeight: 1.2 }}>
        <Text strong>Subtotal: </Text>₹{subtotal.toFixed(2)} <br />
        <Text strong>Total Tax: </Text>₹{totalTax.toFixed(2)} <br />
        <Text strong>Grand Total: </Text>₹{grandTotal.toFixed(2)}
      </div>

      <Divider style={{ margin: "4px 0" }} />

      <Button
        type="primary"
        block
        onClick={() => window.print()}
        style={{ fontSize: 12, padding: "4px 0" }}
      >
        Print / Save
      </Button>

      <Button
        type="dashed"
        block
        style={{ marginTop: 4, fontSize: 12, padding: "4px 0" }}
        onClick={generatePDF}
      >
        Download PDF
      </Button>

      <Button
        type="default"
        block
        style={{ marginTop: 4, fontSize: 12, padding: "4px 0" }}
        onClick={() => navigate(-1)}
      >
        Back
      </Button>
    </div>
  );
};

export default CustomerBillCopy;
