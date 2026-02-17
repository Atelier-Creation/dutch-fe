import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, Popconfirm, message, Input, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import userService from "../service/userService";

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, searchText]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
      });
      
      const usersData = response.data.data || [];
      
      // Map backend field names to frontend field names
      const mappedUsers = usersData.map(user => ({
        id: user.id,
        name: user.username,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        Role: user.role ? { name: user.role.role_name } : { name: 'N/A' },
        isActive: user.is_active,
        isDeleted: user.deleted_by !== null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      
      setUsers(mappedUsers);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch (error) {
      message.error("Failed to fetch users");
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: pagination.total,
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page on search
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id);
      messageApi.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      messageApi.error("Failed to delete user");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Role",
      dataIndex: ["Role", "name"],
      key: "role",
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "isDeleted",
      key: "status",
      render: (isDeleted) => (
        <Tag color={isDeleted ? "red" : "green"}>
          {isDeleted ? "Inactive" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
        {contextHolder}
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/user/users/edit/${record.id}`)}
          />
          <Popconfirm
            title="Delete user?"
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
        <h1 className="text-2xl font-bold">Users</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/user/users/add")}
        >
          Add User
        </Button>
      </div>

      <Input
        placeholder="Search by name, email, or phone..."
        prefix={<SearchOutlined />}
        onChange={(e) => handleSearch(e.target.value)}
        className="mb-4"
        style={{ width: 300 }}
        allowClear
      />

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default UserList;
