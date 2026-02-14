import React from "react";
import { RightOutlined } from "@ant-design/icons";

const styles = {
    statGridCardWrap: { borderRadius: 14, overflow: "hidden", minHeight: 96, boxShadow: "0 10px 30px rgba(2,6,23,0.06)" },
    statInner: { padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" },
    statLeft: { display: "flex", flexDirection: "column", gap: 6 },
    statTitle: { fontSize: 13, fontWeight: 700, opacity: 0.95 },
    statValue: { fontSize: 28, fontWeight: 900, lineHeight: 1 },
    statMeta: { fontSize: 12, opacity: 0.95 },
    statIconCircle: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" },
    statChevron: { width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" },
};

const StatCard = ({ title, value, meta, gradient, icon }) => {
    return (
        <div style={{ ...styles.statGridCardWrap }}>
            <div style={{ ...styles.statInner, background: gradient }}>
                <div style={styles.statLeft}>
                    <div style={styles.statTitle}>{title}</div>
                    <div style={styles.statValue}>{value}</div>
                    <div style={styles.statMeta}>{meta}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                    <div style={styles.statIconCircle}><span style={{ color: "#fff" }}>{icon}</span></div>
                    <div style={styles.statChevron}><RightOutlined style={{ color: "rgba(255,255,255,0.9)" }} /></div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;