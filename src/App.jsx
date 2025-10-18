import { useState } from 'react';
import './App.css';

// Hàm định dạng tiền tệ VNĐ
const formatCurrency = (number) => {
  if (isNaN(number)) return "0 VNĐ";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
};

function App() {
  // --- State cho các ô nhập liệu ---
  const [strategy, setStrategy] = useState('paroli-1-3-6'); // Mặc định là chiến lược mới
  const [initialCapital, setInitialCapital] = useState(10000000);
  const [baseBet, setBaseBet] = useState(100000);
  const [delta, setDelta] = useState(500000);
  const [sessionsPerDay, setSessionsPerDay] = useState(50);
  const [totalDays, setTotalDays] = useState(10);

  // --- State cho kết quả mô phỏng ---
  const [simulationResult, setSimulationResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSimulationResult(null);
    setHistory([]);

    setTimeout(() => {
      // --- Khởi tạo các biến mô phỏng ---
      const capital = Number(initialCapital);
      const betUnit = Number(baseBet);
      const deltaValue = Number(delta);
      const totalSessions = Number(sessionsPerDay) * Number(totalDays);

      let currentCapital = capital;
      let simulationHistory = [];

      let sequenceStep = 0; // Vị trí trong chuỗi cược
      let netProfit = 0;
      let currentBetUnits = 1;

      // --- Vòng lặp mô phỏng chính ---
      for (let i = 1; i <= totalSessions; i++) {
        let currentBetAmount = 0;
        let note = '';
        const isParoli = strategy.startsWith('paroli'); // Kiểm tra có phải chiến lược thắng-tiến
        const isMartingale = strategy.startsWith('martingale'); // Kiểm tra có phải thua-tiến

        // --- Logic quyết định mức cược theo chiến lược ---
        if (isParoli || isMartingale) {
            const sequence = strategy.endsWith('1-3-5') ? [1, 3, 5] : [1, 3, 6];
            currentBetAmount = sequence[sequenceStep] * betUnit;
        } else if (strategy === 'fixedRatio') {
            netProfit = currentCapital - capital;
            const allowedUnits = Math.floor(netProfit / deltaValue) + 1;
            const newBetUnits = Math.max(1, allowedUnits);
            if (newBetUnits > currentBetUnits) note = `Lợi nhuận đạt mốc, tăng cược.`;
            if (newBetUnits < currentBetUnits) note = `Lợi nhuận sụt giảm, giảm cược.`;
            currentBetUnits = newBetUnits;
            currentBetAmount = currentBetUnits * betUnit;
        }

        // --- Kiểm tra điều kiện dừng ---
        if (currentCapital < currentBetAmount) {
          note = 'Hết vốn để cược. Dừng mô phỏng.';
          simulationHistory.push({ round: i, betAmount: 0, result: 'Dừng', capitalAfter: currentCapital, note });
          break;
        }

        // --- Mô phỏng kết quả (50/50) ---
        const isWin = Math.random() < 0.5;
        
        if (isWin) {
          currentCapital += currentBetAmount;
          if (isParoli) {
            note = `Thắng ván ${sequenceStep + 1}. Tăng cược ván sau.`;
            sequenceStep++;
            if (sequenceStep >= 3) {
              note = 'Hoàn thành chuỗi thắng! Quay về mức cược cơ bản.';
              sequenceStep = 0;
            }
          }
          if (isMartingale) {
            note = 'Thắng, quay về mức cược cơ bản.';
            sequenceStep = 0;
          }
        } else { // Thua
          currentCapital -= currentBetAmount;
          if (isParoli) {
            note = 'Thua, chuỗi bị ngắt. Quay về mức cược cơ bản.';
            sequenceStep = 0;
          }
          if (isMartingale) {
            note = `Thua ván ${sequenceStep + 1}, tăng cược ván sau.`;
            sequenceStep++;
            if (sequenceStep >= 3) {
              note = 'Thua cả chuỗi. Chấp nhận lỗ và bắt đầu lại.';
              sequenceStep = 0;
            }
          }
        }

        simulationHistory.push({
          round: i,
          betAmount: currentBetAmount,
          result: isWin ? 'Thắng' : 'Thua',
          capitalAfter: currentCapital,
          note: note,
        });

        if (currentCapital <= 0) {
           simulationHistory[simulationHistory.length - 1].note = 'Vỡ nợ!';
           break;
        }
      }

      const finalCapital = Math.max(0, currentCapital);
      const netProfitLoss = finalCapital - capital;

      setHistory(simulationHistory);
      setSimulationResult({
        initialCapital: capital,
        finalCapital: finalCapital,
        netProfitLoss: netProfitLoss,
      });

      setIsLoading(false);
    }, 50);
  };

  return (
    <div className="container">
      <h1>Bộ Mô Phỏng Chiến Lược Cược</h1>
      
      <form onSubmit={handleSimulate} className="form-container">
        <div className="input-group">
          <label>Chọn Chiến Lược</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="paroli-1-3-6">Gấp thếp KHI THẮNG (1-3-6)</option>
            <option value="paroli-1-3-5">Gấp thếp KHI THẮNG (1-3-5)</option>
            <option value="martingale-1-3-6">Gấp thếp KHI THUA (1-3-6)</option>
            <option value="martingale-1-3-5">Gấp thếp KHI THUA (1-3-5)</option>
            <option value="fixedRatio">Tỷ Lệ Cố Định (Fixed Ratio)</option>
          </select>
        </div>
        <div className="input-group">
          <label>Vốn Ban Đầu (VNĐ)</label>
          <input type="number" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Mức Cược Cơ Bản (1 đơn vị)</label>
          <input type="number" value={baseBet} onChange={(e) => setBaseBet(e.target.value)} required />
        </div>
        {strategy === 'fixedRatio' && (
          <div className="input-group">
            <label>Delta (Lợi nhuận để tăng cược)</label>
            <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} required />
          </div>
        )}
        <div className="input-group">
          <label>Số Phiên / Ngày</label>
          <input type="number" value={sessionsPerDay} onChange={(e) => setSessionsPerDay(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Số Ngày Chơi</label>
          <input type="number" value={totalDays} onChange={(e) => setTotalDays(e.target.value)} required />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang Chạy Mô Phỏng...' : 'Bắt Đầu Chơi'}
        </button>
      </form>

      {simulationResult && (
        <div className="results-container">
          <h2>Tổng Kết Cuối Cùng Sau {totalDays} Ngày</h2>
          <div className="summary">
            <p><strong>Vốn Ban Đầu:</strong> {formatCurrency(simulationResult.initialCapital)}</p>
            <p><strong>Vốn Còn Lại:</strong> {formatCurrency(simulationResult.finalCapital)}</p>
            <p><strong>Lãi/Lỗ Ròng:</strong> 
              <span style={{ color: simulationResult.netProfitLoss >= 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                {formatCurrency(simulationResult.netProfitLoss)}
              </span>
            </p>
          </div>

          <h3>Lịch Sử Chi Tiết Các Phiên Chơi</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Phiên</th>
                  <th>Mức Cược</th>
                  <th>Kết Quả</th>
                  <th>Vốn Sau Cược</th>
                  <th>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.round}>
                    <td>#{item.round}</td>
                    <td>{formatCurrency(item.betAmount)}</td>
                    <td style={{ color: item.result === 'Thắng' ? '#28a745' : '#dc3545' }}>
                      {item.result}
                    </td>
                    <td>{formatCurrency(item.capitalAfter)}</td>
                    <td className="note-cell">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;