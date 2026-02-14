import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, Popconfirm, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import userService from "../service/userService";

const RoleList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await userService.getRoles();
      const rolesData = response.data.data || response.data || [];
      
      // Map backend field names to frontend field names
      const mappedRoles = rolesData.map(role => ({
        id: role.id,
        name: role.role_name,
        description: role.description,
        isActive: role.is_active,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));
      
      setRoles(mappedRoles);
    } catch (error) {
      message.error("Failed to fetch roles");
      console.error('Fetch roles error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteRole(id);
      message.success("Role deleted successfully");
      fetchRoles();
    } catch (error) {
      message.error("Failed to delete role");
    }
  };

  const columns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/user/roles/edit/${record.id}`)}
          />
          <Popconfirm
            title="Delete role?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/user/roles/add")}
        >
          Add Role
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default RoleList;
