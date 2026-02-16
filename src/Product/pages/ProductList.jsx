import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Table, Input, Button, Space, Popconfirm, Tag, message, Dropdown } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, MoreOutlined } from "@ant-design/icons";
import productService from "../services/productService.js";
import debounce from "lodash.debounce";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";

const { Search } = Input;

const ProductList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // separate input visual state from api query state
  const [inputValue, setInputValue] = useState("");
  // Use ref for search query to ensure fresh access in callbacks without dependency
  const searchRef = useRef("");

  const [sorter, setSorter] = useState({ field: null, order: null });

  const qrRefs = useRef({});

  // Sync state with URL only
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get("search") || "";
    setInputValue(s);
    searchRef.current = s;
    // Explicitly fetch when URL changes
    fetchProducts({ search: s, current: 1 });
  }, [location.search]);

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      // Use param if provided, otherwise fallback to ref
      const currentSearch = params.search !== undefined ? params.search : searchRef.current;

      const queryParams = {
        page: params.current || pagination.current,
        limit: params.pageSize || pagination.pageSize,
        search: currentSearch,
        sortField: params.sortField || sorter.field,
        sortOrder: params.sortOrder || sorter.order,
      };

      console.log('Fetching products with params:', queryParams);

      const response = await productService.getAll(queryParams);

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
  }, [pagination.current, pagination.pageSize, sorter]);

  // Initial fetch on mount if no URL param (or handle by URL effect if empty string counts as param change?)
  // The URL effect runs on mount with "" if no param. So it handles initial fetch.
  // We DO NOT need a generic useEffect calling fetchProducts() now.

  const debouncedSearch = useCallback(
    debounce((value) => {
      searchRef.current = value;
      setPagination((prev) => ({ ...prev, current: 1 }));
      fetchProducts({ search: value, current: 1 });
    }, 500),
    [fetchProducts]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    debouncedSearch(val);
  };

  const handleTableChange = (pag, filters, sort) => {
    setPagination(pag);
    setSorter({
      field: sort.field,
      order: sort.order === "ascend" ? "asc" : sort.order === "descend" ? "desc" : null,
    });
    // Explicit fetch on table change
    // Note: State updates (setPagination, setSorter) are async. 
    // We should pass the NEW values to fetchProducts to be safe.
    fetchProducts({
      current: pag.current,
      pageSize: pag.pageSize,
      sortField: sort.field,
      sortOrder: sort.order === "ascend" ? "asc" : sort.order === "descend" ? "desc" : null
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
          value={inputValue}
          onSearch={(v) => {
            setSearchQuery(v);
            setPagination(prev => ({ ...prev, current: 1 }));
          }}
          onChange={handleInputChange}
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
