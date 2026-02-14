import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, Button, message, Card, Space } from "antd";
import userService from "../service/userService";

const RoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRole();
    }
  }, [id]);

  const fetchRole = async () => {
    setLoading(true);
    try {
      const response = await userService.getRoleById(id);
      const role = response.data.data || response.data;
      
      // Map backend field names to frontend field names
      form.setFieldsValue({
        name: role.role_name,
        description: role.description,
      });
    } catch (error) {
      message.error("Failed to fetch role");
      console.error('Fetch role error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Map frontend field names to backend field names
      const payload = {
        role_name: values.name,
        description: values.description,
      };

      if (id) {
        await userService.updateRole(id, payload);
        message.success("Role updated successfully");
      } else {
        await userService.createRole(payload);
        message.success("Role created successfully");
      }
      navigate("/user/roles");
    } catch (error) {
      message.error(error.response?.data?.error || error.response?.data?.message || "Operation failed");
      console.error('Save role error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card title={id ? "Edit Role" : "Add Role"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Role Name"
            name="name"
            rules={[{ required: true, message: "Please enter role name" }]}
          >
            <Input placeholder="e.g., Admin, Manager, Staff" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} placeholder="Role description..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? "Update" : "Create"}
              </Button>
              <Button onClick={() => navigate("/user/roles")}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RoleForm;
