import React, {useState, useMemo, useCallback} from 'react';
import './Income.css';

const INTIAL_INFLOWS = [];

const INTIAL_OUTFLOWS = [];

const DEFAULT_SAVINGS_GOAL = 0;

export default function Income() {
    // State Architecture
    const [inflows, setInflows] = useState(INTIAL_INFLOWS);
    const [outflows, setOutflows] = useState(INTIAL_OUTFLOWS);
    const [savingsGoal, setSavingsGoal] = useState(DEFAULT_SAVINGS_GOAL);

    //Form State: Inflows
    const [inflowForm, setInflowForm] = useState({description: '', amount: '', tag: 'Full-Time'});
    const [inflowErrors, setInflowErrors] = useState({description: '', amount: ''});
    const [inflow, setInflowShake] = useState(false);

    //Form State: Outflows
    const[outflowForm, setOutflowForm] = useState({title:'',amount:'',tag:'Housing'});
    const[outflowErrors, setOutflowErrors] = useState({title:'',amount:''});
    const [outflowShake, setOutflowShake] = useState(false);

    //Simulator compounding state
    const [compoundRate, setCompoundRate]= useState(8);
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

  const formatPercentage = useCallback((value)=> {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value/100);
  },);

  //Controlled Form Actions
  const handleInflowChange = (e) => {
    const {name,value} = e.target;
    setInflowForm((prev)=>({...prev, [name]: value}));
    if (inflowErrors[name]) {
        setInflowErrors((prev)=>({...prev, [name]: ''}));
    }
  };

  const handleOutflowChange = (e) => {
    const {name,value} = e.target;
    setOutflowForm((prev)=>({...prev, [name]:value}));
    if (outflowErrors[name]) {
        setOutflowErrors((prev)=> ({...prev, [name]: ''}));
    }
  };

  const handleInflowSubmit = (e) => {
    e.preventDefault();
    let hasError = false;
    const errors = {description: '', amount: ''};

    if (!inflowForm.description.trim()) {
        errors.description = 'Description cannot be blank';
        hasError = true;
    }

    const numAmount = parseFloat(inflowForm.amount);
    if (isNaN(numAmount) || numAmount <=0){
        errors.amount = 'Amount must be positive';
        hasError = true;
    }

    if (hasError) {
        setInflowErrors(erros);
        setInflowShake(true);
        setTimeout(()=>setInflowShake(false),500);
        return;
    }

    const newInflow = {
        id: `in-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
        description: inflowForm.description.trim(),
        amount: numAmount,
        tag: inflowForm.tag,
        date: new Date().toISOString().split('T')[0]
    };

    setInflows((prev)=>[newInflow, ...prev]);
    setInflowForm({description:'',amount:'',tag: 'Full-Time'});
    setInflowErrors({description:'', amount:''});
  };

  const handleOutflowSubmit = (e) => {
    e.preventDefault();
    let hasError = false;
    const errors = {title:'',amount:''};

    if (!outflowForm.title.trim()) {
        errors.title = 'Title cannot be blank';
        hasError = true;
    }

    const numAmount= parseFloat(outflowForm.amount);
    if (isNaN(numAmount)||numAmount <=0) {
        errors.amount = 'Amount must be positive';
        hasError = true;
    }

    if (hasError) {
        setOutflowErrors(errors);
        setOutflowShake(true);
        setTimeout(()=>setOutflowShake(false), 500);
        return;
    }

    const newOutflow = {
        id: `out-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
        title: outflowForm.title.trim(),
        amount: numAmount,
        tag: outflowForm.tag,
        date: new Date().toISOString().split('T')[0]
    };

    setOutflow((prev)=>[newOutflow, ...prev]);
    setOutflowForm({title:'',amount:'', tag:'Housing'});
    setOutflowErrors({title: '', amount: ''});
  };

  const deleteInflow = (id) => {
    setInflows((prev)=>prev.filter((item)=>item.id !== id));
  };
  const deleteOutflow = (id) => {
    setOutflows((prev)=>prev.filter((item)=>item.id !== id));
  };

  const adjustGoal = (amount) => {
    setSavingsGoal ((prev)=>Math.max(0, prev + amount));
  };

  // Memoized Analytical Computations
  const computations = useMemo(()=> {
    const grossInflow = inflows.reduce((sum,item)=> sum+item.amount,0);
    const grossOutflow = outflows.reduce((sum,item)=>sum+item.amount,0);
    const netSavings = grossInflow - grossOutflow;
    const retentionRate = grossInflow > 0 ? (netSavings / grossInflow) * 100 : 0;

    //Reduce expenses to unique category
    const categories = ['Housing', 'Food', 'Entertainment', 'Insurance', 'Other'];
    const expenseReduction = categories.reduce((acc,cat) => {
        acc[cat]=0;
        return acc;
    }, {});

    outflows.forEach((item)=>{
        if (expenseReduction[item.tag] !== undefined) {
            expenseReduction[item.tag] += item.amount;
        } else {
            expenseReduction['Other'] += item.amount;
        }
    });

    return {
        grossInflow,
        grossOutflow,
        netSavings,
        retentionRate,
        expenseReduction
    };
  }, [inflow, outflows]);

  // Custom Autonomous
  const advisoryReports = useMemo(()=> {
    const {grossInflow, netSavings, retentionRate, expenseReduction} = computations;
    const reports = [];

    if (grossInflow ===0){
        return [{
            id: 'no-income',
            type: 'danger',
            title: 'Complete liquidity freeze',
            desc: 'No gross income recorded. Register income cash channels to see calulations.',
            icon: '🛑'
        }];
    }

    // Heuristic 1
    const housingPercent = (expenseReduction['Housing']/grossInflow)*100;
    if (housingPercent > 40) {
        const excessRate = housingPercent - 40;
        reports.push({
            id:'overhead-stress',
            type: 'danger',
            title: 'Overhead distress detected',
            desc: `Housing expenses represent ${housingPercent.toFixed(1)}% of your gross inflows, exceeding the standard threshold by ${excessRate.toFixed(1)}%. Consider scaling auxiliary contract work or seeking structural consolidation.`,
            icon: '🚨'
        });
    }

    // Heuristic 2
    const entertainmentPercent = (expenseReduction['Entertainment']/grossInflow) * 100;
    if (entertainmentPercent > 15) {
        const overspendAmount = expenseReduction['Entertainment'] - (0.15 * grossInflow);
        reports.push({
            id:'discretionary-leak',
            type: 'warning',
            title: 'Discrtionary leak warnings',
            desc: `Entertainment occupies ${entertainmentPercent.toFixed(1)}% of total inflows. Reducing this category down to the recommended 15% threshold saves a net ${formatCurrency(overspendAmount)}/month.`,
            icon: '⚠️'
        });
    }

    // Heuristic 3
    if (netSavings < 0) {
        reports.push({
            id: 'tier-critical',
            type: 'danger',
            title: 'Negative cash flow alert',
            desc: `Warning: You are burning liquidity at ${formatCurrency(Math.abs(netSavings))}/month. Audit variable expense records immediately to seal structural leaks,`,
            icon: ''
        });
    } else if (retentionRate < 15) {
        reports.push({
            id: 'tier-warning',
            type: 'warning',
            title: 'Suboptimal savings rate',
            desc: `Your wealth retention efficiency of ${retentionRate.toFixed(1)}% falls short of the recommended 15% safety tier. Increase monthly side hustles or optimize variable outflows.`,
            icon: ''
        });
    } else if (retentionRate >= 30) {
        reports.push({
            id: 'tier-elite',
            type: 'success',
            title: 'Elite wealth builder status',
            desc: `Outstanding efficieny! Retaining ${retentionRate.toFixed(1)}% of gross monthly intake ranks you in the elite capital accumulation bracket. Compounding curves will accelerate`,
            icon: ''
        });
    } else {
        reports.push({
            id: 'tier-healthy',
            type: 'success',
            title: 'Balanced wealth accumulation',
            desc: `Solid performance. Retaining ${retentionRate.toFixed(1)}% of income allows you to simultaneously finance current standards while funding long-term strategic assets.`,
            icon: ''
        });
    }
    return reports;
  }, [computations, formatCurrency]);

  // Compounding Savings
  const runwayAnalysis= useMemo(()=> {
    const {netSavings}=computations;
    const monthlyRate = compoundRate / 100 / 12;
    const result = {
        monthsToGoal: null,
        compoundProjections: [],
        isUnreachable: netSavings <=0
    };

    // Calculate months to reach saving target linear timeline
    if (netSavings>0){
        result.monthsToGoal= savingsGoal/netSavings;
    }

    // Generate comparison compound interest projection nodes
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
          // Future value of an ordinary annuity formula
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

  // Dynamic SVG Circle
  const circleProgressConfigs = useMemo(()=>{
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const clampedRate = Math.min(100, Math.max(0, computations.retentionRate));
    const strokeDashoffset = circumference - (clampedRate/100) * circumference;

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
                <h1>Wealth Core</h1>
                <p>Interactive Ledger & Autonomous Wealth Retention Engine</p>
                <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop:'0.25rem'}}>
                    Hint: Configure a dynamic Target Capital Goal in the header to project linear and compounding runway estimates.
                </span>
            </div>

            <div className='goal-controller'>
                <span className='goal-label'>Target Capital</span>
                <div className='goal-input-wrapper'>
                    <span className='goal-currency-symbol'>$</span>
                    <input
                    type="number"
                    className='goal-input'
                    value={savingsGoal}
                    onChange={(e)=>setSavingsGoal(Math.max(0, parseInt(e.target.value)||0))}
                    aria-label='Target Capital Savings Goal'
                    />
                </div>
                <button className='btn-delete' style={{padding:'0.2rem 0.5rem', fontSize:'0.8rem', fontWeight:700}} onClick={()=>adjustGoal(10000)}>+$10k</button>
                <button className='btn-delete' style={{padding: '0.2rem 0.5rem', fontSize:'0.8rem', fontWeight:700}} onClick={()=> adjustGoal(50000)}>+50k</button>
            </div>
        </header>
        {/*Four-Core Key Indicators Banner */}
        <section className='metrics-grid' aria-label='Key Performance Indictors'>
            {/*Gross Inflow*/}
            <article className='metric-card inflow-card'>
                <div className='metric-header'>
                    <span className='metric-title'>Gross Inflows</span>
                    <div className='metric-icon-badge'>▲</div>
                </div>
                <div className='metric-body'>
                    <div className='metric-value-group'>
                        <div className='metric-value'>{formatCurrency(computations.grossInflow)}</div>
                        <span className='metric-subtext'>Total active cash receipts</span>
                    </div>
                </div>
            </article>
            {/*Gross Outflow */}
            <article className='metric-card outflow'>
                <div className='metric-header'>
                    <span className='metric-title'>Gross Outflows</span>
                    <div className='metric-icon-badge'>▼</div>
                </div>
                <div className='metric-body'>
                    <div className='metric-value-group'>
                        <div className='metric-value'>{formatCurrency(computations.grossOutflow)}</div>
                        <span className='metric-subtext'>Aggregated expenditure volume</span>
                    </div>
                </div>
            </article>
            {/* Net Savings */}
            <article className='metric-card net'>
                <div className='metric-header'>
                    <span className='metric-title'>Net Savings</span>
                    <div className='metric-icon-badge'>◆</div>
                </div>
                <div className='metric-body'>
                    <div className='metric-value-group'>
                        <div className='metric-value' style={{color: computations.netSavings >= 0? 'var(--accent-emerald)':'var(--accent-rose)'}}>
                            {formatCurrency(computations.netSavings)}
                        </div>
                        <span className='metric-subtext'>Residual cash flow yield</span>
                    </div>
                </div>
            </article>
            {/* Capital Retention */}
            <article className='metric-card retention-card'>
                <div className='metric-header'>
                    <span className='metric-title'>Retention Efficiency</span>
                    <div className='metric-icon-badge'>✦</div>
                </div>
                <div className='metric-body'>
                    <div className='metric-value-group'>
                        <div className='metric-subtext'>Rate of intake retained</div>
                    </div>

                    <div className='metric-vis-container'>
                        <svg className='progress-circle-svg' viewBox='0 0 68 68'>
                            <circle className='progress-circle-bg' cx="34" cy="34" r={circleProgressConfigs.radius}/>
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
        {/* Main Workspace */}
        <section className='dashboard-grid'>
            {/*Left column*/}
            <div className='ledger-container'>
                {/*Inflow Register*/}
                <section className='ledger-panel inflow-ledger' aria-label='Capital Inflow Ledger'>
                    <header className='ledger-panel-header'>
                        <div className='ledger-panel-title'>
                            <h2>Capital Inflows</h2>
                            <span className='ledger-badge'>{inflows.length} Source{inflows.length!==1 ? 's' : ''}</span>
                        </div>
                    </header>
                    {/*Inflow Addition */}
                    <form onSubmit={handleInflowSubmit} className={`ledger-form ${inflow ? 'shake-animation': ''}`} aria-label="Add Inflow Transaction">
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
                            {inflowErrors.description ? (
                                <span className='form-error-msg'>{inflowErrors.description}</span>
                            ) : (
                                <span className='form-hint-text'>e.g., salary, dividend</span>
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
                            {inflowErrors.amount ? (
                                <span className='form-error-msg'>{inflowErrors.amount}</span>
                            ) : (
                                <span className='form-hint-text'>Active intake value</span>
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
                            <span className='form-hint-text'>Revenue Classification</span>
                        </div>

                        <button type='submit' className='btn-submit'>
                            <span>+ Insert</span>
                        </button>
                    </form>

                    {/* Inflow */}
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
                                {inflows.length===0?(
                                    <tr>
                                        <td colSpan='5'>
                                            <div className='table-empty-state'>
                                                <span className='empty-state-icon'></span>
                                                <p>No active cash receipt items registered in current matrix</p>
                                            </div>
                                        </td>
                                    </tr>

                                ): (
                                    inflows.map((item)=>(
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
                                                onClick={()=>deleteInflow(item.id)}
                                                title='Remove Transaction Entry'
                                                aria-label={`Delete ${item.description}`}
                                                ></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                {/*Outflow Register */}
                <section className='ledger-panel outflow-ledger' aria-label='Capital Outflow Ledger'>
                    <header className='ledger-panel-header'>
                        <div className='ledger-panel-title'>
                            <h2>Capital Outflows</h2>
                            <span className='ledger-badge'>{outflows.length} Record{outflows.length !==1 ? 's' : ''}</span>
                        </div>
                    </header>

                    {/*Outflow Addition Form */}
                    <form onSubmit={handleOutflowSubmit} className={`ledger-form ${outflowShake ? 'shake-animation' : ''}`} aria-label='Add Outflow Transaction'>
                        <div className='form-group'>
                            <input
                            type='text'
                            name='title'
                            placeholder='Outflow Description...'
                            className='form-field'
                            value={outflowForm.title}
                            onChange={handleInflowChange}
                            aria-label='Outflow Title'
                        />
                        {outflowErrors.title ? (
                            <span className='form-error-msg'>{outflowErrors.title}</span>
                        ) : (
                            <span className='form-hint-text'>e.g., rent, groceries</span>
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
                            {outflowErrors.amount ? (
                                <span className='form-error-msg'>{outflowErrors.amount}</span>
                            ): (
                                <span className='form-hint-text'>Outflow Volume</span>
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
                            <span className='form-hint-text'>Cost stream group</span>
                        </div>

                        <button type='submit' className='btn-submit' style={{background:'linear-gradient(135deg, var(--accent-rose) 0%, var(--accent-purple) 100%'}}>
                            <span>+ Record</span>
                        </button>
                    </form>
                    {/*Outflow Ledger Entries Table */}
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
                                {outflows.length===0?(
                                    <tr>
                                        <td colSpan="5">
                                            <div className='table-empty-state'>
                                                <span className='empty-state-icon'></span>
                                                <p>No active debit records registered in current matrix.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    outflows.map((item)=>(
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
                                                onClick={()=>deleteOutflow(item.id)}
                                                title='Remove transaction entry'
                                                aria-label={`Delete ${item.title}`}
                                                ></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            {/*Right Column: Strategy, Advisory & Forecasting System */}
            <aside className='strategy-column'>
                {/* Autonomous Advisor Engine */}
                <section className='strategy-panel' aria-label='Autonomous AI Advisor Panel'>
                    <h2 className='strategy-panel-title'>
                        <span></span> Autonomous Strategy Enginer
                    </h2>
                    <div className='advisor-banners-container'>
                        {advisoryReports.map((report)=> (
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

                {/*DYNAMIC COST */}
                <section className='strategy-panel' aria-label='Expense Distribution Analysis'>
                    <h2 className='strategy-panel-title'>
                        <span></span>Expense Distribution
                    </h2>
                    <div className='expense-distribution-list'>
                        {Object.entries(computations.expenseReduction).map(([category, amount])=>{
                            const totalOutflow = computations.grossOutflow;
                            const percentage = totalOutflow > 0 ? (amount/totalOutflow) * 100 : 0;

                            return (
                                <div key={category} className='distribution-row'>
                                    <div className='distribution-meta'>
                                        <span className='distribution-label'>
                                            <span className={`distribution-indicator-dot indicator-${category.toLowerCase()}`}/>
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
                                        style={{width: `${percentage}`}}
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
                {/*FUTURE COMPOUND PROJECTOR*/}
                <section className='strategy-panel' aria-label="Predictive Compounding Projections Simulator">
                    <h2 className='strategy-panel-title'>
                        <span></span>Compound Savings Runway
                    </h2>

                    <div className='simulator-panel'>
                        {/*Compound Yield Interest Rate Slider*/}
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
                            onChange={(e)=> setCompoundRate(parseFloat(e.target.value))}
                            aria-label='Expected Investments Yield APY Percentage'
                            />
                            <span className='form-hint-text'>
                                Models Capital Returns (e.g., 4-6% conservative, 8-10% aggressive)
                            </span>
                        </div>

                        {/* Compounding Horizone Projection Slider */}
                        <div className='simulator-slider-group'>
                            <div className='slider-header'>
                                <span>Forecast Projection Horizon</span>
                                <span className='slider-value'>{forecastHorizon}Years</span>
                            </div>
                            <input
                            type='range'
                            min='1'
                            max='20'
                            step='1'
                            className='simulator-range-input'
                            value={forecastHorizon}
                            onChange={(e)=> setForecastHorizon(parseInt(e.target.value))}
                            aria-label='Forecast Projection Horizon Years'
                            />
                            <span className='form-hint-text'>
                                Sets time horizon for compound vs. linear table growth estimates
                            </span>
                        </div>
                        {/*Dynamic Forecast Narrative*/}
              {runwayAnalysis.isUnreachable ? (
                <div className="forecast-result-card unreachable">
                  <h3 className="forecast-result-title">Deficit Runway Alert</h3>
                  <p className="forecast-result-text">
                    Your runway is currently <span className="forecast-highlight" style={{ borderColor: 'var(--accent-rose)' }}>unreachable</span> due to negative net monthly cash flows. Re-align spending dynamics to initiate positive capital compounding vectors.
                  </p>
                </div>
              ) : (
                <div className="forecast-result-card">
                  <h3 className="forecast-result-title">Strategic Goal Target Forecast</h3>
                  <p className="forecast-result-text">
                    At your current monthly savings rate of {formatCurrency(computations.netSavings)}, you will achieve your target of {formatCurrency(savingsGoal)} in{' '}
                    <span className="forecast-highlight">
                      {runwayAnalysis.monthsToGoal.toFixed(1)} months
                    </span>{' '}
                    ({(runwayAnalysis.monthsToGoal / 12).toFixed(1)} years) under standard linear growth trajectories.
                  </p>
                </div>
              )}
              {/*Compounding Growth Comparison */}
              {!runwayAnalysis.isUnreachable && (
                <div className='projection-table-wrapper'>
                    <table className='projection-table'>
                        <thead>
                            <tr>
                                <th>Horizone</th>
                                <th>Linear Savings</th>
                                <th>Compound Yield</th>
                                <th>Compound Premium</th>
                            </tr>
                        </thead>
                        <tbody>
                            {runwayAnalysis.compoundProjections.map((proj)=> (
                                <tr key={proj.years}>
                                    <td style={{fontWeight: 700}}>Yr {proj.years}</td>
                                    <td>{formatCurrency(proj.linear)}</td>
                                    <td className='proj-compound'>{formatCurrency(proj.compounded)}</td>
                                    <td style={{color: proj.premium > 0 ? 'var(--accent-emerald' : 'var(--text-secondary)',fontWeight:600}}>
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
