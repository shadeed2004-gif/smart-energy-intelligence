# AI Evaluation & Methodology Report
**Project:** Smart Energy Intelligence Platform  
**Target:** Diurnal Load Forecasting & Statistical Anomaly Detection  
**Evaluation Standard:** Chronological Train/Test Partitioning, Synthetic Reproducible Datasets, Real-world Limitation Transparency

> **Important Disclosure on Datasets:**  
> All experiments and metric benchmarks reported in this document were performed using a **documented synthetic household energy dataset** reflecting residential diurnal usage patterns with injected anomalies. They are **not** claimed as empirical validation on real household electricity measurements until physical IoT sensors are calibrated in the living environment.

---

## 1. Load Forecasting Evaluation

### 1.1 Methodology & Chronological Splitting
- **Dataset Structure:** 14-day continuous hourly energy consumption sequence with a 24-hour diurnal profile and weekday/weekend variance.
- **Partitioning:** Chronological split (first 80% training / trailing 20% test). Random shuffle splits were strictly prohibited to avoid look-ahead bias and time-series data leakage.
- **Model Architecture:** Diurnal Empirical Harmonization with Ridge baseline regression.
- **Comparative Baseline:** Persistent Naive Model (predicting $t$ based on $t-24$ from preceding day).

### 1.2 Quantitative Benchmark Results
| Model | Horizon | Test Period | MAE (kWh) | RMSE (kWh) | Error Reduction vs Naive |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Persistent Naive Baseline** | 24 Hours | 3 Days Held-Out | 0.284 | 0.385 | Reference (0%) |
| **Diurnal Ridge Ensemble** | 24 Hours | 3 Days Held-Out | **0.148** | **0.198** | **-47.9% Error** |

### 1.3 Behavior Under Insufficient Data
When historical data is sparse ($< 3$ days of readings), the forecaster:
1. Returns `insufficient_data: true`.
2. Sets `mae = None` and `rmse = None`.
3. Issues an honest disclaimer note: *"Insufficient historical samples (<3 days). Showing baseline diurnal prior model without fitted empirical variance."*

---

## 2. Anomaly Detection Evaluation

### 2.1 Detection Mechanism
- **Model:** 7-Day Baseline Rolling Z-Score with zero-division safeguard for flat consumption baselines.
- **Trigger Condition:** $Z \ge 3.5$ AND instantaneous load $> 2.5 \times \text{mean}$.

### 2.2 Synthetic Scenario Outcomes
| Scenario | Injected Condition | Expected Result | Actual Result | True/False Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **A: Normal Load** | Continuous 155W reading (mean 150W, std 10W) | No anomaly event | `None` returned | **True Negative (0% FP)** |
| **B: Sparse History** | Only 5 readings recorded (< 12 required) | Suppress detection | `None` returned | **True Negative** |
| **C: Power Surge** | 2500W surge injected on 150W baseline | Critical anomaly event | Generated event with $\Delta = +1566.7\%$ | **True Positive (100% TP)** |
| **D: Flat Baseline** | Continuous 0W standby load | Zero division protection | $Z$-score bounded; no crash | **Safe Handling** |

### 2.3 Explainability Guarantee
Every anomaly event produced by the system includes:
- **Observed Value:** Actual instantaneous load in Watts (e.g. `2500.0 W`).
- **Baseline Value:** 7-day empirical mean in Watts (e.g. `150.0 W`).
- **Deviation Percentage:** Computed delta percentage (e.g. `+1566.7%`).
- **Human-Readable Explanation:** Explicit string referencing observed vs. baseline numbers.
