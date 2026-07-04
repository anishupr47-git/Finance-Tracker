import { useState, useMemo, useCallback } from 'react';
import './Income.css';

const INTIAL_INFLOWS = [];

const INTIAL_OUTFLOWS = [];

const DEFAULT_SAVINGS_GOAL = 0;

export default function Income() {
    //main app
    const [inflows, setInflows] = useState(INTIAL_INFLOWS);
    const [outflows, setOutflows] = useState(INTIAL_OUTFLOWS);
    const [savingsGoal, setSavingsGoal] = useState(DEFAULT_SAVINGS_GOAL);

    //income
    const [inflowForm, setInflowForm] = useState({ description: '', amount: '', tag: 'Full-Time' });
    const [inflowErrors, setInflowErrors] = useState({ description: '', amount: '' });
    const [infloww, setInflowShake] = useState(false);

   //expense
    const [outflowForm, setOutflowForm] = useState({ title: '', amount: '', tag: 'Housing' });
    const [outflowErrors, setOutflowErrors] = useState({ title: '', amount: '' });
    const [outflowShake, setOutflowShake] = useState(false);

    
    const [cr, setcr] = useState(8);
    const [hori, sethori] = useState(10);

    const formatCurrency = useCallback((value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }, []);


    const inflow = (e) => {
        const { name, value } = e.target;
        setInflowForm((prev) => ({ ...prev, [name]: value }));
        if (inflowErrors[name]) {
            setInflowErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const outflow = (e) => {
        const { name, value } = e.target;
        setOutflowForm((prev) => ({ ...prev, [name]: value }));
        if (outflowErrors[name]) {
            setOutflowErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const inflowsubmit = (e) => {
        e.preventDefault();
        const description = inflowForm.description.trim();
        const amount = parseFloat(inflowForm.amount);

        //validate
        if (!description) {
            setInflowErrors({ description: 'Description cant be blank', amount: '' });
            setInflowShake(true);
            setTimeout(() => setInflowShake(false), 500);
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            setInflowErrors({ description: '', amount: 'Amount must be +ve' });
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

    const outflowsubmit = (e) => {
        e.preventDefault();
        const title = outflowForm.title.trim();
        const amount = parseFloat(outflowForm.amount);

        //simple validate
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

    const deletein = (id) => {
        setInflows((prev) => prev.filter((item) => item.id !== id));
    };
    const deleteout = (id) => {
        setOutflows((prev) => prev.filter((item) => item.id !== id));
    };

    const goaladj = (amount) => {
        setSavingsGoal((prev) => Math.max(0, prev + amount));
    };

    //calculations
    const compute = useMemo(() => {
        const grossInflow = inflows.reduce((sum, item) => sum + item.amount, 0);
        const grossOutflow = outflows.reduce((sum, item) => sum + item.amount, 0);
        const saving = grossInflow - grossOutflow;
        const retention = grossInflow > 0 ? (saving / grossInflow) * 100 : 0;
        
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
            saving,
            retention,
            expenseReduction
        };
    }, [inflows, outflows]);


    const report = useMemo(() => {
        const { grossInflow, saving, retention, expenseReduction } = compute;
        const reports = [];

        if (grossInflow === 0) {
            return [{
                id: 'no-income',
                type: 'danger',
                title: 'No income',
                desc: 'Add some income data to see insights',
                icon: ''
            }];
        }

        const housing = (expenseReduction['Housing'] / grossInflow) * 100;
        if (housing > 40) {
            reports.push({
                id: 'overhead-stress',
                type: 'danger',
                title: 'High housing costs',
                desc: `You're spending ${housing.toFixed(1)}% of your income on housing. Try to reduce it for good`,
                icon: ''
            });
        }

        const entertain = (expenseReduction['Entertainment'] / grossInflow) * 100;
        if (entertain > 15) {
            reports.push({
                id: 'discretionary-leak',
                type: 'warning',
                title: 'High entertainment spending',
                desc: `You're spending ${entertain.toFixed(1)}% on entertainment. Try keeping it low for future savings`,
                icon: ''
            });
        }

        if (saving < 0) {
            reports.push({
                id: 'tier-critical',
                type: 'danger',
                title: 'Spending more than you earn',
                desc: `You're spending ${formatCurrency(Math.abs(saving))} more than you make. Please consider saving otherwise it'll be hard`,
                icon: ''
            });
        } else if (retention < 15) {
            reports.push({
                id: 'tier-warning',
                type: 'warning',
                title: 'Low savings rate',
                desc: `You're saving ${retention.toFixed(1)}%, which is a bit below than the recommendation`,
                icon: ''
            });
        } else if (retention >= 30) {
            reports.push({
                id: 'tier-elite',
                type: 'success',
                title: 'Great savings rate',
                desc: `Awesome job! You are saving ${retention.toFixed(1)}% of your income.`,
                icon: ''
            });
        } else {
            reports.push({
                id: 'tier-healthy',
                type: 'success',
                title: 'Good savings rate',
                desc: `You are saving ${retention.toFixed(1)}% of your income. Vamos`,
                icon: ''
            });
        }
        return reports;
    }, [compute, formatCurrency]);

    //saving projion
    
    const analysiss = useMemo(() => {
        const { saving } = compute;
        const monthlyRate = cr / 100 / 12;
        const result = {
            monthsToGoal: null,
            compoundprojs: [],
            isUnreachable: saving <= 0
        };


        if (saving > 0) {
            result.monthsToGoal = savingsGoal / saving;
        }


        const periods = [1, 3, 5, hori];
        const uperiods = [...new Set(periods)].sort((a, b) => a - b);

        result.compoundprojs = uperiods.map((years) => {
            const totalMonths = years * 12;
            const linearAccumulated = Math.max(0, saving) * totalMonths;

            let accumulate = 0;
            if (saving > 0) {
                if (monthlyRate === 0) {
                    accumulate = linearAccumulated;
                } else {

                    accumulate = saving * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
                }
            }

            const yieldPremium = accumulate - linearAccumulated;

            return {
                years,
                linear: linearAccumulated,
                compounded: accumulate,
                premium: yieldPremium
            };
        });

        return result;
    }, [compute, savingsGoal, cr, hori]);


    const progs = useMemo(() => {
        const radius = 28;
        const circumference = 2 * Math.PI * radius;
        const clamp = Math.min(100, Math.max(0, compute.retention));
        const dashoff = circumference - (clamp / 100) * circumference;

        return {
            radius,
            circumference,
            dashoff
        };
    }, [compute.retention]);

    return (
        <main className='dash-shell'>
            {/*main dash */}
            <header className='dash-header'>
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
                    <button className='btn-delete' onClick={() => goaladj(10000)}>$10k</button>
                    <button className='btn-delete' onClick={() => goaladj(50000)}>50k</button>
                </div>
            </header>

            <section className='metrs-grid' aria-label='Key Performance Indicators'>

                <article className='metr-card inflow-card'>
                    <div className='metrs-header'>
                        <span className='metr-title'>Gross Inflows</span>
                    </div>
                    <div className='metrs-body'>
                        <div className='metrs-value-group'>
                            <div className='metr-value'>{formatCurrency(compute.grossInflow)}</div>
                            <span className='metr-subtext'>Total income</span>
                        </div>
                    </div>
                </article>

                <article className='metr-card outflow'>
                    <div className='metrs-header'>
                        <span className='metr-title'>Gross Outflows</span>
                    </div>
                    <div className='metrs-body'>
                        <div className='metrs-value-group'>
                            <div className='metr-value'>{formatCurrency(compute.grossOutflow)}</div>
                            <span className='metr-subtext'>Total expenses</span>
                        </div>
                    </div>
                </article>

                <article className='metr-card net'>
                    <div className='metrs-header'>
                        <span className='metr-title'>Net Savings</span>
                    </div>
                    <div className='metrs-body'>
                        <div className='metrs-value-group'>
                            <div className='metr-value'>
                                {formatCurrency(compute.saving)}
                            </div>
                            <span className='metr-subtext'>Net savings volume</span>
                        </div>
                    </div>
                </article>

                <article className='metr-card retention-card'>
                    <div className='metrs-header'>
                        <span className='metr-title'>Savings Rate</span>
                    </div>
                    <div className='metrs-body'>
                        <div className='metrs-value-group'>
                            <span className='metr-subtext'>Percentage of income saved</span>
                        </div>

                        <div className='metr-vis-container'>
                            <svg className='prog-svg' viewBox='0 0 68 68'>
                                <circle className='prog-bg' cx="34" cy="34" r={progs.radius} />
                                <circle
                                    className='prog-fill'
                                    cx='34'
                                    cy='34'
                                    r={progs.radius}
                                    strokeDasharray={progs.circumference}
                                    strokeDashoffset={progs.dashoff}
                                />
                            </svg>
                            <div className='prog-text'>
                                {Math.max(0, Math.round(compute.retention))}%
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <section className='dash-grid'>

                <div className='led-container'>

                    <section className='led-panel inflow-leddg' aria-label='Capital Inflow leddg'>
                        <header className='led-panel-header'>
                            <div className='led-panel-title'>
                                <h2>Capital Inflows</h2>
                                <span className='led-badge'>{inflows.length} Source{inflows.length !== 1 ? 's' : ''}</span>
                            </div>
                        </header>

                        <form onSubmit={inflowsubmit} className={`led-form ${infloww ? 'shake-animation' : ''}`} aria-label="Add Inflow incomeing value">
                            <div className='form-group'>
                                <input
                                    type='text'
                                    name='description'
                                    placeholder='Inflow description...'
                                    className='form-field'
                                    value={inflowForm.description}
                                    onChange={inflow}
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
                                        onChange={inflow}
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
                                    onChange={inflow}
                                    aria-label='Inflow Classification Category'
                                >
                                    <option value='Full-Time'>Full-Time</option>
                                    <option value='Side Hustle'>Side Hust Hustle</option>
                                    <option value='Investments'>Investments</option>
                                </select>
                            </div>

                            <button type='submit' className='btn-submit'>
                                <span>+ Insert</span>
                            </button>
                        </form>


                        <div className='leddg-table-wrapper'>
                            <table className='leddg-table'>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Source</th>
                                        <th>Category</th>
                                        <th>Gross Income Rate</th>
                                        <th aria-label='Row Operations'></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inflows.length === 0 ? (
                                        <tr>
                                            <td colSpan='5'>
                                                <div className='table-empty-state'>
                                                    <span className='empty-state-icon'></span>
                                                    <p>No income transactions added</p>
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
                                                        onClick={() => deletein(item.id)}
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

                    <section className='led-panel outflow-leddg' aria-label='Capital Outflow leddg'>
                        <header className='led-panel-header'>
                            <div className='led-panel-title'>
                                <h2>Capital Outgoing</h2>
                                <span className='led-badge'>{outflows.length} Record{outflows.length !== 1 ? 's' : ''}</span>
                            </div>
                        </header>


                        <form onSubmit={outflowsubmit} className={`led-form ${outflowShake ? 'shake-animation' : ''}`} aria-label='Add Outflow Transaction'>
                            <div className='form-group'>
                                <input
                                    type='text'
                                    name='title'
                                    placeholder='Outflow Description'
                                    className='form-field'
                                    value={outflowForm.title}
                                    onChange={outflow}
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
                                        onChange={outflow}
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
                                    onChange={outflow}
                                    aria-label='Outgoing category allocate'
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

                        <div className='leddg-table-wrapper'>
                            <table className='leddg-table'>
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
                                                    <p>No expense transactions added</p>
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
                                                        onClick={() => deleteout(item.id)}
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
                            {report.map((report) => (
                                <article
                                    key={report.id}
                                    className={`insight-banner banner-${report.type}`}
                                >
                                    <div className='insight-banner-content'>
                                        <h3 className='insight-banner-title'>{report.title}</h3>
                                        <p className='insight-banner-desc'>{report.desc}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>


                    <section className='strategy-panel' aria-label='Expense Distri Analysis'>
                        <h2 className='strategy-panel-title'>
                            <span></span>Expense Distribution
                        </h2>
                        <div className='expense-distri-list'>
                            {Object.entries(compute.expenseReduction).map(([category, amount]) => {
                                const totalOutflow = compute.grossOutflow;
                                const percentage = totalOutflow > 0 ? (amount / totalOutflow) * 100 : 0;

                                return (
                                    <div key={category} className='distri-row'>
                                        <div className='distri-meta'>
                                            <span className='distri-label'>
                                                <span className={`distri-indicator-dot indicator-${category.toLowerCase()}`} />
                                                {category}
                                            </span>
                                            <span className='distri-values'>
                                                {formatCurrency(amount)}
                                                <span className='distri-percent'>
                                                    ({percentage.toFixed(1)}%)
                                                </span>
                                            </span>
                                        </div>
                                        <div className='track-bar-bg'>
                                            <div
                                                className={`track-bar-fill bar-${category.toLowerCase()}`}
                                                style={{ width: `${percentage}` }}
                                                role='progbar'
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

                    <section className='strategy-panel' aria-label="Prediction Unit">
                        <h2 className='strategy-panel-title'>
                            <span></span>Compound Savings Runway
                        </h2>

                        <div className='sim-panel'>

                            <div className='sim-slide-group'>
                                <div className='slide-header'>
                                    <span>Expected Investment Yield (APY)</span>
                                    <span className='slide-value'>{cr}%</span>
                                </div>
                                <input
                                    type='range'
                                    min='0'
                                    max='15'
                                    step='0.5'
                                    className='sim-range-input'
                                    value={cr}
                                    onChange={(e) => setcr(parseFloat(e.target.value))}
                                    aria-label='Expected Investment Yield APY'
                                />
                            </div>


                            <div className='sim-slide-group'>
                                <div className='slide-header'>
                                    <span>Forecast Projection Horizon</span>
                                    <span className='slide-value'>{hori} Years</span>
                                </div>
                                <input
                                    type='range'
                                    min='1'
                                    max='20'
                                    step='1'
                                    className='sim-range-input'
                                    value={hori}
                                    onChange={(e) => sethori(parseInt(e.target.value))}
                                    aria-label='Cast Years'
                                />
                            </div>

                            {analysiss.isUnreachable ? (
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
                                        At your current monthly savings rate of {formatCurrency(compute.saving)}, you will achieve your target of {formatCurrency(savingsGoal)} in{' '}
                                        <span className="forecast-highlight">
                                            {analysiss.monthsToGoal.toFixed(1)} months
                                        </span>{' '}
                                        ({(analysiss.monthsToGoal / 12).toFixed(1)} years) under linear growth.
                                    </p>
                                </div>
                            )}

                            {!analysiss.isUnreachable && (
                                <div className='proj-table-wrapper'>
                                    <table className='proj-table'>
                                        <thead>
                                            <tr>
                                                <th>Horizon</th>
                                                <th>Linear Savings</th>
                                                <th>Compound Yield</th>
                                                <th>Compound Premium</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analysiss.compoundprojs.map((proj) => (
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
