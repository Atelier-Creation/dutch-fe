import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, Popconfirm, message, Input } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import categoryService from "../services/categoryService.js";
import debounce from "lodash.debounce";

const { Search } = Input;

const CategoryList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState("");

  const fetchCategories = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await categoryService.getAll({
        page: params.current || pagination.current,
        limit: params.pageSize || pagination.pageSize,
        search: params.search || searchText,
      });
      
      // Backend returns: { total, page, limit, data: [...] }
      // Axios returns this in response.data
      const result = response.data;
      
      setCategories(Array.isArray(result.data) ? result.data : []);
      setPagination((prev) => ({
        ...prev,
        current: result.page || 1,
        total: result.total || 0,
        pageSize: result.limit || 10,
      }));
    } catch (err) {
      console.error('Fetch categories error:', err);
      message.error("Failed to fetch categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText]);

  const handleSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSearchText(value);
  }, 500);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (id) => {
    try {
      await categoryService.remove(id);
      message.success("Category deleted successfully");
      fetchCategories();
    } catch (err) {
      console.error(err);
      message.error("Failed to delete category");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "category_name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/Product/categories/edit/${record.id}`)}>
            Edit
          </Button>
          <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Search
          placeholder="Search categories..."
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          enterButton
          allowClear
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/Product/categories/add")}>
          Add Category
        </Button>
      </Space>

      <Table
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={categories}
        pagination={pagination}
        loading={loading}
        onChange={(pag) => setPagination(pag)}
        bordered
      />
    </div>
  );
};

export default CategoryList;
