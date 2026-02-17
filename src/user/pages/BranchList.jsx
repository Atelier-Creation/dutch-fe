import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, Popconfirm, message, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import userService from "../service/userService";

const BranchList = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await userService.getBranches();
      const branchesData = response.data.data || [];
      
      // Map backend field names to frontend field names
      const mappedBranches = branchesData.map(branch => ({
        id: branch.id,
        name: branch.branch_name,
        code: branch.branch_code,
        location: branch.city,
        contactNumber: branch.phone,
        email: branch.email,
        address: branch.address,
        isActive: branch.is_active,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      }));
      
      setBranches(mappedBranches);
    } catch (error) {
      message.error("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteBranch(id);
      messageApi.success("Branch deleted successfully");
      fetchBranches();
    } catch (error) {
      messageApi.error("Failed to delete branch");
    }
  };

  const columns = [
    {
      title: "Branch Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Contact",
      dataIndex: "contactNumber",
      key: "contactNumber",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
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
            onClick={() => navigate(`/user/branches/edit/${record.id}`)}
          />
          <Popconfirm
            title="Delete branch?"
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
        <h1 className="text-2xl font-bold">Branches</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/user/branches/add")}
        >
          Add Branch
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={branches}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default BranchList;
