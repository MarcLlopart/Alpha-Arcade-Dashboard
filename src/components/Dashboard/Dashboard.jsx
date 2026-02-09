import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend, ComposedChart } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, Users, DollarSign, TrendingUp, Sun, Moon, AlertTriangle } from 'lucide-react';
import './Dashboard.css';

const formatCurrency = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
};

const formatNumber = (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return `${Math.round(value)}`;
};

const formatFullCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const Dashboard = () => {
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Transactions'); 
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.remove('light-mode');
        } else {
            document.documentElement.classList.add('light-mode');
        }
    }, [isDarkMode]);

    useEffect(() => {
        fetch('/alpha_arcade_data.csv')
            .then(res => res.text())
            .then(csvText => {
                const data = parseCSV(csvText);
                setRawData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load data", err);
                setLoading(false);
            });
    }, []);

    /* ===============================
       FIX 1: Correct CSV mapping
       Columns:
       0 date
       1 transactions
       2 users
       3 volume
       4 fees
       5 transactions_mtd
       6 users_mtd
       7 volume_mtd
       8 fees_mtd
       9 cumulative volume
       10 cumulative fees
    =============================== */
    const parseCSV = (csvText) => {
        const lines = csvText.trim().split('\n');
        return lines.slice(1).map(line => {
            const v = line.split(',');
            return {
                date: v[0].replace(/"/g, ''),
                transactions: +v[1] || 0,
                users: +v[2] || 0,
                volume: +v[3] || 0,
                fees: +v[4] || 0,

                transactions_mtd: +v[5] || 0,
                users_mtd: +v[6] || 0,
                volume_mtd: +v[7] || 0,
                fees_mtd: +v[8] || 0,

                cumVolume: +v[9] || 0,
                cumFees: +v[10] || 0,
            };
        });
    };

    /* ===============================
       FIX 2: MTD vs previous MTD delta
    =============================== */
    const processedData = useMemo(() => {
        if (!rawData || rawData.length < 2) return null;

        const history = [...rawData].sort((a, b) => a.date.localeCompare(b.date));
        const currentMonth = history[history.length - 1];
        const previousMonth = history[history.length - 2];

        const pct = (curr, prev) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

        return {
            currentTransactions: currentMonth.transactions_mtd,
            currentUsers: currentMonth.users_mtd,
            currentVolume: currentMonth.volume_mtd,
            currentFees: currentMonth.fees_mtd,

            transactionsDelta: pct(currentMonth.transactions_mtd, previousMonth.transactions_mtd),
            usersDelta: pct(currentMonth.users_mtd, previousMonth.users_mtd),
            volumeDelta: pct(currentMonth.volume_mtd, previousMonth.volume_mtd),
            feesDelta: pct(currentMonth.fees_mtd, previousMonth.fees_mtd),

            history
        };
    }, [rawData]);

    if (loading) return <div className="loading">Loading Alpha Arcade Data...</div>;
    if (!rawData) return <div className="error">Failed to load data. Please run the fetcher script.</div>;

    const { 
        currentTransactions, 
        currentUsers, 
        currentVolume, 
        currentFees,
        transactionsDelta,
        usersDelta,
        volumeDelta,
        feesDelta,
        history 
    } = processedData || {};

    /* ===============================
       Charts (unchanged)
    =============================== */
    const chartData = history ? history.slice(-12).map(item => {
        const [year, month] = item.date.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 15);
        return {
            name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            transactions: item.transactions,
            users: item.users,
            volume: item.volume,
            fees: item.fees,
            cumVolume: item.cumVolume,
            cumFees: item.cumFees,
        };
    }) : [];

    const renderChart = () => {
        switch (activeTab) {
            case 'Transactions':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                dy={10}
                                label={{
                                    value: 'Date',
                                    position: 'insideBottom',
                                    offset: -15,
                                    style: {
                                        fill: 'var(--text-primary)',
                                        textAnchor: 'middle'
                                    }
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => formatNumber(val)}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                label={{
                                    value: 'Number of Transactions',
                                    position: 'insideLeft',
                                    angle: -90,
                                    offset: 0,
                                    style: { fill: 'var(--text-primary)', textAnchor: 'middle' }
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ backgroundColor: '#161821', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => [formatNumber(value), 'Transactions']}
                            />
                            <Bar
                                dataKey="transactions"
                                radius={[4, 4, 0, 0]}
                                name="Monthly Transactions"
                                barSize={30}
                                animationDuration={1000}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={isDarkMode ? "#17cac6" : "#830057"} fillOpacity={1} />
                                ))}
                            </Bar>
                            <Legend 
                            wrapperStyle={{ 
                                paddingTop: '20px'
                            }}
                            iconType="line"
                            formatter={(value) => (
                                <span style={{ color: 'var(--text-primary)' }}>{value}</span>
                            )}
                        />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'Users':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                dy={10}
                                label={{
                                    value: 'Date',
                                    position: 'insideBottom',
                                    offset: -15,
                                    style: {
                                        fill: 'var(--text-primary)',
                                        textAnchor: 'middle'
                                    }
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => formatNumber(val)}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                label={{
                                    value: 'Number of Users',
                                    position: 'insideLeft',
                                    angle: -90,
                                    offset: 0,
                                    style: { fill: 'var(--text-primary)', textAnchor: 'middle' }
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ backgroundColor: '#161821', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => [formatNumber(value), 'Users']}
                            />
                            <Bar
                                dataKey="users"
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                                animationDuration={1000}
                                name="Monthly Users"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={ isDarkMode ? "#17cac6" : "#830057"} fillOpacity={1} />
                                ))}
                            </Bar>
                            <Legend 
                            wrapperStyle={{ 
                                paddingTop: '20px'
                            }}
                            iconType="line"
                            formatter={(value) => (
                                <span style={{ color: 'var(--text-primary)' }}>{value}</span>
                            )}
                        />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'Volume':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                dy={10}
                                label={{
                                    value: 'Date',
                                    position: 'insideBottom',
                                    offset: -15,
                                    style: {
                                        fill: 'var(--text-primary)',
                                        textAnchor: 'middle'
                                    }
                                }}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => formatCurrency(val)}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                label={{
                                    value: 'Volume ($)',
                                    position: 'insideLeft',
                                    angle: -90,
                                    offset: 0,
                                    style: { fill: 'var(--text-primary)', textAnchor: 'middle' }
                                }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => formatCurrency(val)}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                label={{
                                    value: 'Total Volume ($)',
                                    position: 'insideRight',
                                    angle: 90,
                                    offset: 0,
                                    style: { fill: 'var(--text-primary)', textAnchor: 'middle' }
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ backgroundColor: '#161821', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value, name) => [
                                    formatFullCurrency(value), 
                                    name === 'Monthly Volume' ? 'Monthly Volume' : 'All-time Volume'
                                ]}
                            />
                            <Legend />
                            <Bar
                                yAxisId="left"
                                dataKey="volume"
                                name="Monthly Volume"
                                fill={isDarkMode ? "#17cac6" : "#830057"}
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                                animationDuration={1000}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="cumVolume"
                                name="All-time Volume"
                                stroke={isDarkMode ? "#830057" : "#17cac6"}
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#ffffff', stroke: isDarkMode ? "#17cac6" : "#830057", strokeWidth: 2 }}
                                animationDuration={1000}
                            />
                            <Legend 
                            wrapperStyle={{ 
                                paddingTop: '20px'
                            }}
                            iconType="line"
                            formatter={(value) => (
                                <span style={{ color: 'var(--text-primary)' }}>{value}</span>
                            )}
                        />
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            case 'Fees':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                dy={10}
                                label={{
                                    value: 'Date',
                                    position: 'insideBottom',
                                    offset: -15,
                                    style: {
                                        fill: 'var(--text-primary)',
                                        textAnchor: 'middle'
                                    }
                                }}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => formatCurrency(val)}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                label={{
                                    value: 'Fees ($)',
                                    position: 'insideLeft',
                                    angle: -90,
                                    offset: 0,
                                    style: { fill: 'var(--text-primary)', textAnchor: 'middle' }
                                }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => formatCurrency(val)}
                                tick={{ fill: isDarkMode ? "#17cac6" : "#830057", fontSize: 12 }}
                                label={{
                                    value: 'Total Fees ($)',
                                    position: 'insideRight',
                                    angle: 90,
                                    offset: 0,
                                    style: { fill: 'var(--text-primary)', textAnchor: 'middle' }
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ backgroundColor: '#161821', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value, name) => [
                                    formatFullCurrency(value), 
                                    name === 'Monthly Fees' ? 'Monthly Fees' : 'All-time Fees'
                                ]}
                            />
                            <Legend />
                            <Bar
                                yAxisId="left"
                                dataKey="fees"
                                name="Monthly Fees"
                                fill={isDarkMode ? "#17cac6" : "#830057"}
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                                animationDuration={1000}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="cumFees"
                                name="All-time Fees"
                                stroke={isDarkMode ? "#830057" : "#17cac6"}
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#ffffff', stroke: isDarkMode ? "#17cac6" : "#830057", strokeWidth: 2 }}
                                animationDuration={1000}
                            />
                            <Legend 
                            wrapperStyle={{ 
                                paddingTop: '20px'
                            }}
                            iconType="line"
                            formatter={(value) => (
                                <span style={{ color: 'var(--text-primary)' }}>{value}</span>
                            )}
                        />
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-top">
                    <div className="logo-area">
                        <div className="badge">
                            <img
                                style={{ width: '32px', height: '32px' }}
                                src={isDarkMode ? "/alpha_arcade_light.png" : "/alpha_arcade_light.png"}
                                alt="Alpha Arcade"
                            />
                        </div>
                        <h1 className="h1-gradient">Alpha Arcade Analytics</h1>
                    </div>
                    <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </header>

            <div className="kpi-grid-4">
                <Card
                    title="Transactions"
                    value={currentTransactions}
                    delta={transactionsDelta}
                    icon={<Activity size={24} />}
                    isActive={activeTab === 'Transactions'}
                    onClick={() => setActiveTab('Transactions')}
                    formatValue={formatNumber}
                />
                <Card
                    title="Users"
                    value={currentUsers}
                    delta={usersDelta}
                    icon={<Users size={24} />}
                    isActive={activeTab === 'Users'}
                    onClick={() => setActiveTab('Users')}
                    formatValue={formatNumber}
                />
                <Card
                    title="Volume"
                    value={currentVolume}
                    delta={volumeDelta}
                    icon={<TrendingUp size={24} />}
                    isActive={activeTab === 'Volume'}
                    onClick={() => setActiveTab('Volume')}
                    formatValue={formatCurrency}
                />
                <Card
                    title="Fees"
                    value={currentFees}
                    delta={feesDelta}
                    icon={<DollarSign size={24} />}
                    isActive={activeTab === 'Fees'}
                    onClick={() => setActiveTab('Fees')}
                    formatValue={formatCurrency}
                />
            </div>

            <div className="chart-section glass-card">
                <div className="chart-header">
                    <div className="chart-tabs">
                        {['Transactions', 'Users', 'Volume', 'Fees'].map(tab => (
                            <button
                                key={tab}
                                className={`chart-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="chart-legend">
                        <span className={`dot ${activeTab.toLowerCase()}-dot`}></span>
                        {activeTab}
                    </div>
                </div>

                <div className="chart-wrapper">
                    {renderChart()}
                </div>
            </div>

            <p className="disclaimer">
                <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
                Data provided Nodely, queried by Algorand Foundation. 
            </p>
        </div>
    );
};

const Card = ({ title, value, delta, icon, isActive, onClick, formatValue = formatCurrency }) => {
    const isPositive = delta >= 0;
    return (
        <div
            className={`kpi-card glass-card ${isActive ? 'active-card' : ''}`}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            <div className="card-icon-wrapper">
                {icon}
            </div>
            <div className="card-content">
                <h3>{title}</h3>
                <div className="card-value">{formatValue(value)}</div>
                <div className={`card-delta ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span>{Math.abs(delta).toFixed(2)}%</span>
                    <span className="delta-label">vs last month (MTD)</span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;