# วิธีเปิดโปรเจกต์นี้ใน VS Code และเอาขึ้นเว็บ

## เปิดใน VS Code

1. เปิด VS Code
2. เลือก `File` -> `Open Folder`
3. เลือกโฟลเดอร์ `duolingo-ai-cefr-duolingo-ai`
4. เปิด Terminal ใน VS Code
5. รัน:

```powershell
node server.mjs
```

ถ้า port 4173 ถูกใช้อยู่ ให้เปิดเว็บได้เลยที่:

```text
http://localhost:4173
```

ถ้าต้องการหยุดตัวเก่า:

```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4173).OwningProcess
```

## ใช้ AI จริง

ถ้ามี Gemini API key ให้ตั้งค่าก่อนรัน:

```powershell
$env:GEMINI_API_KEY=AIzaSyDMSY2bVcJ-_bIV-ogFFVcPF4AmLWu_Yvg
node server.mjs
```

ถ้าจะใช้ OpenAI:

```powershell
$env:OPENAI_API_KEY="AIzaSyDMSY2bVcJ-_bIV-ogFFVcPF4AmLWu_Yvg"
node server.mjs
```

ถ้าไม่มี key เว็บยังใช้ได้ แต่จะใช้คลังโจทย์ offline และคำแปล offline

## เอา Gemini API key จากไหน

1. เข้า https://aistudio.google.com/
2. Login ด้วยบัญชี Google
3. กด `Get API key`
4. กด `Create API key`
5. copy key มาใส่เป็น `GEMINI_API_KEY`

อย่าใส่ key ลงใน `app.js` หรือหน้าเว็บโดยตรง ให้ใส่เป็น environment variable ฝั่ง server เท่านั้น

## เอาขึ้น GitHub

อัปโหลดไฟล์ทั้งโฟลเดอร์ได้เลย แต่อย่าอัป `.env`

ไฟล์สำคัญที่ต้องมี:

```text
index.html
app.js
styles.css
server.mjs
package.json
manifest.webmanifest
service-worker.js
icon.svg
README.md
Dockerfile
render.yaml
.env.example
.gitignore
```

## เอาขึ้นเว็บให้มือถือเปิดได้

GitHub ใช้เก็บโค้ด ส่วนเว็บที่เปิดบนมือถือจริงแนะนำ deploy ผ่าน Render หรือ Railway เพราะโปรเจกต์นี้มี backend (`server.mjs`)

บน Render:

1. New -> Web Service
2. เลือก GitHub repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variable: ใส่ `OPENAI_API_KEY` ถ้าต้องการ AI mode
6. Deploy แล้วเปิด URL บนมือถือได้เลย
