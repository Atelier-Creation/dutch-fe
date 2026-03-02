import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import {
    TrendingUp,
    DollarSign,
    MousePointerClick,
    Eye,
    Link as LinkIcon
} from "lucide-react";
import { Modal, Button, Card, Row, Col, Typography, Statistic, Alert } from "antd";

const { Title, Text } = Typography;

const MarketingDashboard = () => {
    const { theme, primaryColor } = useTheme();
    const [isConnectModalVisible, setIsConnectModalVisible] = useState(false);
    const [activePlatform, setActivePlatform] = useState(null);

    // Mock data for initial MVP
    const summaryData = [
        { title: "Total Ad Spend", value: "₹0.00", icon: <DollarSign size={24} color={primaryColor} /> },
        { title: "Total Impressions", value: "0", icon: <Eye size={24} color={primaryColor} /> },
        { title: "Total Clicks", value: "0", icon: <MousePointerClick size={24} color={primaryColor} /> },
        { title: "Avg. CPC", value: "₹0.00", icon: <TrendingUp size={24} color={primaryColor} /> },
    ];

    const handleConnect = (platform) => {
        setActivePlatform(platform);
        setIsConnectModalVisible(true);
    };

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
                        Marketing Dashboard
                    </Title>
                    <Text type="secondary">Overview of your Meta and Google Ads performance</Text>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <Button
                        type="primary"
                        icon={<LinkIcon size={16} />}
                        onClick={() => handleConnect("Meta")}
                        style={{ backgroundColor: "#1877F2", borderColor: "#1877F2" }}
                    >
                        Connect Meta Ads
                    </Button>
                    <Button
                        type="primary"
                        icon={<LinkIcon size={16} />}
                        onClick={() => handleConnect("Google")}
                        style={{ backgroundColor: "#DB4437", borderColor: "#DB4437" }}
                    >
                        Connect Google Ads
                    </Button>
                </div>
            </div>

            <Alert
                message="No Platforms Connected"
                description="Connect your Meta or Google Ads accounts to start tracking your campaign performances directly within your billing software."
                type="info"
                showIcon
                style={{ marginBottom: "24px", borderRadius: "8px" }}
            />

            <Row gutter={[24, 24]}>
                {summaryData.map((data, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card
                            hoverable
                            bodyStyle={{ padding: "24px" }}
                            style={{
                                borderRadius: "16px",
                                backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                                border: "none",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Statistic
                                    title={<Text style={{ color: theme === "dark" ? "#9CA3AF" : "#6B7280" }}>{data.title}</Text>}
                                    value={data.value}
                                    valueStyle={{ color: theme === "dark" ? "#fff" : "#111827", fontWeight: 700, fontSize: "28px" }}
                                />
                                <div style={{
                                    padding: "12px",
                                    borderRadius: "12px",
                                    backgroundColor: `${primaryColor}15`
                                }}>
                                    {data.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal
                title={`Connect ${activePlatform} Ads`}
                open={isConnectModalVisible}
                onCancel={() => setIsConnectModalVisible(false)}
                footer={null}
                centered
                bodyStyle={{ padding: "24px" }}
            >
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <Title level={4}>Authenticate with {activePlatform}</Title>
                    <p style={{ color: "#6B7280", marginBottom: "24px" }}>
                        You will be redirected to {activePlatform} to securely grant access to your ad accounts.
                        We only request read-only access for reporting purposes.
                    </p>
                    <Button
                        type="primary"
                        size="large"
                        style={{
                            backgroundColor: activePlatform === "Meta" ? "#1877F2" : "#DB4437",
                            borderColor: activePlatform === "Meta" ? "#1877F2" : "#DB4437",
                            width: "100%",
                            height: "48px",
                            borderRadius: "8px",
                            fontSize: "16px"
                        }}
                        onClick={async () => {
                            setIsConnectModalVisible(false);
                            if (activePlatform === "Meta") {
                                try {
                                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
                                    const response = await fetch(`${API_URL}/marketing/oauth/meta`);
                                    const data = await response.json();

                                    if (data.success && data.data?.url) {
                                        window.location.href = data.data.url;
                                    } else {
                                        console.error('Failed to get Meta Auth URL');
                                    }
                                } catch (error) {
                                    console.error('Error initiating Meta Auth:', error);
                                }
                            } else if (activePlatform === "Google") {
                                try {
                                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
                                    const response = await fetch(`${API_URL}/marketing/oauth/google`);
                                    const data = await response.json();

                                    if (data.success && data.data?.url) {
                                        window.location.href = data.data.url;
                                    } else {
                                        console.error('Failed to get Google Auth URL');
                                    }
                                } catch (error) {
                                    console.error('Error initiating Google Auth:', error);
                                }
                            }
                        }}
                    >
                        Continue to {activePlatform}
                    </Button>
                </div>
            </Modal>
        </motion.div>
    );
};

export default MarketingDashboard;
