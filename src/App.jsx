import { useCallback, useMemo, useState } from 'react';
import './App.css';

// ===================================================================================
// LÕI MÔ PHỎNG: Vẫn giữ nguyên logic cho một phiên chơi
// ===================================================================================
const runSingleSessionSimulation = (initialCapital, baseBet) => {
  const takeProfitTarget = initialCapital * 1.25;
  const stopLossTarget = initialCapital * 0.75;

  let currentCapital = initialCapital;
  let vanNumber = 0;
  let betMode = 'Phòng Thủ';
  let consecutiveWins = 0;
  const detailedLog = [];
  let totalLossAmount = 0; // Biến mới để theo dõi tiền thua

  while (currentCapital > stopLossTarget && currentCapital < takeProfitTarget) {
    vanNumber++;
    let currentBetAmount = baseBet;
    let note = '';

    if (consecutiveWins >= 2) {
      betMode = 'Tấn Công';
      if (consecutiveWins === 2) {
        currentBetAmount = baseBet * 1.5;
        note = 'Thắng 2 liên tiếp -> Bật Tấn Công!';
      } else {
        currentBetAmount = baseBet * 2;
        note = 'Duy trì mức cược Tấn Công.';
      }
    } else {
      betMode = 'Phòng Thủ';
    }

    const isWin = Math.random() < 0.5;
    const resultText = isWin ? 'Thắng' : 'Thua';

    if (isWin) {
      currentCapital += currentBetAmount;
      consecutiveWins++;
    } else {
      currentCapital -= currentBetAmount;
      totalLossAmount += currentBetAmount; // Cộng dồn tiền thua
      if (betMode === 'Tấn Công') {
        note = 'Thua -> Quay về Phòng Thủ.';
      }
      consecutiveWins = 0;
    }

    detailedLog.push({
      van: vanNumber,
      mode: betMode,
      amount: currentBetAmount,
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
    sessionTotalLoss: totalLossAmount, // Trả về tổng tiền thua của phiên
  };
};

function App() {
  const [initialCapital, setInitialCapital] = useState(1000000);
  const [baseBet, setBaseBet] = useState(20000);
  const [sessionsPerDay, setSessionsPerDay] = useState(5);
  const [numDays, setNumDays] = useState(10);
  const [simulationResults, setSimulationResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const handleStartSimulation = useCallback(() => {
    if (initialCapital <= 0 || sessionsPerDay <= 0 || baseBet <= 0 || numDays <= 0) {
      setError('Tất cả các trường nhập liệu phải lớn hơn 0.');
      return;
    }
    if (baseBet > initialCapital * 0.05) {
      setError('Cảnh báo: Mức cược cơ bản nên nhỏ hơn 5% tổng vốn để đảm bảo an toàn.');
      return;
    }
    setError('');
    setIsRunning(true);
    setSimulationResults([]);

    // Dùng setTimeout để UI kịp cập nhật hiệu ứng loading trước khi bắt đầu tính toán nặng
    setTimeout(() => {
      const allDaysResults = [];
      let capitalForNextDay = initialCapital;

      for (let day = 1; day <= numDays; day++) {
        const dayResults = {
          dayNumber: day,
          startOfDayCapital: capitalForNextDay,
          sessions: [],
          dayTotalLoss: 0,
        };
        
        let capitalForNextSession = capitalForNextDay;

        for (let session = 1; session <= sessionsPerDay; session++) {
          if(capitalForNextSession <= 0) break;
          
          const sessionResult = runSingleSessionSimulation(capitalForNextSession, baseBet);
          dayResults.sessions.push({ ...sessionResult, sessionNumber: session });
          dayResults.dayTotalLoss += sessionResult.sessionTotalLoss;
          capitalForNextSession = sessionResult.finalCapital;
        }
        
        dayResults.endOfDayCapital = capitalForNextSession;
        dayResults.dayProfitLoss = capitalForNextSession - dayResults.startOfDayCapital;
        allDaysResults.push(dayResults);
        
        capitalForNextDay = capitalForNextSession;
        if(capitalForNextDay <= 0) break;
      }

      setSimulationResults(allDaysResults);
      setIsRunning(false);
    }, 100); // Delay 100ms
  }, [initialCapital, baseBet, sessionsPerDay, numDays]);

  // TÍNH TOÁN TỔNG KẾT CUỐI CÙNG bằng useMemo để tối ưu hiệu năng
  const summary = useMemo(() => {
    if (simulationResults.length === 0) return null;

    const finalCapital = simulationResults[simulationResults.length - 1].endOfDayCapital;
    const totalProfitLoss = finalCapital > 0 ? finalCapital - initialCapital : -initialCapital;
    const totalMoneyLost = simulationResults.reduce((acc, day) => acc + day.dayTotalLoss, 0);

    return { finalCapital, totalProfitLoss, totalMoneyLost };
  }, [simulationResults, initialCapital]);

  return (
    <div className="container">
      <header>
        <h1>Mô Phỏng Kỷ Luật Chơi Dài Hạn</h1>
        <p>Mô phỏng vốn qua nhiều ngày chơi, mỗi ngày gồm nhiều phiên.</p>
      </header>
      
      <div className="controls-wrapper">
        {/* Lớp phủ loading */}
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
            <label htmlFor="baseBet">Số tiền cược (Cơ bản)</label>
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
        {/* HỘP TỔNG KẾT CUỐI CÙNG */}
        {summary && (
          <div className="summary-result grand-summary">
            <h3>Tổng Kết Cuối Cùng Sau {simulationResults.length} Ngày</h3>
            <div className="summary-details">
              <p><span>Vốn Ban Đầu:</span> {new Intl.NumberFormat('vi-VN').format(initialCapital)} VNĐ</p>
              <p className='loss'><span>Tổng Tiền Đã Mất:</span> {new Intl.NumberFormat('vi-VN').format(summary.totalMoneyLost)} VNĐ</p>
              <p><span>Vốn Còn Lại:</span> {new Intl.NumberFormat('vi-VN').format(summary.finalCapital)} VNĐ</p>
              <p className={summary.totalProfitLoss > 0 ? 'win' : summary.totalProfitLoss < 0 ? 'loss' : ''}>
                <span>Lãi/Lỗ Ròng:</span>
                {new Intl.NumberFormat('vi-VN').format(summary.totalProfitLoss)} VNĐ
              </p>
            </div>
          </div>
        )}

        {/* HIỂN THỊ KẾT QUẢ TỪNG NGÀY */}
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
                          <th>Ván #</th><th>Chế Độ</th><th>Mức Cược</th><th>Kết Quả</th><th>Vốn Sau Cược</th><th>Ghi Chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.detailedLog.map((log) => (
                          <tr key={log.van}>
                            <td>{log.van}</td><td>{log.mode}</td><td>{new Intl.NumberFormat('vi-VN').format(log.amount)}</td><td className={log.result === 'Thắng' ? 'win-text' : 'loss-text'}>{log.result}</td><td>{new Intl.NumberFormat('vi-VN').format(log.capitalAfter)}</td><td>{log.note}</td>
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