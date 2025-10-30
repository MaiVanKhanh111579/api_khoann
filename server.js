const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Cho phép JSON lớn hơn 100kb (fix lỗi 500)
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// =============================
// DỮ LIỆU PHÂN MẢNH KHOA_NN
// =============================
const FILE = 'data_khoann.json';

// Nếu chưa có file thì tạo trống cho tất cả bảng
if (!fs.existsSync(FILE)) {
  const emptyData = { sinhvien: [], lop: [], dangky: [] };
  fs.writeFileSync(FILE, JSON.stringify(emptyData, null, 2));
}

// Route kiểm tra server
app.get('/', (req, res) => {
  res.send('API Khoa_NN is running!');
});

// API nhận dữ liệu phân mảnh (từ máy chủ gửi xuống)
app.post('/api/khoa_nn', (req, res) => {
  try {
    const inputData = req.body; // object có nhiều bảng
    const currentData = JSON.parse(fs.readFileSync(FILE, 'utf8'));

    // Lặp qua tất cả key trong object gửi tới
    Object.keys(inputData).forEach(table => {
      const newRows = inputData[table] || [];
      const oldRows = currentData[table] || [];

      // UPSERT: cập nhật nếu đã tồn tại, thêm nếu chưa có
      let updatedRows = oldRows;
      newRows.forEach(row => {
        let idx = -1;
        if (table === 'sinhvien') idx = oldRows.findIndex(x => x.MaSV === row.MaSV);
        else if (table === 'lop') idx = oldRows.findIndex(x => x.MaLop === row.MaLop);
        else if (table === 'dangky') idx = oldRows.findIndex(x => x.MaSV === row.MaSV && x.MaMH === row.MaMH);

        if (idx >= 0) updatedRows[idx] = row;
        else updatedRows.push(row);
      });

      currentData[table] = updatedRows;
    });

    // Ghi dữ liệu mới vào file
    fs.writeFileSync(FILE, JSON.stringify(currentData, null, 2));
    res.json({ message: '✅ Đã nhận dữ liệu', received: inputData });
  } catch (err) {
    console.error('❌ Lỗi xử lý API:', err);
    res.status(500).json({ error: err.message });
  }
});

// API GET hiển thị tất cả bảng
app.get('/api/khoa_nn', (req, res) => {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  res.json(data); // trả về object nhiều bảng
});

// Khởi động server, dùng PORT do Render cấp
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Khoa_NN chạy tại cổng ${PORT}`);
});