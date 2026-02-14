import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, Button, message, Card, Space } from "antd";
import customerService from "../service/customerService";

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const response = await customerService.getCustomerById(id);
      form.setFieldsValue(response.data.data);
    } catch (error) {
      message.error("Failed to fetch customer");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (id) {
        await customerService.updateCustomer(id, values);
        message.success("Customer updated successfully");
      } else {
        await customerService.createCustomer(values);
        message.success("Customer created successfully");
      }
      navigate("/customer/list");
    } catch (error) {
      message.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card title={id ? "Edit Customer" : "Add Customer"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input placeholder="Customer name" />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[
              { required: true, message: "Please enter phone" },
              { pattern: /^[0-9]{10}$/, message: "Invalid phone number" },
            ]}
          >
            <Input placeholder="10-digit phone number" maxLength={10} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: "email", message: "Invalid email" }]}
          >
            <Input placeholder="customer@example.com" />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea rows={3} placeholder="Customer address" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? "Update" : "Create"}
              </Button>
              <Button onClick={() => navigate("/customer/list")}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CustomerForm;
