 # CEFR AI Coach

เว็บฝึกอังกฤษเพื่อเตรียมสอบ CEFR แบบทำโจทย์ต่อเนื่อง มีคะแนนสะสม ข้อโบนัส กดคำศัพท์เพื่อดูคำแปล และต่อ AI ได้ผ่าน backend

## ฟีเจอร์หลัก

- โจทย์เยอะกว่าเดิมมาก ครอบคลุม Grammar, Vocabulary, Reading, Writing และ Use of English
- ทำโจทย์ต่อเนื่อง: ตอบ -> ดูเฉลย -> กดข้อต่อไป
- โหมดชุดฝึก 10 ข้อ พร้อมสรุปคะแนนท้ายชุดและรายการข้อที่ควรทบทวน
- ทุกข้อเป็นข้อเก็บคะแนน และบางข้อเป็นข้อโบนัสคะแนนสูงกว่า
- กดคำอังกฤษในโจทย์เพื่อดูคำแปลไทย คำอธิบาย และตัวอย่าง
- ใช้บนมือถือได้ดีขึ้น และมี manifest สำหรับติดตั้งเป็นเว็บแอปบนมือถือ
- ถ้าใส่ `GEMINI_API_KEY` หรือ `OPENAI_API_KEY` จะให้ AI สร้างโจทย์สดและตรวจคำตอบได้ละเอียดขึ้น
- ถ้าไม่ใส่ key ก็ยังรันได้ด้วยคลังโจทย์ในเครื่อง

## วิธีรันในเครื่อง

```bash
npm start
```

เปิดเว็บที่:

```text
http://localhost:4173
```

ถ้า Windows ขึ้นว่า `npm is not recognized` ให้ติดตั้ง Node.js LTS ก่อน:

```powershell
winget install OpenJS.NodeJS.LTS
```

จากนั้นปิด VS Code แล้วเปิดใหม่ หรือจะรันแบบไม่ผ่าน npm ก็ได้:

```powershell
node server.mjs
```

หรือดับเบิลคลิก `start-windows.bat`

ถ้าจะเปิด AI mode ด้วย Gemini ให้ตั้งค่า key ก่อนรัน:

```powershell
$env:GEMINI_API_KEY="ใส่ Gemini API key ของคุณที่นี่"
node server.mjs
```

ถ้าจะใช้ OpenAI:

```powershell
$env:OPENAI_API_KEY="ใส่คีย์ของคุณที่นี่"
npm start
```

## เอาไปรันบนเว็บจริง

เว็บนี้เป็น Node server ตัวเดียว จึงเอาไป deploy ได้กับบริการที่รองรับ Node.js เช่น Render, Railway, Fly.io, VPS หรือ container hosting

ค่าที่ต้องตั้งบนเว็บโฮสต์:

- Build command: ไม่ต้องใส่ หรือใช้ `npm install` ถ้าแพลตฟอร์มบังคับ
- Start command: `npm start`
- Port: ใช้ค่าจาก environment variable `PORT` ได้เลย ระบบอ่านให้อัตโนมัติ
- Environment variable สำหรับ AI: `OPENAI_API_KEY`
- ถ้าใช้ Gemini ให้ตั้ง `GEMINI_API_KEY`
- ถ้าใส่ทั้งสองตัว ระบบจะใช้ Gemini ก่อน เว้นแต่ตั้ง `AI_PROVIDER=openai`

ถ้าใช้ Docker:

```bash
docker build -t cefr-ai-coach .
docker run -p 4173:4173 --env OPENAI_API_KEY=AIzaSyDMSY2bVcJ-_bIV-ogFFVcPF4AmLWu_Yvg cefr-ai-coach
```

## ใช้บนมือถือ

หลัง deploy แล้วเปิด URL ด้วยมือถือได้เลย หน้าเว็บเป็น responsive layout และมี `manifest.webmanifest` สำหรับเพิ่มเป็นไอคอนบนหน้าจอมือถือ

บน Android/Chrome: เปิดเว็บ -> เมนู -> Add to Home screen

บน iPhone/Safari: เปิดเว็บ -> Share -> Add to Home Screen

## ไฟล์สำคัญ

- `server.mjs` คือ backend, คลังโจทย์, API ตรวจคำตอบ, API แปลคำศัพท์ และตัวเชื่อม AI
- `index.html` คือโครงหน้าเว็บ
- `styles.css` คือหน้าตาเว็บและ responsive mobile
- `app.js` คือ logic ฝั่ง browser เช่น คะแนน, ข้อต่อไป, กดคำศัพท์แปล
- `manifest.webmanifest` ทำให้เว็บติดตั้งบนมือถือได้
- `service-worker.js` cache ไฟล์หลักของเว็บ
- `Dockerfile` ใช้ deploy แบบ container
- `render.yaml` ช่วยตั้งค่า deploy บน Render
- `.gitignore` กันไม่ให้เผลออัปโหลด `.env` หรือไฟล์ที่ไม่ควรขึ้น GitHub

## โครงสร้างการทำงาน

1. หน้าเว็บขอโจทย์จาก `/api/lesson`
2. backend เลือกโจทย์จากคลัง หรือเรียก AI ถ้ามี `OPENAI_API_KEY`
3. ผู้เรียนตอบ แล้วหน้าเว็บส่งไป `/api/check`
4. backend ตรวจคำตอบ ส่งคะแนน เฉลย และคำแนะนำกลับมา
5. ผู้เรียนกด `ข้อต่อไป` เพื่อทำต่อเรื่อย ๆ
6. ถ้าผู้เรียนกดคำศัพท์ หน้าเว็บเรียก `/api/translate` เพื่อแปลคำนั้น
7. เมื่อครบ 10 ข้อ หน้าเว็บเรียก `/api/session-summary` เพื่อสรุปผลท้ายชุด
