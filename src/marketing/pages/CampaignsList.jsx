import React, { useState } from "react";
import { Table, Tag, Typography, Button, Space, Input } from "antd";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { Search, Filter, Facebook, Chrome } from "lucide-react";

const { Title, Text } = Typography;

const CampaignsList = () => {
    const { theme, primaryColor } = useTheme();
    const [searchText, setSearchText] = useState("");

    const data = [
        // Mock Data
        {
            key: '1',
            platform: 'Meta',
            campaignName: 'Retargeting_Website_Visitors_Q3',
            status: 'Active',
            budget: '₹5,000 / day',
            spend: '₹42,300',
            roas: '3.4x',
        },
        {
            key: '2',
            platform: 'Google',
            campaignName: 'Search_Brand_Keywords',
            status: 'Active',
            budget: '₹2,000 / day',
            spend: '₹14,500',
            roas: '5.1x',
        },
        {
            key: '3',
            platform: 'Meta',
            campaignName: 'Lead_Gen_Form_Promo',
            status: 'Paused',
            budget: '₹1,500 / day',
            spend: '₹4,500',
            roas: '1.2x',
        },
    ];

    const columns = [
        {
            title: 'Platform',
            dataIndex: 'platform',
            key: 'platform',
            render: (platform) => {
                const isMeta = platform === 'Meta';
                return (
                    <Space>
                        {isMeta ? <Facebook size={18} color="#1877F2" /> : <Chrome size={18} color="#DB4437" />}
                        <Text>{platform}</Text>
                    </Space>
                );
            },
        },
        {
            title: 'Campaign Name',
            dataIndex: 'campaignName',
            key: 'campaignName',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'Active' ? 'green' : 'volcano';
                return (
                    <Tag color={color} key={status} style={{ borderRadius: '12px', padding: '2px 12px' }}>
                        {status.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Budget',
            dataIndex: 'budget',
            key: 'budget',
        },
        {
            title: 'Spend',
            dataIndex: 'spend',
            key: 'spend',
            render: (text) => <Text>{text}</Text>,
        },
        {
            title: 'ROAS (Return on Ad Spend)',
            dataIndex: 'roas',
            key: 'roas',
            render: (roas) => (
                <Tag color="blue" style={{ fontWeight: 'bold' }}>
                    {roas}
                </Tag>
            ),
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ padding: "24px" }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: theme === "dark" ? "#fff" : "#1f2937" }}>
                        Ad Campaigns
                    </Title>
                    <Text type="secondary">Manage and monitor your active marketing campaigns.</Text>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <Input
                        prefix={<Search size={16} color="#9CA3AF" />}
                        placeholder="Search campaigns..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ borderRadius: "8px", width: "250px" }}
                    />
                    <Button icon={<Filter size={16} />} style={{ borderRadius: "8px" }}>
                        Filters
                    </Button>
                </div>
            </div>

            <div style={{
                backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                padding: "20px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
            }}>
                <Table
                    columns={columns}
                    dataSource={data}
                    pagination={{ pageSize: 10 }}
                    style={{ width: "100%" }}
                    rowKey="key"
                />
            </div>
        </motion.div>
    );
};

export default CampaignsList;
