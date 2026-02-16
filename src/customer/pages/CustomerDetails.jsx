import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Table, Tabs, message, Button, Tag, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import customerService from "../service/customerService";
import moment from "moment";

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [customerRes, historyRes, analyticsRes] = await Promise.all([
        customerService.getCustomerById(id),
        customerService.getCustomerHistory(id),
        customerService.getCustomerAnalytics(id),
      ]);

      const customerData = customerRes.data.data || customerRes.data;
      const historyData = historyRes.data.data || historyRes.data;
      const analyticsData = analyticsRes.data.data || analyticsRes.data;

      setCustomer(customerData);
      
      // History response structure: { customer, statistics, top_products, preferences, recent_purchases }
      setHistory(historyData.recent_purchases || []);
      setAnalytics({
        ...analyticsData,
        ...historyData.statistics
      });

      if (customerData?.customer_phone) {
        try {
          const pointsRes = await customerService.getPointsHistory(customerData.customer_phone);
          setPointsHistory(pointsRes.data.data || []);
        } catch (err) {
          console.log("Points history not available");
        }
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      message.error("Failed to fetch customer details");
    } finally {
      setLoading(false);
    }
  };

  const historyColumns = [
    {
      title: "Date",
      dataIndex: "billing_date",
      key: "date",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Bill No",
      dataIndex: "billing_no",
      key: "billing_no",
    },
    {
      title: "Amount",
      dataIndex: "total_amount",
      key: "amount",
      render: (amount) => `₹${parseFloat(amount).toFixed(2)}`,
    },
    {
      title: "Items",
      dataIndex: "items_count",
      key: "items_count",
    },
    {
      title: "Payment",
      dataIndex: "payment_method",
      key: "payment",
      render: (method) => <Tag>{method}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const pointsColumns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={type === "earned" ? "green" : "red"}>
          {type?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Points",
      dataIndex: "points",
      key: "points",
      render: (points, record) => (
        <span className={record.type === "earned" ? "text-green-600" : "text-red-600"}>
          {points}
        </span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/customer/list")}
        className="mb-4"
      >
        Back
      </Button>

      <Card title="Customer Details" className="mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Name">{customer?.customer_name}</Descriptions.Item>
          <Descriptions.Item label="Phone">{customer?.customer_phone}</Descriptions.Item>
          <Descriptions.Item label="Email">{customer?.customer_email || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="City">{customer?.city || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="State">{customer?.state || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Gender">{customer?.gender || "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {customer?.address || "N/A"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {analytics && (
        <Card title="Analytics" className="mb-4">
          <Descriptions bordered column={3}>
            <Descriptions.Item label="Total Purchases">
              {analytics.total_purchases || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Total Spent">
              ₹{parseFloat(analytics.total_spent || analytics.total_amount || 0).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Average Bill">
              ₹{parseFloat(analytics.average_purchase_value || 0).toFixed(2)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Tabs
        items={[
          {
            key: "history",
            label: "Purchase History",
            children: (
              <Table
                columns={historyColumns}
                dataSource={history}
                rowKey={(record) => record.billing_no || record.id}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: "points",
            label: "Points History",
            children: (
              <Table
                columns={pointsColumns}
                dataSource={pointsHistory}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default CustomerDetails;
