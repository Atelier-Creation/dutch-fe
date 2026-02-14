import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Divider,
  Select,
  Tabs,
  notification,
  Space,
  Upload,
  Radio,
  Row,
  Col,
  Avatar,
} from "antd";
import {
  SaveOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  LockOutlined,
  UploadOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { useTheme } from "../../context/ThemeContext";
// import ComapanyForm from "../../Hotel/components/HotelForm";
// import AddMachineType from "../../ssms/pages/Subfields/AddMachineType";

const { Option } = Select;
const { TabPane } = Tabs;

const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
    const [activeTab, setActiveTab] = useState("profile");

  const {
    theme,
    setTheme,
    primaryColor,
    setPrimaryColor,
    contentBgColor,
    setContentBgColor,
    headerBgColor,
    setHeaderBgColor,
    sidebarBgColor,
    setSidebarBgColor,
    footerBgColor,
    setFooterBgColor,
    presetThemes,
    applyPresetTheme,
    currentPreset,
  } = useTheme();

  const handleSubmit = (values) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log("Settings saved:", values);
      notification.success({
        message: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
      setLoading(false);
    }, 1000);
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === "done") {
      // Get this url from response in real world
      setAvatarUrl(URL.createObjectURL(info.file.originFileObj));
    }
  };

  return (
    <div className="settings-page">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <Card variant={"borderless"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+1 (555) 123-4567",
            jobTitle: "Software Developer",
            department: "Engineering",
            theme: theme,
            primaryColor: primaryColor,
            notificationsEnabled: true,
            emailNotifications: true,
            pushNotifications: true,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }}
        >
             <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
            <TabPane
              tab={
                <span>
                  <UserOutlined /> Profile
                </span>
              }
              key="profile"
            >
              <div className="mb-6 flex justify-center">
                <Space direction="vertical" align="center">
                  <Avatar size={100} icon={<UserOutlined />} src={avatarUrl} />
                  <Upload
                    onChange={handleAvatarChange}
                    showUploadList={false}
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />}>Change Avatar</Button>
                  </Upload>
                </Space>
              </div>

              {/* <ComapanyForm /> */}

              {/* <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                  >
                    <Input placeholder="First Name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                  >
                    <Input placeholder="Last Name" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>
              
              <Form.Item
                name="phone"
                label="Phone Number"
              >
                <Input placeholder="Phone Number" />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="jobTitle"
                    label="Job Title"
                  >
                    <Input placeholder="Job Title" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="department"
                    label="Department"
                  >
                    <Select placeholder="Select Department">
                      <Option value="engineering">Engineering</Option>
                      <Option value="marketing">Marketing</Option>
                      <Option value="sales">Sales</Option>
                      <Option value="hr">Human Resources</Option>
                      <Option value="finance">Finance</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row> */}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <SettingOutlined /> Config
                </span>
              }
              key="config"
            >
              <Form.Item name="theme" label="Theme Mode">
                <Radio.Group onChange={(e) => setTheme(e.target.value)}>
                  <Radio.Button value="light">Light</Radio.Button>
                  <Radio.Button value="dark">Dark</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="presetTheme" label="Preset Theme">
                <Select
                  placeholder="Select Preset Theme"
                  onChange={(value) => applyPresetTheme(value)}
                  defaultValue={currentPreset}
                >
                  <Option value="light">Default Light</Option>
                  <Option value="blue">Blue</Option>
                  <Option value="purple">Purple</Option>
                  <Option value="green">Green</Option>
                  <Option value="grey">Grey</Option>
                </Select>
              </Form.Item>

              <Form.Item name="primaryColor" label="Primary Color">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: "100%", height: "32px" }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="contentBgColor" label="Content Background">
                    <Input
                      type="color"
                      value={contentBgColor}
                      onChange={(e) => setContentBgColor(e.target.value)}
                      style={{ width: "100%", height: "32px" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="headerBgColor" label="Header Background">
                    <Input
                      type="color"
                      value={headerBgColor}
                      onChange={(e) => setHeaderBgColor(e.target.value)}
                      style={{ width: "100%", height: "32px" }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="sidebarBgColor" label="Sidebar Background">
                    <Input
                      type="color"
                      value={sidebarBgColor}
                      onChange={(e) => setSidebarBgColor(e.target.value)}
                      style={{ width: "100%", height: "32px" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="footerBgColor" label="Footer Background">
                    <Input
                      type="color"
                      value={footerBgColor}
                      onChange={(e) => setFooterBgColor(e.target.value)}
                      style={{ width: "100%", height: "32px" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <BellOutlined /> Notifications
                </span>
              }
              key="notifications"
            >
              <Form.Item
                name="notificationsEnabled"
                label="Enable Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Divider />

              <Form.Item
                name="emailNotifications"
                label="Email Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="pushNotifications"
                label="Push Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="notificationFrequency"
                label="Notification Frequency"
              >
                <Select placeholder="Select Frequency">
                  <Option value="immediate">Immediate</Option>
                  <Option value="hourly">Hourly Digest</Option>
                  <Option value="daily">Daily Digest</Option>
                  <Option value="weekly">Weekly Digest</Option>
                </Select>
              </Form.Item>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <SecurityScanOutlined /> Security
                </span>
              }
              key="security"
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[
                  {
                    required: true,
                    message: "Please enter your current password",
                  },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: "Please enter your new password" },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={["newPassword"]}
                rules={[
                  {
                    required: true,
                    message: "Please confirm your new password",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The two passwords do not match")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                name="twoFactorAuth"
                label="Two-Factor Authentication"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <LockOutlined /> Privacy
                </span>
              }
              key="privacy"
            >
              <Form.Item
                name="dataSharing"
                label="Data Sharing"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="activityTracking"
                label="Activity Tracking"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item name="cookiePreferences" label="Cookie Preferences">
                <Select mode="multiple" placeholder="Select Cookie Preferences">
                  <Option value="essential">Essential</Option>
                  <Option value="functional">Functional</Option>
                  <Option value="analytics">Analytics</Option>
                  <Option value="advertising">Advertising</Option>
                </Select>
              </Form.Item>

              <Form.Item name="dataRetention" label="Data Retention Period">
                <Select placeholder="Select Retention Period">
                  <Option value="30days">30 Days</Option>
                  <Option value="90days">90 Days</Option>
                  <Option value="1year">1 Year</Option>
                  <Option value="forever">Forever</Option>
                </Select>
              </Form.Item>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <PlusOutlined /> Sub Fields
                </span>
              }
              key="subfields" 
            >
             {/* <AddMachineType /> */}
            </TabPane>
          </Tabs>

          <Divider />

         {activeTab !== "subfields" && (
            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                Save Settings
              </Button>
            </Form.Item>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default Settings;


