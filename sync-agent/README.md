# TSL Asset Sync Agent (Phase A)

อ่านชีต **chek** จาก Excel แล้วส่งเฉพาะรายการที่เปลี่ยนเข้า API

## สร้างไฟล์ติดตั้ง (บนเครื่องพัฒนา)

```powershell
cd sync-agent
npm install
npm run build
```

ได้ไฟล์ที่ `release/`:

| ไฟล์ | ใช้ทำอะไร |
|------|-----------|
| `TSL-Asset-Sync-1.0.0-Setup.zip` | แพ็กเกจติดตั้งสำหรับแจก client |
| `TSL-Asset-Sync.exe` | ตัวรัน sync เดี่ยว (ไม่ต้องมี Node.js) |

## ติดตั้งบนเครื่อง client

1. แตก ZIP
2. **ดับเบิลคลิก `Setup.cmd`**
3. กรอก URL / API key และกดปุ่มเลือกไฟล์ Excel ในหน้าต่างที่ขึ้น
4. ระบบติดตั้งที่ `%LOCALAPPDATA%\TSL-Asset-Sync` และตั้ง Task Scheduler ให้

อย่าดับเบิลคลิก `TSL-Asset-Sync.exe` เพื่อติดตั้ง — ไฟล์นั้นใช้รัน sync หลังติดตั้งแล้ว

ถอนการติดตั้ง: รัน `Uninstall.ps1`

## เตรียมเซิร์ฟเวอร์

```env
SYNC_AGENT_API_KEY="สร้างสตริงสุ่มยาวๆ"
APP_URL="http://192.168.x.x:3000"
```

แล้วรีสตาร์ทแอป

**วิธีที่ได้ API key ไปกับตัวติดตั้ง:** เข้าเมนู Sync Agent ในเว็บ → กด **ดาวน์โหลดตัวติดตั้ง (แนบ API key)**  
ZIP จะมีไฟล์ `install-defaults.json` และ Setup.cmd จะกรอก URL/API key ให้เอง

## ทดสอบด้วยมือ (หลังติดตั้ง)

```powershell
& "$env:LOCALAPPDATA\TSL-Asset-Sync\TSL-Asset-Sync.exe" --ping
& "$env:LOCALAPPDATA\TSL-Asset-Sync\TSL-Asset-Sync.exe" --once
schtasks /Run /TN TSL-SmartAsset-Sync
```

## พฤติกรรม

- อ่านชีต `chek` เท่านั้น
- เก็บ hash ใน `.sync-state.json`
- ส่งเฉพาะแถวที่เปลี่ยน
- ไม่ลบครุภัณฑ์เมื่อแถวหายจาก Excel
