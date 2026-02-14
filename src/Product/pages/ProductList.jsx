import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button, Space, Popconfirm, Tag, message, Dropdown } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, MoreOutlined } from "@ant-design/icons";
import productService from "../services/productService.js";
import debounce from "lodash.debounce";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";

const { Search } = Input;

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState("");
  const [sorter, setSorter] = useState({ field: null, order: null });

  const qrRefs = useRef({});

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await productService.getAll({
        page: params.current || pagination.current,
        limit: params.pageSize || pagination.pageSize,
        search: params.search || searchText,
        sortField: params.sortField || sorter.field,
        sortOrder: params.sortOrder || sorter.order,
      });

      // Backend returns: { total, page, limit, data: [...] }
      // Axios returns this in response.data
      const result = response.data;
      
      setProducts(Array.isArray(result.data) ? result.data : []);
      setPagination((prev) => ({
        ...prev,
        current: result.page || 1,
        total: result.total || 0,
        pageSize: result.limit || 10,
      }));
    } catch (err) {
      console.error('Fetch products error:', err);
      message.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, sorter]);

  const handleSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSearchText(value);
  }, 500);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleTableChange = (pag, filters, sort) => {
    setPagination(pag);
    setSorter({
      field: sort.field,
      order: sort.order === "ascend" ? "asc" : sort.order === "descend" ? "desc" : null,
    });
  };

  const handleDelete = async (id) => {
    try {
      await productService.remove(id);
      message.success("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      console.error(err);
      message.error("Failed to delete product");
    }
  };

  const downloadQR = (id, code) => {
    const canvas = qrRefs.current[id]?.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL();
      link.download = `${code}.png`;
      link.click();
    }
  };

  const downloadAllQRPDF = () => {
    const pdf = new jsPDF();
    let x = 10;
    let y = 10;
    const size = 40;

    products.forEach((product) => {
      const canvas = qrRefs.current[product.id]?.querySelector("canvas");
      if (canvas) {
        const imgData = canvas.toDataURL("image/png");
        pdf.text(product.product_code, x, y - 2);
        pdf.addImage(imgData, "PNG", x, y, size, size);

        x += size + 20;
        if (x + size > 200) {
          x = 10;
          y += size + 20;
        }
      }
    });

    pdf.save("product_qrcodes.pdf");
  };

  const columns = [
    { title: "Name", dataIndex: "product_name", key: "product_name", sorter: true, responsive: ["xs", "sm", "md"] },
    { title: "Code", dataIndex: "product_code", key: "product_code", responsive: ["md"] },
    {
      title: "QR Code",
      key: "qr_code",
      responsive: ["lg"],
      render: (_, record) => (
        <div ref={(el) => (qrRefs.current[record.id] = el)} style={{ display: "flex", alignItems: "center" }}>
          <QRCodeCanvas value={record.product_code || ""} size={64} level="H" />
          <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadQR(record.id, record.product_code)} style={{ marginLeft: 8 }}>
            Download
          </Button>
        </div>
      ),
    },
    { title: "Brand", dataIndex: "brand", key: "brand", responsive: ["lg"] },
    { title: "Category", dataIndex: "category_name", key: "category", responsive: ["lg"] },
    { title: "Price", dataIndex: "purchase_price", key: "price", sorter: true, responsive: ["xl"], render: (price) => `₹${price}` },
    { title: "Selling Price", dataIndex: "selling_price", key: "selling_price", sorter: true, responsive: ["xl"], render: (price) => `₹${price}` },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      render: (_, record) => {
        const menuItems = [
          { key: "brand", label: `Brand: ${record.brand}` },
          { key: "category", label: `Category: ${record.category_name}` },
          { key: "price", label: `Price: ₹${record.purchase_price}` },
          { key: "selling_price", label: `Selling Price: ₹${record.selling_price}` },
        ];

        return (
          <Space>
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/Product/edit/${record.id}`)}>
              Edit
            </Button>
            <Popconfirm title="Are you sure to delete this product?" onConfirm={() => handleDelete(record.id)}>
              <Button danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-4">
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Search
          placeholder="Search products..."
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          enterButton
          allowClear
          style={{ width: 300 }}
        />
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/Product/add")}>
            Add Product
          </Button>
          <Button type="default" icon={<DownloadOutlined />} onClick={downloadAllQRPDF}>
            Download All QR PDF
          </Button>
        </Space>
      </Space>

      <Table
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={products}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        bordered
        scroll={{ x: true }}
      />
    </div>
  );
};

export default ProductList;
