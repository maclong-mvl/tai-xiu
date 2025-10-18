import { useCallback, useMemo, useState } from 'react';
import './App.css';

// ===================================================================================
// LÕI MÔ PHỎNG: Cập nhật để sử dụng Hệ Thống Martingale (CỰC KỲ RỦI RO)
// ===================================================================================
const runSingleSessionSimulation = (initialCapital, baseBet) => {
  // 1. Nền tảng Stop-Loss/Take-Profit không đổi
  const takeProfitTarget = initialCapital * 1.25;
  const stopLossTarget = initialCapital * 0.75;

  // 2. KHỞI TẠO BIẾN TRẠNG THÁI
  let currentCapital = initialCapital;
  let vanNumber = 0;
  const detailedLog = [];
  // Bắt đầu với mức cược bằng 1 đơn vị (baseBet)
  let currentBetAmount = baseBet;

  // 3. VÒNG LẶP MÔ PHỎNG
  while (currentCapital > stopLossTarget && currentCapital < takeProfitTarget) {
    vanNumber++;
    let note = '';
    
    // Đảm bảo không cược nhiều hơn số vốn hiện có. Nếu hết vốn, phiên dừng lại.
    if (currentBetAmount > currentCapital) {
      note = 'Không đủ vốn để gấp thếp. Phiên dừng lại.';
      detailedLog.push({
        van: vanNumber, mode: "Martingale", amount: currentBetAmount,
        result: 'Không Thể Cược', capitalAfter: currentCapital, note: note,
      });
      break; 
    }

    // Mô phỏng kết quả ván cược (50/50)
    const isWin = Math.random() < 0.5;
    const resultText = isWin ? 'Thắng' : 'Thua';

    // Cập nhật vốn
    if (isWin) {
      currentCapital += currentBetAmount;
    } else {
      currentCapital -= currentBetAmount;
    }

    // CẬP NHẬT MỨC CƯỢC CHO VÁN SAU THEO QUY TẮC MARTINGALE
    if (isWin) {
      // Thắng -> Quay về mức cược ban đầu
      currentBetAmount = baseBet;
      note = `Thắng! Quay về cược cơ bản.`;
    } else {
      // Thua -> GẤP ĐÔI mức cược
      currentBetAmount *= 2;
      note = `Thua! Gấp đôi cược ván sau lên ${new Intl.NumberFormat('vi-VN').format(currentBetAmount)}`;
    }

    // GHI LẠI NHẬT KÝ VÁN CƯỢC
    detailedLog.push({
      van: vanNumber,
      mode: "Martingale",
      amount: isWin ? currentBetAmount / 2 : currentBetAmount, // Hiển thị mức cược của ván vừa chơi
      result: resultText,
      capitalAfter: currentCapital,
      note: note,
    });

    if (vanNumber > 1000) break;
  }

  const finalResult = currentCapital >= takeProfitTarget ? 'Chốt Lời' : 'Dừng Lỗ';
  const profitOrLoss = currentCapital - initialCapital;

  return {
    finalResult,
    finalCapital: currentCapital,
    profitOrLoss,
    totalBets: vanNumber,
    detailedLog,
  };
};

function App() {
  const [initialCapital, setInitialCapital] = useState(1000000);
  const [baseBet, setBaseBet] = useState(20000);
  const [sessionsPerDay, setSessionsPerDay] = useState(5);
  const [numDays, setNumDays] = useState(1);
  const [simulationResults, setSimulationResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const handleStartSimulation = useCallback(() => {
    if (initialCapital <= 0 || sessionsPerDay <= 0 || baseBet <= 0 || numDays <= 0) {
      setError('Tất cả các trường nhập liệu phải lớn hơn 0.');
      return;
    }
    setError('');
    setIsRunning(true);
    setSimulationResults([]);

    setTimeout(() => {
      const allDaysResults = [];
      let capitalForNextDay = initialCapital;

      for (let day = 1; day <= numDays; day++) {
        const dayResults = { dayNumber: day, startOfDayCapital: capitalForNextDay, sessions: [] };
        let capitalForNextSession = capitalForNextDay;

        for (let session = 1; session <= sessionsPerDay; session++) {
          if(capitalForNextSession <= baseBet) { // Cần ít nhất 1 lần cược để bắt đầu
            break;
          }
          const sessionResult = runSingleSessionSimulation(capitalForNextSession, baseBet);
          dayResults.sessions.push({ ...sessionResult, sessionNumber: session });
          capitalForNextSession = sessionResult.finalCapital;
        }
        
        dayResults.endOfDayCapital = capitalForNextSession;
        dayResults.dayProfitLoss = capitalForNextSession - dayResults.startOfDayCapital;
        allDaysResults.push(dayResults);
        
        capitalForNextDay = capitalForNextSession;
        if(capitalForNextDay <= baseBet) break;
      }

      setSimulationResults(allDaysResults);
      setIsRunning(false);
    }, 100);
  }, [initialCapital, baseBet, sessionsPerDay, numDays]);
  
  const summary = useMemo(() => {
    if (simulationResults.length === 0) return null;
    const finalCapital = simulationResults[simulationResults.length - 1].endOfDayCapital;
    const totalProfitLoss = finalCapital > 0 ? finalCapital - initialCapital : -initialCapital;
    return { finalCapital, totalProfitLoss };
  }, [simulationResults, initialCapital]);

  return (
    <div className="container">
      <header>
        <h1>Mô Phỏng Hệ Thống Martingale (Gấp Thếp)</h1>
        <p className="warning-text">⚠️ CẢNH BÁO: Đây là hệ thống cược cực kỳ rủi ro. Chỉ dùng để tham khảo, không nên áp dụng.</p>
      </header>
      
      <div className="controls-wrapper">
        {isRunning && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Đang mô phỏng...</p>
          </div>
        )}
        <div className="controls">
          <div className="input-group">
            <label htmlFor="initialCapital">Vốn ban đầu</label>
            <input type="number" id="initialCapital" value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label htmlFor="baseBet">Mức cược ban đầu</label>
            <input type="number" id="baseBet" value={baseBet} onChange={(e) => setBaseBet(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label htmlFor="sessionsPerDay">Số phiên mỗi ngày</label>
            <input type="number" id="sessionsPerDay" value={sessionsPerDay} onChange={(e) => setSessionsPerDay(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label htmlFor="numDays">Số ngày chơi</label>
            <input type="number" id="numDays" value={numDays} onChange={(e) => setNumDays(Number(e.target.value))} />
          </div>
          <button onClick={handleStartSimulation} disabled={isRunning}>
            Bắt Đầu Chơi
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>


      <div className="results-area">
        {summary && (
          <div className="summary-result grand-summary">
            <h3>Tổng Kết Cuối Cùng Sau {simulationResults.length} Ngày</h3>
             <div className="summary-details">
              <p><span>Vốn Ban Đầu:</span> {new Intl.NumberFormat('vi-VN').format(initialCapital)} VNĐ</p>
              <p><span>Vốn Còn Lại:</span> {new Intl.NumberFormat('vi-VN').format(summary.finalCapital)} VNĐ</p>
              <p className={summary.totalProfitLoss > 0 ? 'win' : summary.totalProfitLoss < 0 ? 'loss' : ''}>
                <span>Lãi/Lỗ Ròng:</span>
                {new Intl.NumberFormat('vi-VN').format(summary.totalProfitLoss)} VNĐ
              </p>
            </div>
          </div>
        )}

        {simulationResults.map((day) => (
          <div key={day.dayNumber} className="day-result">
             <h2 className="day-header">
              Ngày #{day.dayNumber} - Lãi/Lỗ: 
              <span className={day.dayProfitLoss > 0 ? 'win-text' : day.dayProfitLoss < 0 ? 'loss-text' : ''}>
                {new Intl.NumberFormat('vi-VN').format(day.dayProfitLoss)} VNĐ
              </span>
            </h2>
            <p className="day-capital-flow">Vốn đầu ngày: {new Intl.NumberFormat('vi-VN').format(day.startOfDayCapital)} VNĐ ➡️ Vốn cuối ngày: {new Intl.NumberFormat('vi-VN').format(day.endOfDayCapital)} VNĐ</p>

            {day.sessions.map((session) => (
              <div key={session.sessionNumber} className="session-result-inner">
                 <details>
                  <summary>
                    <strong className={session.finalResult === 'Chốt Lời' ? 'win-text' : 'loss-text'}>
                      Phiên #{session.sessionNumber}: {session.finalResult}
                    </strong>
                     (Lãi/Lỗ: {new Intl.NumberFormat('vi-VN').format(session.profitOrLoss)} VNĐ) - Tổng {session.totalBets} ván
                  </summary>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Ván #</th><th>Hệ Thống</th><th>Mức Cược</th><th>Kết Quả</th><th>Vốn Sau Cược</th><th>Ghi Chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.detailedLog.map((log, index) => (
                          <tr key={index}>
                            <td>{log.van}</td><td>{log.mode}</td><td>{new Intl.NumberFormat('vi-VN').format(log.amount)}</td><td className={log.result === 'Thắng' ? 'win-text' : log.result === 'Thua' ? 'loss-text' : ''}>{log.result}</td><td>{new Intl.NumberFormat('vi-VN').format(log.capitalAfter)}</td><td>{log.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;