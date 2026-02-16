import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs } from "antd";
import { useBranch } from "../../context/BranchContext";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  DatePicker,
  message,
  Spin,
  Table,
  Row,
  Col,
  Divider,
  Typography,
  Card,
  Alert,
  Tag,
  Space,
  Modal,
} from "antd";
import { CheckCircleOutlined, GiftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import productService from "../../Product/services/productService";
import billingService from "../service/billingService";
import couponService from "../../coupon/service/couponService";
import customerService from "../../customer/service/customerService";
import { Laptop, PhoneCall, Printer, ShieldCheck } from "lucide-react";

const { Title } = Typography;
const { Option } = Select;

function BillingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [preview, setPreview] = useState({ items: [], customer_name: "", billing_date: dayjs() });
  const [activeTab, setActiveTab] = useState("new");
  const [customerHistoryBills, setCustomerHistoryBills] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchCustomerBills = async () => {
    const phone = form.getFieldValue("customer_phone");

    if (!phone || phone.length !== 10) {
      message.warning("Enter valid customer phone number first");
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await billingService.getByCustomerPhone(phone);
      const data = response.data?.data || response.data || [];
      setCustomerHistoryBills(data);
    } catch (err) {
      message.error("Failed to fetch customer billing history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const historyColumns = [
    {
      title: "Bill No",
      dataIndex: "billing_no",
      key: "billing_no",
    },
    {
      title: "Date",
      dataIndex: "billing_date",
      key: "date",
      render: (v) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Items",
      dataIndex: "total_quantity",
      key: "qty",
    },
    {
      title: "Amount",
      dataIndex: "total_amount",
      key: "amount",
      render: (v) => `₹${Number(v).toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag color={v === "paid" ? "green" : "orange"}>
          {v?.toUpperCase()}
        </Tag>
      ),
    },
  ];
  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponData, setCouponData] = useState(null);
  const [couponApplied, setCouponApplied] = useState(false);

  // Customer states
  const [customerData, setCustomerData] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Split payment states
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState([
    { method: 'cash', amount: 0 }
  ]);

  // Success modal for generated coupon
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState(null);

  // Bill Management (Tabs)
  const [bills, setBills] = useState([]);
  const [activeBillKey, setActiveBillKey] = useState("1");
  const { selectedBranch, branches } = useBranch();

  const currentBranchDetails = branches.find(b => b.branch_id === selectedBranch?.id)?.branch;

  // Helper to generate a blank bill state
  const createNewBillState = (key) => {
    // Leave bill_no empty so placeholder "Auto Generates" shows
    return {
      key: key || Date.now().toString(),
      label: `Bill ${key || 1}`,
      formValues: { bill_no: "", billing_date: dayjs(), status: "pending", items: [], counter_no: "Counter 1" },
      customerData: null,
      isNewCustomer: false,
      couponCode: "",
      couponData: null,
      couponApplied: false,
      isSplitPayment: false,
      splitPayments: [{ method: 'cash', amount: 0 }],
      customerHistoryBills: [],
      preview: { items: [], customer_name: "", billing_date: dayjs(), counter_no: "Counter 1" },
    };
  };

  // Initialize first bill
  useEffect(() => {
    // Only if bills empty
    if (bills.length === 0) {
      const initial = createNewBillState("1");
      setBills([initial]);
      loadBillToForm(initial);
    }
  }, []);

  const loadBillToForm = (billState) => {
    form.setFieldsValue(billState.formValues);
    setCustomerData(billState.customerData);
    setIsNewCustomer(billState.isNewCustomer);
    setCouponCode(billState.couponCode);
    setCouponData(billState.couponData);
    setCouponApplied(billState.couponApplied);
    setIsSplitPayment(billState.isSplitPayment);
    setSplitPayments(billState.splitPayments);
    setCustomerHistoryBills(billState.customerHistoryBills);
    setPreview(billState.preview);
  };

  const saveCurrentBillState = () => {
    // Return the state object representing current UI
    return {
      formValues: form.getFieldsValue(true), // true = include hidden/all
      customerData,
      isNewCustomer,
      couponCode,
      couponData,
      couponApplied,
      isSplitPayment,
      splitPayments,
      customerHistoryBills,
      preview,
    };
  };

  const handleTabChange = (newKey) => {
    // 1. Save current bill state to the bills array
    const updatedBills = bills.map(b =>
      b.key === activeBillKey
        ? { ...b, ...saveCurrentBillState() }
        : b
    );

    // 2. Find target bill
    const targetBill = updatedBills.find(b => b.key === newKey);
    if (!targetBill) return;

    // 3. Update active key and bills list
    setActiveBillKey(newKey);
    setBills(updatedBills);

    // 4. Load target bill data into form/state
    loadBillToForm(targetBill);
  };

  const handleEditTabs = (targetKey, action) => {
    if (action === 'add') {
      addTab();
    } else {
      removeTab(targetKey);
    }
  };

  const addTab = () => {
    if (bills.length >= 10) {
      message.warning("Maximum 10 bills allowed");
      return;
    }
    // Save current before switching? Yes, usually desired.
    const currentSaved = saveCurrentBillState();
    const updatedBills = bills.map(b => b.key === activeBillKey ? { ...b, ...currentSaved } : b);

    const newKey = (parseInt(updatedBills[updatedBills.length - 1].key) + 1).toString();
    const newBill = createNewBillState(newKey);

    const nextBills = [...updatedBills, newBill];
    setBills(nextBills);
    setActiveBillKey(newKey);
    loadBillToForm(newBill);
  };

  const removeTab = (targetKey) => {
    let newActiveKey = activeBillKey;
    let lastIndex = -1;

    // You cannot close the last remaining tab
    if (bills.length === 1) {
      message.warning("At least one bill must be open");
      return;
    }

    bills.forEach((bill, i) => {
      if (bill.key === targetKey) {
        lastIndex = i - 1;
      }
    });

    const newBills = bills.filter((bill) => bill.key !== targetKey);

    if (newBills.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newBills[lastIndex].key;
      } else {
        newActiveKey = newBills[0].key;
      }
    }

    setBills(newBills);
    setActiveBillKey(newActiveKey);

    // If we switched tabs, load the data
    if (newActiveKey !== activeBillKey) {
      // Find the data for the new active key in the filtered list
      const billToLoad = newBills.find(b => b.key === newActiveKey);
      if (billToLoad) loadBillToForm(billToLoad);
    } else if (newBills.length > 0 && targetKey === activeBillKey) {
      // Should catch above, but safety:
      loadBillToForm(newBills[0]);
    }
  };

  const generateRandomBillNo = () => {
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    return `PNO${randomNumber}`;
  };

  // ensure item calculations are up-to-date
  const updateItemCalculations = (item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.unit_price || 0);
    const discount = Number(item.discount_amount || 0);
    // tax_percentage is used to compute tax_amount; numeric percent (e.g. 7.5)
    const taxPerc = Number(item.tax_percentage || 0);

    const tax = ((qty * price * taxPerc) / 100);
    const total = qty * price + tax - discount;

    item.tax_amount = parseFloat(tax.toFixed(2));
    item.total_price = parseFloat(total.toFixed(2));
    return item;
  };

  // ADD PRODUCT BY CODE
  const handleProductCode = async (code) => {
    const trimmed = String(code || "").trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const response = await productService.getByCode(trimmed);
      // Extract product from response - could be response.data or response directly
      const product = response.data || response;

      console.log("Product fetched:", product);

      if (!product || !product.product_code) {
        message.error("No product found for code: " + trimmed);
        return;
      }

      // resolve product id from common property names
      const resolvedProductId =
        product.id ||
        product._id ||
        product.uuid ||
        product.product_uuid ||
        product.productId ||
        null;

      if (!resolvedProductId) {
        message.error("Product is missing an id/uuid and cannot be added to the bill.");
        console.error("Product payload missing id/uuid:", product);
        return;
      }

      let items = form.getFieldValue("items") || [];
      const index = items.findIndex((i) => i.product_code === product.product_code);

      if (index >= 0) {
        items[index].quantity = (items[index].quantity || 0) + 1;
        items[index] = updateItemCalculations(items[index]);
      } else {
        const newItem = updateItemCalculations({
          product_id: String(resolvedProductId),
          product_code: product.product_code,
          product_name: product.product_name || product.name || "",
          size: product.size || "",
          color: product.color || "",
          quantity: 1,
          unit_price: product.selling_price || product.price || 0,
          discount_amount: 0,
          tax_percentage: product.tax_percentage || product.tax || 0,
          tax_amount: 0,
          total_price: 0,
        });
        items = [...items, newItem];
      }

      form.setFieldsValue({ items });
      setPreview((p) => ({ ...p, items }));

      message.success(`${product.product_name || product.product_code} added`);
      setProductCode("");
    } catch (err) {
      console.error("handleProductCode error:", err);
      message.error(
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.error)) ||
        "Failed to fetch product"
      );
    } finally {
      setLoading(false);
    }
  };

  // update a single item field (qty/discount/price)
  const handleItemChange = (index, field, value) => {
    let items = form.getFieldValue("items") || [];
    if (!items[index]) return;
    const item = { ...items[index], [field]: value };
    items[index] = updateItemCalculations(item);
    form.setFieldsValue({ items });
    setPreview((p) => ({ ...p, items }));
  };

  const removeItem = (index) => {
    const items = (form.getFieldValue("items") || []).slice();
    items.splice(index, 1);
    form.setFieldsValue({ items });
    setPreview((p) => ({ ...p, items }));
  };

  // calculate invoice summary
  const calculateSummaryFromItems = (items, appliedCoupon = null) => {
    const subtotal = items.reduce((sum, i) => sum + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0), 0);
    const totalDiscount = items.reduce((sum, i) => sum + (Number(i.discount_amount) || 0), 0);
    const totalTax = items.reduce((sum, i) => sum + (Number(i.tax_amount) || 0), 0);

    let couponDiscount = 0;
    if (appliedCoupon && couponApplied) {
      // Handle both response structures
      couponDiscount = appliedCoupon.discount_amount || appliedCoupon.discount?.discountAmount || 0;
    }

    const grandTotal = subtotal - totalDiscount + totalTax - couponDiscount;
    return { subtotal, totalDiscount, totalTax, couponDiscount, grandTotal };
  };

  // Validate coupon
  const handleValidateCoupon = async () => {
    const customerPhone = form.getFieldValue("customer_phone");
    const items = form.getFieldValue("items") || [];

    if (!couponCode.trim()) {
      message.warning("Please enter a coupon code");
      return;
    }

    if (!customerPhone) {
      message.warning("Please enter customer phone number first");
      return;
    }

    if (items.length === 0) {
      message.warning("Please add items to the bill first");
      return;
    }

    const summary = calculateSummaryFromItems(items);

    setCouponValidating(true);
    try {
      const response = await couponService.validateCoupon({
        coupon_code: couponCode.toUpperCase(),
        customer_phone: customerPhone,
        purchase_amount: summary.subtotal, // Use subtotal for validation
      });

      const result = response.data || response;

      if (result.success && result.discount_amount) {
        // Store the validated coupon data with correct structure
        setCouponData({
          valid: true,
          discount_amount: result.discount_amount,
          coupon: result.coupon,
          message: result.message
        });
        setCouponApplied(true);
        message.success(`Coupon applied! Discount: ₹${result.discount_amount.toFixed(2)}`);
      } else {
        setCouponData(null);
        setCouponApplied(false);
        message.error(result.message || "Invalid coupon");
      }
    } catch (error) {
      setCouponData(null);
      setCouponApplied(false);
      message.error(error.response?.data?.message || "Failed to validate coupon");
    } finally {
      setCouponValidating(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    setCouponApplied(false);
    message.info("Coupon removed");
  };

  // Split payment handlers
  const addSplitPayment = () => {
    setSplitPayments([...splitPayments, { method: 'cash', amount: 0 }]);
  };

  const removeSplitPayment = (index) => {
    const newPayments = splitPayments.filter((_, i) => i !== index);
    setSplitPayments(newPayments.length > 0 ? newPayments : [{ method: 'cash', amount: 0 }]);
  };

  const updateSplitPayment = (index, field, value) => {
    const newPayments = [...splitPayments];
    newPayments[index][field] = value;
    setSplitPayments(newPayments);
  };

  const getTotalSplitAmount = () => {
    return splitPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  };

  // Lookup customer by phone
  const handleCustomerLookup = async (phone) => {
    if (!phone || phone.length !== 10) {
      setCustomerData(null);
      setIsNewCustomer(false);
      return;
    }

    setCustomerLoading(true);
    try {
      const response = await customerService.getCustomerByPhone(phone);
      const customer = response.data.data;

      if (customer) {
        setCustomerData(customer);
        setIsNewCustomer(false);

        // Auto-fill customer name if found
        form.setFieldsValue({
          customer_name: customer.name
        });

        message.success(`Customer found: ${customer.name}`);

        // Fetch customer history and analytics
        try {
          const [historyRes, analyticsRes, couponsRes] = await Promise.all([
            customerService.getCustomerHistory(customer.id),
            customerService.getCustomerAnalytics(customer.id),
            couponService.getCustomerCoupons(phone),
          ]);

          const historyData = historyRes.data.data || historyRes.data || {};
          console.log(historyData)
          const analyticsData = analyticsRes.data.data || analyticsRes.data || {};
          const couponsData = couponsRes.data.data || couponsRes.data || [];

          setCustomerData({
            ...customer,
            // From history endpoint
            statistics: historyData.statistics || {},
            top_products: historyData.top_products || [],
            recent_purchases: historyData.recent_purchases || [],
            preferences: historyData.preferences || {},
            // From analytics endpoint
            analytics: analyticsData,
            // From coupons endpoint
            coupons: couponsData,
            // Legacy support
            totalPoints: customer.totalPoints || 0,
          });
          setCustomerHistoryBills(historyData.recent_purchases || []);
        } catch (err) {
          console.error("Error fetching customer details:", err);
        }
      } else {
        setCustomerData(null);
        setIsNewCustomer(true);
        message.info("New customer - please enter name");
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setCustomerData(null);
        setIsNewCustomer(true);
        message.info("New customer - please enter name");
      } else {
        message.error("Failed to lookup customer");
      }
    } finally {
      setCustomerLoading(false);
    }
  };

  // when form changes, keep preview in sync and make sure computed fields exist
  const onValuesChange = (changed, all) => {
    const items = (all.items || []).map((it) => updateItemCalculations({ ...it }));
    form.setFieldsValue({ items });
    setPreview({ ...all, items });
  };

  // SUBMIT -> send payload shape backend expects
  const handleSubmit = async (values) => {
    // Validate split payment if enabled
    if (isSplitPayment) {
      const splitTotal = getTotalSplitAmount();
      const items = form.getFieldValue("items") || [];
      const summary = calculateSummaryFromItems(items, couponApplied ? couponData : null);

      if (Math.abs(splitTotal - summary.grandTotal) > 0.01) {
        message.error(`Split payment total (₹${splitTotal.toFixed(2)}) must equal bill total (₹${summary.grandTotal.toFixed(2)})`);
        return;
      }
    }

    setLoading(true);
    try {
      const itemsRaw = form.getFieldValue("items") || [];

      if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
        message.error("Add at least one product/item before submitting the bill.");
        setLoading(false);
        return;
      }

      for (const it of itemsRaw) {
        if (!it.product_id) {
          message.error("One or more items are missing product_id. Remove and re-add them.");
          console.error("Invalid item (missing product_id):", it);
          setLoading(false);
          return;
        }
      }

      // Build items using backend field names: discount_amount, tax_amount, total_price
      const items = itemsRaw.map((i) => {
        // ensure computed fields exist
        const item = updateItemCalculations({ ...i });
        return {
          product_id: String(item.product_id),
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          unit: item.unit || "",
          discount_amount: Number(item.discount_amount || 0),
          tax_amount: Number(item.tax_amount || 0),
          total_price: Number(item.total_price || (item.quantity * item.unit_price + item.tax_amount - item.discount_amount) || 0),
        };
      });

      // Summaries
      const subtotal = items.reduce((s, it) => s + (it.unit_price * it.quantity), 0);
      const discount_amount = items.reduce((s, it) => s + (it.discount_amount || 0), 0);
      const tax_amount = items.reduce((s, it) => s + (it.tax_amount || 0), 0);
      const totalQuantity = items.reduce((s, it) => s + (it.quantity || 0), 0);

      // Calculate coupon discount
      let coupon_discount = 0;
      let coupon_code_used = null;
      if (couponApplied && couponData && couponData.discount_amount) {
        coupon_discount = couponData.discount_amount;
        coupon_code_used = couponCode.toUpperCase();
      }

      const totalAmount = subtotal - discount_amount + tax_amount - coupon_discount;

      // bill_no is optional — server generates billing_no; keep client-side id in bill_no if provided
      const bill_no = values.bill_no || `BILL-${Date.now()}`;

      // Build final payload that matches backend.createBillingWithItems
      const payload = {
        // server will create billing_no; sending bill_no is harmless if you want to keep client id
        bill_no,
        status: "paid",
        customer_name: values.customer_name || "",
        customer_phone: values.customer_phone || "",
        billing_date: values.billing_date ? dayjs(values.billing_date).toISOString() : new Date().toISOString(),
        counter_no: values.counter_no || null,
        discount_amount,
        tax_amount,
        coupon_discount, // Add coupon discount
        coupon_code: coupon_code_used, // Add coupon code
        total_amount: totalAmount,
        paid_amount: Number(values.paid_amount || totalAmount),
        payment_method: isSplitPayment ? "split" : (values.payment_method || "cash"),
        payment_details: isSplitPayment ? splitPayments : null,
        notes: values.remarks || "",
        total_quantity: totalQuantity,
        is_active: true,
        items,
      };

      console.log("Billing payload ->", payload);

      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        message.error("No billing items detected. Please add items to the bill.");
        setLoading(false);
        return;
      }

      const response = await billingService.create(payload);
      const result = response.data || response;

      message.success("Billing created successfully" + (couponApplied ? " with coupon applied!" : ""));

      // Check if a referral coupon was generated
      if (result.coupon_generated) {
        setGeneratedCoupon(result.coupon_generated);
        setShowCouponModal(true);
      } else {
        // Instead of processing to list, we close the tab (or reset if only 1)
        // navigate("/billing/list");
        closeCurrentTab();
      }
    } catch (err) {
      console.error("create billing error:", err);
      const serverMsg =
        err &&
        err.response &&
        (err.response.data?.error || err.response.data?.message || JSON.stringify(err.response.data));
      message.error(serverMsg || "Failed to create billing");
    } finally {
      setLoading(false);
    }
  };

  const closeCurrentTab = () => {
    // If multiple tabs, remove current.
    if (bills.length > 1) {
      removeTab(activeBillKey);
    } else {
      // Only one tab, reset it to new state
      // We reuse the same key '1' or activeKey
      const newBill = createNewBillState(activeBillKey);
      setBills([newBill]);
      loadBillToForm(newBill);
    }
  };

  // table columns (editable)
  const columns = [
    { title: "Product Code", dataIndex: "product_code", key: "code" },
    { title: "Product Name", dataIndex: "product_name", key: "name" },
    {
      title: "Qty",
      key: "qty",
      render: (_, record, idx) => (
        <InputNumber min={1} value={record.quantity} onChange={(v) => handleItemChange(idx, "quantity", v || 0)} />
      ),
    },
    { title: "Unit Price", dataIndex: "unit_price", key: "price", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
    {
      title: "Discount",
      key: "disc",
      render: (_, record, idx) => (
        <InputNumber min={0} value={record.discount_amount} onChange={(v) => handleItemChange(idx, "discount_amount", v || 0)} />
      ),
    },
    { title: "Tax", dataIndex: "tax_amount", key: "tax", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
    { title: "Total", dataIndex: "total_price", key: "total", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
    {
      title: "",
      key: "actions",
      render: (_, __, idx) => (
        <Button danger size="small" onClick={() => removeItem(idx)}>
          Remove
        </Button>
      ),
    },
  ];

  // preview (read-only)
  const previewColumns = [
    { title: "#", dataIndex: "_idx", key: "idx", render: (_, __, idx) => idx + 1 },
    { title: "Product", dataIndex: "product_name", key: "pname" },
    { title: "Qty", dataIndex: "quantity", key: "pq" },
    { title: "Unit", dataIndex: "unit_price", key: "pu", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
    { title: "Tax", dataIndex: "tax_amount", key: "pt", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
    { title: "Total", dataIndex: "total_price", key: "ptotal", render: (v) => `₹${(Number(v) || 0).toFixed(2)}` },
  ];

  const summary = calculateSummaryFromItems(preview.items || [], couponApplied ? couponData : null);

  const styles = {
    page: { background: "#f1f6fb", minHeight: "100vh", padding: 12 },
    container: { maxWidth: 1100, margin: "0 auto" },
    mainGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 },
    leftCard: { background: "#fff", borderRadius: 8, padding: 12 },
    rightCard: { background: "#fff", borderRadius: 8, padding: 12, height: "fit-content", position: "sticky", top: 24 },
    sectionTitle: { color: "#0b75ff", fontWeight: 600, borderRadius: 8, },
  };


  const generateRandomBillNo = () => {
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    return `PNO${randomNumber}`;
  };

  const renderHistoryExpandedRow = (record) => {
    if (!customerData) return null;

    return (
      <div style={{ background: "#fafafa", padding: 16, borderRadius: 6 }}>
        {/* Top Products */}
        {customerData.top_products?.length > 0 && (
          <>
            <Title level={5}>Top Products</Title>
            <Table
              size="small"
              pagination={false}
              dataSource={customerData.top_products}
              rowKey={(r) => r.product_id}
              columns={[
                { title: "Product", dataIndex: "product_name" },
                { title: "Code", dataIndex: "product_code" },
                { title: "Qty", dataIndex: "total_quantity" },
                {
                  title: "Total Amount",
                  dataIndex: "total_amount",
                  render: (v) => `₹${Number(v).toFixed(2)}`,
                },
              ]}
            />
            <Divider />
          </>
        )}
      </div>
    );
  };
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Bill Tabs */}
        <Tabs
          type="editable-card"
          activeKey={activeBillKey}
          onChange={handleTabChange}
          onEdit={handleEditTabs}
          items={bills.map(b => ({ label: b.label, key: b.key, closable: bills.length > 1 }))}
          style={{ marginBottom: 0 }}
        />
        <Spin spinning={loading}>
          <Form
            form={form}
            className="form"
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ status: "pending", items: [] }}
            onValuesChange={onValuesChange}
          >
            <div style={styles.mainGrid}>
              <div style={styles.leftCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={styles.sectionTitle}>Billing Details</div>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Bill no" name="bill_no">
                      <Input disabled placeholder="Auto Generates" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Billing Date" name="billing_date" rules={[{ required: true, message: "Select billing date" }]}>
                      <DatePicker style={{ width: "100%" }} disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Customer Phone"
                      name="customer_phone"
                      rules={[
                        { required: true, message: "Enter phone number" },
                        { pattern: /^[0-9]{10}$/, message: "Enter valid 10-digit number" }
                      ]}
                    >
                      <Input
                        placeholder="Enter 10-digit phone number"
                        maxLength={10}
                        onChange={(e) => {
                          const phone = e.target.value;
                          if (phone.length === 10) {
                            handleCustomerLookup(phone);
                          } else {
                            setCustomerData(null);
                            setIsNewCustomer(false);
                          }
                        }}
                        suffix={
                          customerLoading ? (
                            <Spin size="small" />
                          ) : customerData ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : isNewCustomer ? (
                            <Tag color="blue">New</Tag>
                          ) : null
                        }
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Customer Name"
                      name="customer_name"
                      rules={[{ required: true, message: "Enter customer name" }]}
                    >
                      <Input
                        placeholder={isNewCustomer ? "Enter new customer name" : "Enter customer name"}
                        disabled={customerLoading}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Customer Info Card */}
                {/* {customerData && (
                  <Card
                    size="small"
                    style={{ marginBottom: 16, background: '#e6f7ff', border: '1px solid #91d5ff' }}
                    title={
                      <Space>
                        <CheckCircleOutlined style={{ color: '#1890ff' }} />
                        <span>Existing Customer - {customerData.customer?.name || customerData.name}</span>
                      </Space>
                    }
                  >
                    <Row gutter={[16, 8]}>
                      <Col span={6}>
                        <div style={{ fontSize: 12, color: '#666' }}>Total Purchases</div>
                        <div style={{ fontWeight: 600 }}>
                          {customerData.statistics?.total_purchases || 0} orders
                        </div>
                      </Col>
                      <Col span={6}>
                        <div style={{ fontSize: 12, color: '#666' }}>Total Spent</div>
                        <div style={{ fontWeight: 600 }}>
                          ₹{Number(customerData.statistics?.total_amount || 0).toFixed(2)}
                        </div>
                      </Col>
                      <Col span={6}>
                        <div style={{ fontSize: 12, color: '#666' }}>Avg Purchase</div>
                        <div style={{ fontWeight: 600 }}>
                          ₹{Number(customerData.statistics?.average_purchase_value || 0).toFixed(2)}
                        </div>
                      </Col>
                      <Col span={6}>
                        <div style={{ fontSize: 12, color: '#666' }}>Loyalty Points</div>
                        <div style={{ fontWeight: 600, color: '#52c41a' }}>
                          🏆 {customerData.totalPoints || 0}
                        </div>
                      </Col>
                    </Row>

                    {customerData.statistics?.last_purchase && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #91d5ff' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          Last Purchase:
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span>{dayjs(customerData.statistics.last_purchase.date).format('DD MMM YYYY')}</span>
                          <span><strong>{customerData.statistics.last_purchase.billing_no}</strong></span>
                          <span style={{ fontWeight: 600 }}>₹{customerData.statistics.last_purchase.amount}</span>
                        </div>
                      </div>
                    )}

                    {customerData.top_products && customerData.top_products.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #91d5ff' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                          Favorite Products:
                        </div>
                        <div style={{ maxHeight: 100, overflowY: 'auto' }}>
                          {customerData.top_products.slice(0, 3).map((product, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '4px 0',
                              fontSize: 12
                            }}>
                              <span>{product.product_name} ({product.product_code})</span>
                              <span style={{ fontWeight: 600 }}>×{product.total_quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {customerData.recent_purchases && customerData.recent_purchases.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #91d5ff' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                          Recent Purchases:
                        </div>
                        <div style={{ maxHeight: 100, overflowY: 'auto' }}>
                          {customerData.recent_purchases.slice(0, 3).map((bill, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '4px 0',
                              fontSize: 12
                            }}>
                              <span>{dayjs(bill.billing_date).format('DD/MM/YYYY')}</span>
                              <span>{bill.billing_no}</span>
                              <span style={{ fontWeight: 600 }}>₹{bill.total_amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {customerData.coupons && customerData.coupons.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #91d5ff' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                          Available Coupons: 🎁 {customerData.coupons.filter(c => !c.is_used && c.is_active).length}
                        </div>
                      </div>
                    )}
                  </Card>
                )} */}

                {isNewCustomer && (
                  <Alert
                    message="New Customer"
                    description="This is a new customer. Please enter their name above."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Counter No" name="counter_no" placeholder="Select Counter">
                      <Select>
                        <Option value="Counter 1">Counter 1</Option>
                        <Option value="Counter 2">Counter 2</Option>
                        <Option value="Counter 3">Counter 3</Option>
                        <Option value="Counter 4">Counter 4</Option>
                        <Option value="Counter 5">Counter 5</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Payment Method" name="payment_method">
                      {!isSplitPayment ? (
                        <Select onChange={(value) => {
                          if (value === 'split') {
                            setIsSplitPayment(true);
                          }
                        }}>
                          <Option value="cash">Cash</Option>
                          <Option value="credit_card">Credit Card</Option>
                          <Option value="debit_card">Debit Card</Option>
                          <Option value="UPI Current Account">UPI Current Account</Option>
                          <Option value="upi">UPI</Option>
                          <Option value="bank_transfer">Bank Transfer</Option>
                          <Option value="split">Split Payment</Option>
                          <Option value="hold">Hold</Option>
                        </Select>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>Split Payment Active</span>
                          <Button size="small" type="link" onClick={() => setIsSplitPayment(false)}>Cancel</Button>
                        </div>
                      )}
                    </Form.Item>
                  </Col>
                </Row>

                {/* Split Payment Section */}
                {isSplitPayment && (
                  <Card
                    size="small"
                    title="Split Payment Details"
                    style={{ marginBottom: 16, background: '#fff7e6', border: '1px solid #ffd591' }}
                    extra={
                      <Button
                        type="dashed"
                        size="small"
                        onClick={addSplitPayment}
                      >
                        + Add Payment
                      </Button>
                    }
                  >
                    {splitPayments.map((payment, index) => (
                      <Row key={index} gutter={8} style={{ marginBottom: 8 }}>
                        <Col span={10}>
                          <Select
                            value={payment.method}
                            onChange={(value) => updateSplitPayment(index, 'method', value)}
                            style={{ width: '100%' }}
                          >
                            <Option value="cash">Cash</Option>
                            <Option value="credit_card">Credit Card</Option>
                            <Option value="debit_card">Debit Card</Option>
                            <Option value="UPI Current Account">UPI Current</Option>
                            <Option value="UPI Normal Account">UPI Normal</Option>
                            <Option value="net_banking">Net Banking</Option>
                          </Select>
                        </Col>
                        <Col span={10}>
                          <InputNumber
                            value={payment.amount}
                            onChange={(value) => updateSplitPayment(index, 'amount', value)}
                            placeholder="Amount"
                            min={0}
                            style={{ width: '100%' }}
                            prefix="₹"
                          />
                        </Col>
                        <Col span={4}>
                          {splitPayments.length > 1 && (
                            <Button
                              danger
                              size="small"
                              onClick={() => removeSplitPayment(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </Col>
                      </Row>
                    ))}
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>Total Split Amount:</span>
                      <span style={{ color: getTotalSplitAmount() === summary.grandTotal ? '#52c41a' : '#ff4d4f' }}>
                        ₹{getTotalSplitAmount().toFixed(2)} / ₹{summary.grandTotal.toFixed(2)}
                      </span>
                    </div>
                    {getTotalSplitAmount() !== summary.grandTotal && (
                      <Alert
                        message="Split payment total must equal the bill total"
                        type="warning"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </Card>
                )}

                {/* Coupon Section - Always show */}
                {/* <Card
                  size="small"
                  title={
                    <Space>
                      <GiftOutlined style={{ color: '#52c41a' }} />
                      <span>Apply Coupon Code</span>
                    </Space>
                  }
                  style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}
                >
                  {!couponApplied ? (
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        placeholder="Enter coupon code (e.g., REFABC1234)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        maxLength={10}
                        style={{ textTransform: 'uppercase' }}
                      />
                      <Button
                        type="primary"
                        onClick={handleValidateCoupon}
                        loading={couponValidating}
                      >
                        Apply
                      </Button>
                    </Space.Compact>
                  ) : (
                    <Alert
                      message="Coupon Applied Successfully!"
                      description={
                        <div>
                          <div><strong>Code:</strong> {couponCode}</div>
                          <div><strong>Discount:</strong> ₹{couponData?.discount?.discountAmount?.toFixed(2)}</div>
                          <div><strong>Owner Reward:</strong> {couponData?.discount?.ownerRewardPoints} points</div>
                          <div><strong>Your Reward:</strong> {couponData?.discount?.userRewardPoints} points</div>
                        </div>
                      }
                      type="success"
                      icon={<CheckCircleOutlined />}
                      showIcon
                      action={
                        <Button size="small" danger onClick={handleRemoveCoupon}>
                          Remove
                        </Button>
                      }
                    />
                  )}

                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    💡 Tip: Earn coupons by making purchases of ₹2000 or more!
                  </div>
                </Card> */}


                <Row gutter={16}>

                  <Col span={12}>
                    <Form.Item label="Scan / Enter Product Code">
                      <Input
                        placeholder="Scan or type code and press Enter"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleProductCode(productCode);
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Apply Coupon">
                      {!couponApplied ? (
                        <Space.Compact style={{ width: "100%" }}>
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            maxLength={10}
                            onChange={(e) =>
                              setCouponCode(e.target.value.toUpperCase())
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleValidateCoupon();
                              }
                            }}
                            style={{ textTransform: "uppercase" }}
                          />
                          <Button
                            type="primary"
                            loading={couponValidating}
                            onClick={handleValidateCoupon}
                          >
                            Apply
                          </Button>
                        </Space.Compact>
                      ) : (
                        <Alert
                          message="Coupon Applied Successfully!"
                          description={
                            <div>
                              <div>
                                <strong>Code:</strong> {couponCode}
                              </div>
                              <div>
                                <strong>Discount:</strong> ₹
                                {couponData?.discount_amount?.toFixed(2)}
                              </div>
                            </div>
                          }
                          type="success"
                          showIcon
                          action={
                            <Button size="small" danger onClick={handleRemoveCoupon}>
                              Remove
                            </Button>
                          }
                        />
                      )}
                    </Form.Item>
                  </Col>
                </Row>



                {/* Items table (editable) */}
                <Tabs
                  activeKey={activeTab}
                  onChange={(key) => {
                    setActiveTab(key);
                    if (key === "history") {
                      fetchCustomerBills();
                    }
                  }}
                  items={[
                    {
                      key: "new",
                      label: "New Bill",
                      children: (
                        <Form.List name="items">
                          {() => {
                            const items = form.getFieldValue("items") || [];
                            return (
                              <>
                                <Table
                                  dataSource={items}
                                  columns={columns}
                                  pagination={false}
                                  rowKey={(r, idx) => idx}
                                  size="small"
                                  style={{ marginBottom: 8 }}
                                />

                                <div style={{ display: "flex", justifyContent: "right", marginTop: 10 }}>
                                  <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
                                      <div style={{ color: "#374151" }}>Subtotal</div>
                                      <div style={{ fontWeight: 700, color: "#222" }}>₹{summary.subtotal.toFixed(2)}</div>
                                    </div>
                                  </div>
                                </div>

                                <Divider />
                              </>
                            );
                          }}
                        </Form.List>
                      ),
                    },
                    ...(customerData
                      ? [
                        {
                          key: "history",
                          label: "History",
                          children: (
                            <Spin spinning={historyLoading}>
                              <Table
                                dataSource={customerHistoryBills}
                                columns={historyColumns}
                                rowKey={(record) => record.billing_no}
                                pagination={{ pageSize: 5 }}
                                locale={{ emptyText: "No previous bills found" }}
                                size="small"
                                expandable={{
                                  expandedRowRender: renderHistoryExpandedRow,
                                  rowExpandable: () => true,
                                }}
                              />
                            </Spin>
                          ),
                        },
                      ]
                      : []),
                  ]}
                />
              </div>

              {/* RIGHT: live preview */}
              <div style={styles.rightCard}>
                <Title level={5} style={{ marginBottom: 6 }}>
                  Bill Preview
                </Title>

                <style>{`
                  .invoiceHeader{background: gray; padding:12px; border-radius:6px; color:#fff}
                  .invoiceHeader .company{font-weight:800; font-size:16px}
                  .invoiceHeader .meta{font-size:12px; opacity:0.95}
                  .previewTable .ant-table-thead > tr > th{background:transparent; color:#0b75ff}
                  .previewTable .even-row{background:rgba(11,117,255,0.04)}
                  .previewTotals{background:#ffffff; padding:12px; border-radius:8px; box-shadow:0 6px 18px rgba(11,117,255,0.06)}
                  .badge{display:inline-block; padding:4px 8px; border-radius:999px; font-weight:700}
                  .badge-paid{background:#bbf7d0; color:#065f46}
                  .badge-pending{background:#fee2e2; color:#991b1b}
                `}</style>

                <div className="invoiceHeader">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="company">{currentBranchDetails?.name || currentBranchDetails?.branch_name || "Atelier Tech"}</div>
                      <div className="meta">{currentBranchDetails?.address || "Address Not Available"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700 }}>{preview.billing_date ? dayjs(preview.billing_date).format("DD MMM YYYY") : "-"}</div>
                      <div style={{ fontSize: 12 }}>{preview.customer_name || "-"}</div>
                      <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: "4px" }}><PhoneCall size={12} /> {preview.customer_phone || preview.customer_phone_nu || "-"}</div>
                      <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: "4px" }}> <Laptop size={12} /> {preview.counter_no || preview.couner || "-"}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <Table
                    className="previewTable"
                    dataSource={(preview.items || []).map((it, i) => ({ ...it, key: i }))}
                    columns={previewColumns}
                    pagination={false}
                    size="small"
                    rowClassName={(record, idx) => (idx % 2 === 0 ? "even-row" : "")}
                    style={{ marginBottom: 8, borderRadius: 6, overflow: "hidden" }}
                  />

                  <div className="previewTotals" style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ color: "#374151" }}>Subtotal</div>
                      <div>₹{summary.subtotal.toFixed(2)}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>Tax</div>
                      <div>₹{summary.totalTax.toFixed(2)}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>Discount</div>
                      <div>₹{summary.totalDiscount.toFixed(2)}</div>
                    </div>

                    {couponApplied && summary.couponDiscount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ color: "#52c41a", fontWeight: 600 }}>
                          <GiftOutlined /> Coupon Discount
                        </div>
                        <div style={{ color: "#52c41a", fontWeight: 600 }}>
                          -₹{summary.couponDiscount.toFixed(2)}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: 10, marginTop: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>Total Amount</div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>₹{summary.grandTotal.toFixed(2)}</div>
                    </div>

                    {couponApplied && (
                      <div style={{ marginTop: 8, padding: 8, background: '#f6ffed', borderRadius: 4, fontSize: 12 }}>
                        <Tag color="success">{couponCode}</Tag> applied
                        <div style={{ marginTop: 4, color: '#52c41a' }}>
                          🎁 Discount: ₹{couponData?.discount_amount?.toFixed(2)}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "right", marginTop: 10, alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button onClick={() => form.resetFields()}><ShieldCheck size={16} />Save To Draft</Button>
                        <Button type="primary" htmlType="submit" style={{ background: "#0b75ff", borderColor: "#0b75ff" }}>
                          Add Bill
                        </Button>
                        <Button type="primary" htmlType="submit" style={{ background: "#09b13bff", borderColor: "#09b13bff" }}>
                          <Printer size={16} /> Print
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: 18 }} />
          </Form>
        </Spin>
      </div>

      {/* Success Modal for Generated Coupon */}
      <Modal
        open={showCouponModal}
        onCancel={() => {
          setShowCouponModal(false);
          navigate("/billing/list");
        }}
        footer={[
          <Button
            key="done"
            type="primary"
            onClick={() => {
              setShowCouponModal(false);
              navigate("/billing/list");
            }}
          >
            Done
          </Button>,
        ]}
        width={500}
        centered
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <GiftOutlined style={{ fontSize: 64, color: "#52c41a", marginBottom: 16 }} />
          <Title level={3} style={{ marginBottom: 8 }}>
            Congratulations! 🎉
          </Title>
          <Title level={5} style={{ color: "#666", fontWeight: "normal", marginBottom: 24 }}>
            A referral coupon has been generated for this purchase!
          </Title>

          {generatedCoupon && (
            <Card
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ color: "#fff" }}>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
                  COUPON CODE
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    letterSpacing: 4,
                    marginBottom: 16,
                    fontFamily: "monospace",
                  }}
                >
                  {generatedCoupon.code}
                </div>
                <Divider style={{ borderColor: "rgba(255,255,255,0.3)", margin: "16px 0" }} />
                <Row gutter={16} style={{ textAlign: "left" }}>
                  <Col span={12}>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>Valid From</div>
                    <div style={{ fontSize: 14, fontWeight: "bold" }}>
                      {dayjs(generatedCoupon.valid_from).format("DD MMM YYYY")}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>Valid Until</div>
                    <div style={{ fontSize: 14, fontWeight: "bold" }}>
                      {dayjs(generatedCoupon.valid_until).format("DD MMM YYYY")}
                    </div>
                  </Col>
                </Row>
                <Divider style={{ borderColor: "rgba(255,255,255,0.3)", margin: "16px 0" }} />
                <div style={{ fontSize: 16, fontWeight: "bold" }}>
                  {generatedCoupon.discount}
                </div>
              </div>
            </Card>
          )}

          <Alert
            message={generatedCoupon?.message || "Share this code with friends!"}
            type="info"
            showIcon
            style={{ textAlign: "left" }}
          />
        </div>
      </Modal>
    </div>
  );
}

export default BillingForm;

