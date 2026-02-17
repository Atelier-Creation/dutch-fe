import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, Popconfirm, message, Input, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";
import customerService from "../service/customerService";

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerService.getAllCustomers();
      setCustomers(response.data.data || []);
    } catch (error) {
      message.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await customerService.deleteCustomer(id);
      messageApi.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      messageApi.error("Failed to delete customer");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "customer_name",
      key: "customer_name",
      filteredValue: [searchText],
      onFilter: (value, record) =>
        record.customer_name?.toLowerCase().includes(value.toLowerCase()) ||
        record.customer_phone?.toLowerCase().includes(value.toLowerCase()) ||
        record.customer_email?.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Phone",
      dataIndex: "customer_phone",
      key: "customer_phone",
    },
    {
      title: "Email",
      dataIndex: "customer_email",
      key: "customer_email",
      render: (email) => email || "-",
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      render: (city) => city || "-",
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
        {contextHolder}
        <Space>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/customer/details/${record.id}`)}
          />
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/customer/edit/${record.id}`)}
          />
          <Popconfirm
            title="Delete customer?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
        </>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/customer/add")}
        >
          Add Customer
        </Button>
      </div>

      <Input
        placeholder="Search customers..."
        prefix={<SearchOutlined />}
        onChange={(e) => setSearchText(e.target.value)}
        className="mb-4"
        style={{ width: 300 }}
      />

      <Table
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default CustomerList;
