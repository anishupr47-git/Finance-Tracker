import { useState, useMemo, useCallback } from 'react';
import './Income.css';

const INTIAL_INFLOWS = [];

const INTIAL_OUTFLOWS = [];

const DEFAULT_SAVINGS_GOAL = 0;

export default function Income() {
    //Main App place
    const [inflows, setInflows] = useState(INTIAL_INFLOWS);
    const [outflows, setOutflows] = useState(INTIAL_OUTFLOWS);
    const [savingsGoal, setSavingsGoal] = useState(DEFAULT_SAVINGS_GOAL);

    //Income Form place
    const [inflowForm, setInflowForm] = useState({ description: '', amount: '', tag: 'Full-Time' });
    const [inflowErrors, setInflowErrors] = useState({ description: '', amount: '' });
    const [inflow, setInflowShake] = useState(false);

    //Expense Form place
    const [outflowForm, setOutflowForm] = useState({ title: '', amount: '', tag: 'Housing' });
    const [outflowErrors, setOutflowErrors] = useState({ title: '', amount: '' });
    const [outflowShake, setOutflowShake] = useState(false);

    //Projections place
    const [compoundRate, setCompoundRate] = useState(8);
    const [forecastHorizon, setForecastHorizon] = useState(10);

    //Currency & percentage helper
    const formatCurrency = useCallback((value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }, []);


    const handleInflowChange = (e) => {
        const { name, value } = e.target;
        setInflowForm((prev) => ({ ...prev, [name]: value }));
        if (inflowErrors[name]) {
            setInflowErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleOutflowChange = (e) => {
        const { name, value } = e.target;
        setOutflowForm((prev) => ({ ...prev, [name]: value }));
        if (outflowErrors[name]) {
            setOutflowErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleInflowSubmit = (e) => {
        e.preventDefault();
        const description = inflowForm.description.trim();
        const amount = parseFloat(inflowForm.amount);

        // Simple validation
        if (!description) {
            setInflowErrors({ description: 'Description cannot be blank', amount: '' });
            setInflowShake(true);
            setTimeout(() => setInflowShake(false), 500);
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            setInflowErrors({ description: '', amount: 'Amount must be positive' });
            setInflowShake(true);
            setTimeout(() => setInflowShake(false), 500);
            return;
        }

        const newInflow = {
            id: crypto.randomUUID(),
            description: description,
            amount: amount,
            tag: inflowForm.tag,
            date: new Date().toISOString().split('T')[0]
        };

        setInflows((prev) => [newInflow, ...prev]);
        setInflowForm({ description: '', amount: '', tag: 'Full-Time' });
        setInflowErrors({ description: '', amount: '' });
    };

    const handleOutflowSubmit = (e) => {
        e.preventDefault();
        const title = outflowForm.title.trim();
        const amount = parseFloat(outflowForm.amount);

        // Simple validation
        if (!title) {
            setOutflowErrors({ title: 'Title cannot be blank', amount: '' });
            setOutflowShake(true);
            setTimeout(() => setOutflowShake(false), 500);
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            setOutflowErrors({ title: '', amount: 'Amount must be positive' });
            setOutflowShake(true);
            setTimeout(() => setOutflowShake(false), 500);
            return;
        }

        const newOutflow = {
            id: crypto.randomUUID(),
            title: title,
            amount: amount,
            tag: outflowForm.tag,
            date: new Date().toISOString().split('T')[0]
        };

        setOutflows((prev) => [newOutflow, ...prev]);
        setOutflowForm({ title: '', amount: '', tag: 'Housing' });
        setOutflowErrors({ title: '', amount: '' });
    };

    const deleteInflow = (id) => {
        setInflows((prev) => prev.filter((item) => item.id !== id));
    };
    const deleteOutflow = (id) => {
        setOutflows((prev) => prev.filter((item) => item.id !== id));
    };

    const adjustGoal = (amount) => {
        setSavingsGoal((prev) => Math.max(0, prev + amount));
    };

    //Calculations
    const computations = useMemo(() => {
        const grossInflow = inflows.reduce((sum, item) => sum + item.amount, 0);
        const grossOutflow = outflows.reduce((sum, item) => sum + item.amount, 0);
        const netSavings = grossInflow - grossOutflow;
        const retentionRate = grossInflow > 0 ? (netSavings / grossInflow) * 100 : 0;
        // Group expenses by category
        let expenseReduction = {
            Housing: 0,
            Food: 0,
            Entertainment: 0,
            Insurance: 0,
            Other: 0
        };

        for (let item of outflows) {
            if (expenseReduction[item.tag] !== undefined) {
                expenseReduction[item.tag] += item.amount;
            } else {
                expenseReduction['Other'] += item.amount;
            }
        }

        return {
            grossInflow,
            grossOutflow,
            netSavings,
            retentionRate,
            expenseReduction
        };
    }, [inflows, outflows]);


    const advisoryReports = useMemo(() => {
        const { grossInflow, netSavings, retentionRate, expenseReduction } = computations;
        const reports = [];

        if (grossInflow === 0) {
            return [{
                id: 'no-income',
                type: 'danger',
                title: 'No income',
                desc: 'Add some income to see your insights.',
                icon: ''
            }];
        }

        const housingPercent = (expenseReduction['Housing'] / grossInflow) * 100;
        if (housingPercent > 40) {
            reports.push({
                id: 'overhead-stress',
                type: 'danger',
                title: 'High housing costs',
                desc: `You're spending ${housingPercent.toFixed(1)}% of your income on housing. Try to keep this under 40% if possible.`,
                icon: ''
            });
        }

        const entertainmentPercent = (expenseReduction['Entertainment'] / grossInflow) * 100;
        if (entertainmentPercent > 15) {
            reports.push({
                id: 'discretionary-leak',
                type: 'warning',
                title: 'High entertainment spending',
                desc: `You're spending ${entertainmentPercent.toFixed(1)}% on entertainment. Try keeping it under 15% to save more.`,
                icon: ''
            });
        }

        if (netSavings < 0) {
            reports.push({
                id: 'tier-critical',
                type: 'danger',
                title: 'Spending more than you earn',
                desc: `You're spending ${formatCurrency(Math.abs(netSavings))} more than you make. Consider cutting down on some expenses.`,
                icon: ''
            });
        } else if (retentionRate < 15) {
            reports.push({
                id: 'tier-warning',
                type: 'warning',
                title: 'Low savings rate',
                desc: `You're saving ${retentionRate.toFixed(1)}%, which is a bit below the recommended 15%.`,
                icon: ''
            });
        } else if (retentionRate >= 30) {
            reports.push({
                id: 'tier-elite',
                type: 'success',
                title: 'Great savings rate',
                desc: `Awesome job! You are saving ${retentionRate.toFixed(1)}% of your income.`,
                icon: ''
            });
        } else {
            reports.push({
                id: 'tier-healthy',
                type: 'success',
                title: 'Good savings rate',
                desc: `You are saving ${retentionRate.toFixed(1)}% of your income. Keep it up!`,
                icon: ''
            });
        }
        return reports;
    }, [computations, formatCurrency]);

    // Savings Projections
    const runwayAnalysis = useMemo(() => {
        const { netSavings } = computations;
        const monthlyRate = compoundRate / 100 / 12;
        const result = {
            monthsToGoal: null,
            compoundProjections: [],
            isUnreachable: netSavings <= 0
        };


        if (netSavings > 0) {
            result.monthsToGoal = savingsGoal / netSavings;
        }


        const periods = [1, 3, 5, forecastHorizon];
        const uniquePeriods = [...new Set(periods)].sort((a, b) => a - b);

        result.compoundProjections = uniquePeriods.map((years) => {
            const totalMonths = years * 12;
            const linearAccumulated = Math.max(0, netSavings) * totalMonths;

            let compoundedAccumulated = 0;
            if (netSavings > 0) {
                if (monthlyRate === 0) {
                    compoundedAccumulated = linearAccumulated;
                } else {

                    compoundedAccumulated = netSavings * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
                }
            }

            const yieldPremium = compoundedAccumulated - linearAccumulated;

            return {
                years,
                linear: linearAccumulated,
                compounded: compoundedAccumulated,
                premium: yieldPremium
            };
        });

        return result;
    }, [computations, savingsGoal, compoundRate, forecastHorizon]);


    const circleProgressConfigs = useMemo(() => {
        const radius = 28;
        const circumference = 2 * Math.PI * radius;
        const clampedRate = Math.min(100, Math.max(0, computations.retentionRate));
        const strokeDashoffset = circumference - (clampedRate / 100) * circumference;

        return {
            radius,
            circumference,
            strokeDashoffset
        };
    }, [computations.retentionRate]);

    return (
        <main className='dashboard-shell'>
            {/*main dashboard */}
            <header className='dashboard-header'>
                <div className='brand-section'>
                    <h1>Finance Tracker</h1>
                    <p>Interactive financial ledger and savings planner</p>
                </div>

                <div className='goal-controller'>
                    <span className='goal-label'>Target Savings</span>
                    <div className='goal-input-wrapper'>
                        <span className='goal-currency-symbol'>$</span>
                        <input
                            type="number"
                            className='goal-input'
                            value={savingsGoal}
                            onChange={(e) => setSavingsGoal(Math.max(0, parseInt(e.target.value) || 0))}
                            aria-label='Target Savings Goal'
                        />
                    </div>
                    <button className='btn-delete' onClick={() => adjustGoal(10000)}>$10k</button>
                    <button className='btn-delete' onClick={() => adjustGoal(50000)}>50k</button>
                </div>
            </header>

            <section className='metrics-grid' aria-label='Key Performance Indicators'>

                <article className='metric-card inflow-card'>
                    <div className='metric-header'>
                        <span className='metric-title'>Gross Inflows</span>
                    </div>
                    <div className='metric-body'>
                        <div className='metric-value-group'>
                            <div className='metric-value'>{formatCurrency(computations.grossInflow)}</div>
                            <span className='metric-subtext'>Total income</span>
                        </div>
                    </div>
                </article>

                <article className='metric-card outflow'>
                    <div className='metric-header'>
                        <span className='metric-title'>Gross Outflows</span>
                    </div>
                    <div className='metric-body'>
                        <div className='metric-value-group'>
                            <div className='metric-value'>{formatCurrency(computations.grossOutflow)}</div>
                            <span className='metric-subtext'>Total expenses</span>
                        </div>
                    </div>
                </article>

                <article className='metric-card net'>
                    <div className='metric-header'>
                        <span className='metric-title'>Net Savings</span>
                    </div>
                    <div className='metric-body'>
                        <div className='metric-value-group'>
                            <div className='metric-value'>
                                {formatCurrency(computations.netSavings)}
                            </div>
                            <span className='metric-subtext'>Net savings volume</span>
                        </div>
                    </div>
                </article>

                <article className='metric-card retention-card'>
                    <div className='metric-header'>
                        <span className='metric-title'>Savings Rate</span>
                    </div>
                    <div className='metric-body'>
                        <div className='metric-value-group'>
                            <span className='metric-subtext'>Percentage of income saved</span>
                        </div>

                        <div className='metric-vis-container'>
                            <svg className='progress-circle-svg' viewBox='0 0 68 68'>
                                <circle className='progress-circle-bg' cx="34" cy="34" r={circleProgressConfigs.radius} />
                                <circle
                                    className='progress-circle-fill'
                                    cx='34'
                                    cy='34'
                                    r={circleProgressConfigs.radius}
                                    strokeDasharray={circleProgressConfigs.circumference}
                                    strokeDashoffset={circleProgressConfigs.strokeDashoffset}
                                />
                            </svg>
                            <div className='progress-circle-text'>
                                {Math.max(0, Math.round(computations.retentionRate))}%
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <section className='dashboard-grid'>

                <div className='ledger-container'>

                    <section className='ledger-panel inflow-ledger' aria-label='Capital Inflow Ledger'>
                        <header className='ledger-panel-header'>
                            <div className='ledger-panel-title'>
                                <h2>Capital Inflows</h2>
                                <span className='ledger-badge'>{inflows.length} Source{inflows.length !== 1 ? 's' : ''}</span>
                            </div>
                        </header>

                        <form onSubmit={handleInflowSubmit} className={`ledger-form ${inflow ? 'shake-animation' : ''}`} aria-label="Add Inflow Transaction">
                            <div className='form-group'>
                                <input
                                    type='text'
                                    name='description'
                                    placeholder='Inflow description...'
                                    className='form-field'
                                    value={inflowForm.description}
                                    onChange={handleInflowChange}
                                    aria-label='Inflow Description'
                                />
                                {inflowErrors.description && (
                                    <span className='form-error-msg'>{inflowErrors.description}</span>
                                )}
                            </div>

                            <div className='form-group'>
                                <div className='form-input-wrapper'>
                                    <span className='currency-tag'>$</span>
                                    <input
                                        type='number'
                                        name='amount'
                                        placeholder='Amount'
                                        className='form-field'
                                        step='0.01'
                                        value={inflowForm.amount}
                                        onChange={handleInflowChange}
                                        aria-label='Inflow Amount'
                                    />
                                </div>
                                {inflowErrors.amount && (
                                    <span className='form-error-msg'>{inflowErrors.amount}</span>
                                )}
                            </div>

                            <div className='form-group'>
                                <select
                                    name='tag'
                                    className='form-field'
                                    value={inflowForm.tag}
                                    onChange={handleInflowChange}
                                    aria-label='Inflow Classification Category'
                                >
                                    <option value='Full-Time'>Full-Time</option>
                                    <option value='Side Hustle'>Side Hustle</option>
                                    <option value='Investments'>Investments</option>
                                </select>
                            </div>

                            <button type='submit' className='btn-submit'>
                                <span>+ Insert</span>
                            </button>
                        </form>


                        <div className='ledger-table-wrapper'>
                            <table className='ledger-table'>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Source</th>
                                        <th>Category</th>
                                        <th>Gross Volume</th>
                                        <th aria-label='Row Operations'></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inflows.length === 0 ? (
                                        <tr>
                                            <td colSpan='5'>
                                                <div className='table-empty-state'>
                                                    <span className='empty-state-icon'></span>
                                                    <p>No income transactions added yet.</p>
                                                </div>
                                            </td>
                                        </tr>

                                    ) : (
                                        inflows.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.date}</td>
                                                <td className='row-desc'>{item.description}</td>
                                                <td>
                                                    <span className={`row-tag tag-${item.tag.toLowerCase().replace(/\s+/g, '')}`}>
                                                        {item.tag}
                                                    </span>
                                                </td>
                                                <td className='row-amount positive'>
                                                    +{formatCurrency(item.amount)}
                                                </td>
                                                <td className='row-actions'>
                                                    <button
                                                        className='btn-delete'
                                                        onClick={() => deleteInflow(item.id)}
                                                        title='Remove Transaction Entry'
                                                        aria-label={`Delete ${item.description}`}
                                                    >Delete</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className='ledger-panel outflow-ledger' aria-label='Capital Outflow Ledger'>
                        <header className='ledger-panel-header'>
                            <div className='ledger-panel-title'>
                                <h2>Capital Outflows</h2>
                                <span className='ledger-badge'>{outflows.length} Record{outflows.length !== 1 ? 's' : ''}</span>
                            </div>
                        </header>


                        <form onSubmit={handleOutflowSubmit} className={`ledger-form ${outflowShake ? 'shake-animation' : ''}`} aria-label='Add Outflow Transaction'>
                            <div className='form-group'>
                                <input
                                    type='text'
                                    name='title'
                                    placeholder='Outflow Description...'
                                    className='form-field'
                                    value={outflowForm.title}
                                    onChange={handleOutflowChange}
                                    aria-label='Outflow Title'
                                />
                                {outflowErrors.title && (
                                    <span className='form-error-msg'>{outflowErrors.title}</span>
                                )}
                            </div>

                            <div className='form-group'>
                                <div className='form-input-wrapper'>
                                    <span className='currency-tag'>$</span>
                                    <input
                                        type='number'
                                        name='amount'
                                        placeholder='Amount'
                                        className='form-field'
                                        step='0.01'
                                        value={outflowForm.amount}
                                        onChange={handleOutflowChange}
                                        aria-label='Outflow Amount'
                                    />

                                </div>
                                {outflowErrors.amount && (
                                    <span className='form-error-msg'>{outflowErrors.amount}</span>
                                )}
                            </div>

                            <div className='form-group'>
                                <select
                                    name='tag'
                                    className='form-field'
                                    value={outflowForm.tag}
                                    onChange={handleOutflowChange}
                                    aria-label='Outflow Category Allocation'
                                >
                                    <option value='Housing'>Housing</option>
                                    <option value='Food'>Food</option>
                                    <option value='Entertainment'>Entertainment</option>
                                    <option value='Insurance'>Insurance</option>
                                    <option value='Other'>Other</option>
                                </select>
                            </div>

                            <button type='submit' className='btn-submit'>
                                <span>+ Record</span>
                            </button>
                        </form>

                        <div className='ledger-table-wrapper'>
                            <table className='ledger-table'>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Recipient/Item</th>
                                        <th>Category</th>
                                        <th>Gross Volume</th>
                                        <th aria-label='Row Operations'></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {outflows.length === 0 ? (
                                        <tr>
                                            <td colSpan="5">
                                                <div className='table-empty-state'>
                                                    <span className='empty-state-icon'></span>
                                                    <p>No expense transactions added yet.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        outflows.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.date}</td>
                                                <td className='row-desc'>{item.title}</td>
                                                <td>
                                                    <span className={`row-tag tag-${item.tag.toLowerCase()}`}>
                                                        {item.tag}
                                                    </span>
                                                </td>
                                                <td className='row-amount negative'>
                                                    -{formatCurrency(item.amount)}
                                                </td>
                                                <td className='row-actions'>
                                                    <button
                                                        className='btn-delete'
                                                        onClick={() => deleteOutflow(item.id)}
                                                        title='Remove transaction entry'
                                                        aria-label={`Delete ${item.title}`}
                                                    >Delete</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <aside className='strategy-column'>

                    <section className='strategy-panel' aria-label='Strategy Advisor Panel'>
                        <h2 className='strategy-panel-title'>
                            <span></span> Strategy Advisor
                        </h2>
                        <div className='advisor-banners-container'>
                            {advisoryReports.map((report) => (
                                <article
                                    key={report.id}
                                    className={`insight-banner banner-${report.type}`}
                                >
                                    <span className='insight-banner-icon'>{report.icon}</span>
                                    <div className='insight-banner-content'>
                                        <h3 className='insight-banner-title'>{report.title}</h3>
                                        <p className='insight-banner-desc'>{report.desc}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>


                    <section className='strategy-panel' aria-label='Expense Distribution Analysis'>
                        <h2 className='strategy-panel-title'>
                            <span></span>Expense Distribution
                        </h2>
                        <div className='expense-distribution-list'>
                            {Object.entries(computations.expenseReduction).map(([category, amount]) => {
                                const totalOutflow = computations.grossOutflow;
                                const percentage = totalOutflow > 0 ? (amount / totalOutflow) * 100 : 0;

                                return (
                                    <div key={category} className='distribution-row'>
                                        <div className='distribution-meta'>
                                            <span className='distribution-label'>
                                                <span className={`distribution-indicator-dot indicator-${category.toLowerCase()}`} />
                                                {category}
                                            </span>
                                            <span className='distribution-values'>
                                                {formatCurrency(amount)}
                                                <span className='distribution-percent'>
                                                    ({percentage.toFixed(1)}%)
                                                </span>
                                            </span>
                                        </div>
                                        <div className='tracking-bar-bg'>
                                            <div
                                                className={`tracking-bar-fill bar-${category.toLowerCase()}`}
                                                style={{ width: `${percentage}` }}
                                                role='progressbar'
                                                aria-valuenow={percentage}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className='strategy-panel' aria-label="Predictive Compounding Projections Simulator">
                        <h2 className='strategy-panel-title'>
                            <span></span>Compound Savings Runway
                        </h2>

                        <div className='simulator-panel'>

                            <div className='simulator-slider-group'>
                                <div className='slider-header'>
                                    <span>Expected Investment Yield (APY)</span>
                                    <span className='slider-value'>{compoundRate}%</span>
                                </div>
                                <input
                                    type='range'
                                    min='0'
                                    max='15'
                                    step='0.5'
                                    className='simulator-range-input'
                                    value={compoundRate}
                                    onChange={(e) => setCompoundRate(parseFloat(e.target.value))}
                                    aria-label='Expected Investment Yield APY'
                                />
                            </div>


                            <div className='simulator-slider-group'>
                                <div className='slider-header'>
                                    <span>Forecast Projection Horizon</span>
                                    <span className='slider-value'>{forecastHorizon} Years</span>
                                </div>
                                <input
                                    type='range'
                                    min='1'
                                    max='20'
                                    step='1'
                                    className='simulator-range-input'
                                    value={forecastHorizon}
                                    onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                                    aria-label='Forecast Projection Horizon Years'
                                />
                            </div>

                            {runwayAnalysis.isUnreachable ? (
                                <div className="forecast-result-card unreachable">
                                    <h3 className="forecast-result-title">Uh-Oh, Cash Alert!</h3>
                                    <p className="forecast-result-text">
                                        You are spending <span className="forecast-highlight">way more</span> than you make. You gotta cut down on spending so your money can actually grow!
                                    </p>
                                </div>
                            ) : (
                                <div className="forecast-result-card">
                                    <h3 className="forecast-result-title">Goal Target Forecast</h3>
                                    <p className="forecast-result-text">
                                        At your current monthly savings rate of {formatCurrency(computations.netSavings)}, you will achieve your target of {formatCurrency(savingsGoal)} in{' '}
                                        <span className="forecast-highlight">
                                            {runwayAnalysis.monthsToGoal.toFixed(1)} months
                                        </span>{' '}
                                        ({(runwayAnalysis.monthsToGoal / 12).toFixed(1)} years) under linear growth.
                                    </p>
                                </div>
                            )}

                            {!runwayAnalysis.isUnreachable && (
                                <div className='projection-table-wrapper'>
                                    <table className='projection-table'>
                                        <thead>
                                            <tr>
                                                <th>Horizon</th>
                                                <th>Linear Savings</th>
                                                <th>Compound Yield</th>
                                                <th>Compound Premium</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {runwayAnalysis.compoundProjections.map((proj) => (
                                                <tr key={proj.years}>
                                                    <td>Yr {proj.years}</td>
                                                    <td>{formatCurrency(proj.linear)}</td>
                                                    <td className='proj-compound'>{formatCurrency(proj.compounded)}</td>
                                                    <td>
                                                        +{formatCurrency(proj.premium)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </aside>
            </section>
        </main>
    );
}
