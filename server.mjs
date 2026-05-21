import http from "node:http";
import { readFile, readFileSync } from "node:fs";
import { readFile as readFileAsync } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Manual .env loader
try {
  const envPath = join(__dirname, ".env");
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
  console.log(".env file loaded manually");
} catch (e) {
  console.log("No .env file found or failed to load");
}

// Manual .env loader
try {
  const envPath = join(__dirname, ".env");
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
  console.log(".env file loaded manually");
} catch (e) {
  console.log("No .env file found or failed to load");
}

const PORT = Number(process.env.PORT || 4173);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const AI_PROVIDER = process.env.AI_PROVIDER || (GEMINI_API_KEY ? "gemini" : OPENAI_API_KEY ? "openai" : "local");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

const vocabulary = {
  attend: { th: "เข้าร่วม", note: "ใช้กับ meeting, class, event", example: "I cannot attend the meeting." },
  although: { th: "ถึงแม้ว่า", note: "ใช้เชื่อมความขัดแย้ง", example: "Although it was late, we continued." },
  unless: { th: "ถ้าไม่ / เว้นแต่ว่า", note: "ความหมายเหมือน if not", example: "Unless you hurry, you will be late." },
  grateful: { th: "รู้สึกขอบคุณ", note: "ใช้ในภาษาเขียนสุภาพ", example: "I would be grateful if you could help." },
  provide: { th: "จัดหา / ให้ข้อมูล", note: "มักใช้ในงานเขียนทางการ", example: "Please provide more details." },
  further: { th: "เพิ่มเติม", note: "สุภาพกว่า more ในบางบริบท", example: "I need further information." },
  expensive: { th: "แพง", note: "คำคุณศัพท์ ใช้หลัง be หรือหน้าคำนาม", example: "The course is expensive." },
  excellent: { th: "ยอดเยี่ยม", note: "แรงกว่า good", example: "The food was excellent." },
  promise: { th: "สัญญา", note: "เป็นได้ทั้งคำนามและคำกริยา", example: "I promised to help." },
  probably: { th: "น่าจะ / อาจจะ", note: "ใช้เมื่อไม่มั่นใจ 100%", example: "She is probably at home." },
  improve: { th: "พัฒนา / ทำให้ดีขึ้น", note: "คำสำคัญสำหรับพูดเรื่องการเรียน", example: "I want to improve my English." },
  avoid: { th: "หลีกเลี่ยง", note: "ตามด้วย verb-ing", example: "Avoid making the same mistake." },
  recommend: { th: "แนะนำ", note: "recommend + noun หรือ recommend + verb-ing", example: "I recommend reading daily." },
  suggest: { th: "เสนอแนะ", note: "สุภาพกว่า tell", example: "The teacher suggested a new method." },
  reliable: { th: "น่าเชื่อถือ", note: "ใช้กับคน แหล่งข้อมูล หรือบริการ", example: "This website is reliable." },
  convenient: { th: "สะดวก", note: "ใช้บ่อยใน speaking", example: "Online lessons are convenient." },
  advantage: { th: "ข้อดี", note: "ตรงข้ามกับ disadvantage", example: "One advantage is flexibility." },
  disadvantage: { th: "ข้อเสีย", note: "ใช้ใน essay และ speaking part", example: "A disadvantage is the high price." },
  evidence: { th: "หลักฐาน", note: "ใช้สนับสนุนเหตุผล", example: "There is no clear evidence." },
  effective: { th: "ได้ผล / มีประสิทธิภาพ", note: "ใช้พูดถึงวิธีหรือแผน", example: "This method is effective." },
  common: { th: "พบได้บ่อย / ทั่วไป", note: "ใช้กับ mistake, problem, reason", example: "This is a common mistake." },
  opportunity: { th: "โอกาส", note: "ใช้กับ work, study, travel", example: "It is a good opportunity." },
  environment: { th: "สิ่งแวดล้อม / สภาพแวดล้อม", note: "ใช้ได้ทั้งธรรมชาติและสถานการณ์", example: "A quiet environment helps me study." },
  require: { th: "ต้องการ / จำเป็นต้องมี", note: "เป็นคำทางการกว่า need", example: "The course requires hard work." },
  consider: { th: "พิจารณา", note: "ตามด้วย noun หรือ verb-ing", example: "Consider joining a speaking club." },
  decision: { th: "การตัดสินใจ", note: "make a decision = ตัดสินใจ", example: "It was a difficult decision." },
  delay: { th: "ล่าช้า / ทำให้ช้า", note: "ใช้กับ transport, project, flight", example: "The train was delayed." },
  borrow: { th: "ยืม", note: "borrow from someone", example: "Can I borrow your pen?" },
  lend: { th: "ให้ยืม", note: "lend something to someone", example: "Can you lend me your pen?" },
  depend: { th: "ขึ้นอยู่กับ", note: "depend on", example: "It depends on the weather." },
  instead: { th: "แทน", note: "มักอยู่ท้ายประโยค", example: "I stayed home instead." },
  available: { th: "ว่าง / มีให้ใช้", note: "ใช้กับคน เวลา หรือของ", example: "Are you available tomorrow?" },
  increase: { th: "เพิ่มขึ้น / เพิ่ม", note: "ใช้กับจำนวน ราคา ระดับ", example: "Prices increased last year." },
  reduce: { th: "ลด", note: "ใช้กับ cost, risk, stress", example: "Exercise can reduce stress." },
  achieve: { th: "บรรลุ / ทำสำเร็จ", note: "ใช้กับ goal, target, success", example: "She achieved her goal." },
  purpose: { th: "จุดประสงค์", note: "the purpose of something", example: "The purpose is to practise reading." },
  reason: { th: "เหตุผล", note: "reason for + noun/verb-ing", example: "What is the reason for the delay?" },
  serious: { th: "จริงจัง / รุนแรง", note: "ขึ้นกับบริบท", example: "This is a serious problem." },
  polite: { th: "สุภาพ", note: "ใช้กับ request, email, phrase", example: "Use polite language in formal emails." },
  formal: { th: "เป็นทางการ", note: "เหมาะกับอีเมล/essay", example: "This sentence is formal." },
  informal: { th: "ไม่เป็นทางการ", note: "เหมาะกับเพื่อนหรือคนสนิท", example: "Wanna is informal." },
  context: { th: "บริบท", note: "สิ่งรอบ ๆ ที่ช่วยให้เข้าใจความหมาย", example: "Use context to guess the meaning." },
  accurate: { th: "ถูกต้องแม่นยำ", note: "ใช้กับ answer, information, grammar", example: "Your answer is accurate." },
  fluency: { th: "ความคล่องในการใช้ภาษา", note: "สำคัญใน speaking", example: "Reading aloud improves fluency." },
  confident: { th: "มั่นใจ", note: "be confident about/in something", example: "I feel confident about the exam." }
};

Object.assign(vocabulary, {
  yesterday: { th: "เมื่อวาน", note: "ใช้กับ past simple เพราะเป็นเวลาที่จบไปแล้ว", example: "I studied yesterday." },
  today: { th: "วันนี้", note: "ใช้พูดถึงวันปัจจุบัน", example: "Today I will practise English." },
  tomorrow: { th: "พรุ่งนี้", note: "ใช้กับอนาคต", example: "I have an exam tomorrow." },
  study: { th: "เรียน / ศึกษา", note: "ใช้ได้ทั้งเรียนหนังสือและศึกษาหัวข้อหนึ่ง", example: "I study English every day." },
  practise: { th: "ฝึกฝน", note: "British spelling ของ practice แบบคำกริยา", example: "I practise speaking daily." },
  practice: { th: "ฝึกฝน / การฝึก", note: "ใช้ได้เป็นคำนาม และใน American English ใช้เป็นคำกริยาได้ด้วย", example: "Practice makes progress." },
  visit: { th: "เยี่ยมชม / ไปเยี่ยม", note: "ใช้กับสถานที่หรือคน", example: "I visited London last year." },
  learn: { th: "เรียนรู้", note: "เน้นการได้ความรู้หรือทักษะใหม่", example: "I learn new words every day." },
  try: { th: "พยายาม / ลอง", note: "try to + verb หรือ try + verb-ing", example: "Try to answer carefully." },
  finish: { th: "ทำให้เสร็จ / จบ", note: "ใช้กับงานหรือกิจกรรม", example: "Finish the report before Friday." },
  complete: { th: "ทำให้ครบ / เติมให้สมบูรณ์", note: "ใช้ในโจทย์เติมคำได้บ่อย", example: "Complete the sentence." },
  explain: { th: "อธิบาย", note: "ทำให้เข้าใจเหตุผลหรือความหมาย", example: "The teacher explained the rule." },
  remember: { th: "จำได้", note: "ตรงข้ามกับ forget", example: "Remember this pattern." },
  forget: { th: "ลืม", note: "forget to do = ลืมทำ", example: "Don't forget to review." },
  usually: { th: "โดยปกติ / มักจะ", note: "ใช้กับ present simple เพื่อบอกกิจวัตร", example: "I usually study at night." },
  before: { th: "ก่อน", note: "ใช้บอกลำดับเวลา", example: "I study before dinner." },
  after: { th: "หลังจาก", note: "ใช้บอกลำดับเวลา", example: "I study after school." },
  during: { th: "ระหว่าง", note: "ตามด้วยคำนามหรือช่วงเวลา", example: "I took notes during class." },
  dinner: { th: "อาหารเย็น", note: "มื้ออาหารช่วงเย็น", example: "We had dinner at seven." },
  lunch: { th: "อาหารกลางวัน", note: "มื้ออาหารช่วงกลางวัน", example: "I ate lunch early." },
  breakfast: { th: "อาหารเช้า", note: "ใช้กับ have breakfast", example: "I have breakfast at 7 a.m." },
  family: { th: "ครอบครัว", note: "คำทั่วไปใน speaking และ writing", example: "My family lives in Bangkok." },
  party: { th: "งานเลี้ยง", note: "ใช้ได้กับ birthday party, family party", example: "She went to a party." },
  evening: { th: "ตอนเย็น", note: "ช่วงหลังบ่ายถึงค่ำ", example: "I study in the evening." },
  morning: { th: "ตอนเช้า", note: "ช่วงเช้า", example: "I read in the morning." },
  night: { th: "กลางคืน", note: "ช่วงค่ำหรือดึก", example: "I sleep at night." },
  student: { th: "นักเรียน / นักศึกษา", note: "ใช้กับ school หรือ university", example: "She is a student." },
  teacher: { th: "ครู / อาจารย์", note: "คนที่สอน", example: "The teacher explained the answer." },
  sentence: { th: "ประโยค", note: "หน่วยภาษาที่มีความหมายครบ", example: "Choose the correct sentence." },
  correct: { th: "ถูกต้อง", note: "ตรงกับคำตอบหรือกฎภาษา", example: "Your answer is correct." },
  wrong: { th: "ผิด", note: "ไม่ถูกต้อง", example: "This answer is wrong." },
  choose: { th: "เลือก", note: "ใช้ในโจทย์แบบตัวเลือก", example: "Choose the best answer." },
  best: { th: "ดีที่สุด / เหมาะที่สุด", note: "ในข้อสอบหมายถึงตัวเลือกที่เหมาะที่สุด", example: "Choose the best word." },
  word: { th: "คำศัพท์ / คำ", note: "หน่วยของภาษา", example: "This word is common." },
  phrase: { th: "วลี", note: "กลุ่มคำที่ยังไม่ใช่ประโยคเต็ม", example: "This phrase is formal." },
  meaning: { th: "ความหมาย", note: "สิ่งที่คำหรือประโยคสื่อ", example: "What is the meaning of this word?" },
  usage: { th: "วิธีใช้", note: "วิธีนำคำไปใช้ในประโยค", example: "Learn the usage of new words." },
  fill: { th: "เติม", note: "ใช้กับ fill in the blank", example: "Fill in the blank." },
  blank: { th: "ช่องว่าง", note: "ส่วนที่ต้องเติมคำ", example: "Complete the blank." },
  answer: { th: "คำตอบ", note: "สิ่งที่ผู้เรียนตอบ", example: "Write your answer." },
  question: { th: "คำถาม / โจทย์", note: "สิ่งที่ต้องตอบ", example: "Read the question carefully." },
  passage: { th: "บทอ่าน / ข้อความ", note: "ข้อความสั้นสำหรับอ่านจับใจความ", example: "Read the passage." },
  according: { th: "ตามที่ / จากข้อมูลใน", note: "according to the passage = จากบทอ่าน", example: "According to the passage, she was late." },
  main: { th: "หลัก / สำคัญ", note: "main idea = ใจความหลัก", example: "Find the main idea." },
  idea: { th: "ความคิด / แนวคิด", note: "ใช้ใน reading และ writing", example: "The main idea is clear." },
  detail: { th: "รายละเอียด", note: "ข้อมูลเฉพาะในบทอ่าน", example: "Look for the detail." },
  infer: { th: "อนุมาน / สรุปจากข้อมูล", note: "ตอบจากสิ่งที่บทอ่านบอกโดยนัย", example: "We can infer that he was tired." },
  probably: { th: "น่าจะ / อาจจะ", note: "บอกความเป็นไปได้", example: "She is probably busy." },
  maybe: { th: "บางที / อาจจะ", note: "ไม่มั่นใจ 100%", example: "Maybe it will rain." },
  already: { th: "แล้ว", note: "ใช้บอกว่าสิ่งหนึ่งเกิดขึ้นก่อนเวลานี้", example: "I have already finished." },
  since: { th: "ตั้งแต่", note: "ใช้กับจุดเริ่มต้นของเวลา", example: "I have lived here since 2022." },
  until: { th: "จนกระทั่ง / จนถึง", note: "ใช้บอกเวลาสิ้นสุด", example: "Wait until five o'clock." },
  earlier: { th: "เร็วกว่า / ก่อนหน้านี้", note: "รูป comparative ของ early", example: "Please arrive earlier." },
  later: { th: "ภายหลัง / ช้ากว่า", note: "ใช้บอกเวลาในอนาคตหรือช้ากว่า", example: "I will call you later." },
  museum: { th: "พิพิธภัณฑ์", note: "สถานที่จัดแสดงของสำคัญ", example: "They went to the museum." },
  library: { th: "ห้องสมุด", note: "สถานที่อ่านหรือยืมหนังสือ", example: "I borrowed a book from the library." },
  apartment: { th: "อพาร์ตเมนต์ / ห้องพัก", note: "ที่พักอาศัย", example: "He lives in a small apartment." },
  larger: { th: "ใหญ่กว่า", note: "comparative ของ large", example: "I need a larger room." },
  current: { th: "ปัจจุบัน", note: "สิ่งที่ใช้อยู่ตอนนี้", example: "My current level is B1." },
  room: { th: "ห้อง", note: "พื้นที่ในบ้านหรืออาคาร", example: "This room is quiet." },
  desk: { th: "โต๊ะทำงาน / โต๊ะเรียน", note: "ใช้วางหนังสือหรือคอมพิวเตอร์", example: "My books are on the desk." },
  books: { th: "หนังสือหลายเล่ม", note: "รูปพหูพจน์ของ book", example: "I read many books." },
  price: { th: "ราคา", note: "จำนวนเงินที่ต้องจ่าย", example: "The price is high." },
  jacket: { th: "เสื้อแจ็กเก็ต", note: "เสื้อนอก", example: "This jacket is expensive." },
  decided: { th: "ตัดสินใจแล้ว", note: "past simple ของ decide", example: "I decided to wait." },
  wait: { th: "รอ", note: "wait for someone/something", example: "Please wait here." },
  challenging: { th: "ท้าทาย / ยากพอสมควร", note: "ไม่จำเป็นต้องแปลว่าแย่", example: "The course was challenging." },
  expected: { th: "คาดหวัง / คาดไว้", note: "ใช้กับสิ่งที่คิดว่าจะเกิด", example: "It was better than I expected." },
  friends: { th: "เพื่อนหลายคน", note: "รูปพหูพจน์ของ friend", example: "I study with friends." },
  positive: { th: "เชิงบวก", note: "ทัศนคติดี", example: "The feedback was positive." },
  negative: { th: "เชิงลบ", note: "ทัศนคติไม่ดี", example: "The review was negative." },
  manager: { th: "ผู้จัดการ", note: "คนดูแลทีม/งาน", example: "The manager set a deadline." },
  deadline: { th: "กำหนดส่ง", note: "วันหรือเวลาที่ต้องส่งงาน", example: "The deadline is Friday." },
  flexible: { th: "ยืดหยุ่น", note: "ปรับได้ ไม่ตายตัว", example: "The schedule is flexible." },
  everyone: { th: "ทุกคน", note: "ใช้กับกลุ่มคนทั้งหมด", example: "Everyone stayed late." },
  stayed: { th: "อยู่ / พัก / อยู่ต่อ", note: "past simple ของ stay", example: "They stayed late." },
  report: { th: "รายงาน", note: "งานเขียนหรือข้อมูลสรุป", example: "Finish the report." },
  pressure: { th: "ความกดดัน", note: "ความเครียดจากงานหรือเวลา", example: "The team felt pressure." },
  features: { th: "ฟีเจอร์ / คุณสมบัติ", note: "ความสามารถของแอปหรือสินค้า", example: "The app has many features." },
  competitors: { th: "คู่แข่ง", note: "คนหรือบริษัทที่แข่งขันกัน", example: "Competitors offer similar apps." },
  praise: { th: "ชื่นชม", note: "พูดถึงในทางดี", example: "Users praise the design." },
  simple: { th: "เรียบง่าย", note: "ไม่ซับซ้อน", example: "The design is simple." },
  design: { th: "การออกแบบ", note: "รูปลักษณ์หรือวิธีจัดวาง", example: "The design is clear." },
  performance: { th: "ประสิทธิภาพ / การทำงาน", note: "คุณภาพการทำงาน", example: "The app has reliable performance." },
  ambitious: { th: "ทะเยอทะยาน / ตั้งเป้าสูง", note: "เป้าหมายใหญ่", example: "The proposal is ambitious." },
  proposal: { th: "ข้อเสนอ / แผนที่เสนอ", note: "ใช้ในงานหรือการเรียน", example: "The proposal needs funding." },
  success: { th: "ความสำเร็จ", note: "ผลลัพธ์ที่ทำได้ตามเป้า", example: "Success depends on practice." },
  secure: { th: "ทำให้ได้มา / ปลอดภัย", note: "ในบริบท funding คือหาเงินทุนให้ได้", example: "They secured funding." },
  funding: { th: "เงินทุน", note: "เงินสนับสนุนโครงการ", example: "The project needs funding." },
  theory: { th: "ทฤษฎี", note: "แนวคิดอธิบายเรื่องหนึ่ง", example: "The theory is useful." },
  entirely: { th: "ทั้งหมด / อย่างสิ้นเชิง", note: "ใช้เน้นความครบทั้งหมด", example: "I do not agree entirely." },
  applies: { th: "นำไปใช้ได้ / มีผลกับ", note: "apply to = ใช้กับ", example: "This rule applies to formal writing." },
  situation: { th: "สถานการณ์", note: "บริบทหรือเหตุการณ์", example: "It depends on the situation." },
  hungry: { th: "หิว", note: "ต้องการอาหาร", example: "I am hungry." },
  tired: { th: "เหนื่อย", note: "ต้องการพัก", example: "I feel tired." },
  early: { th: "เร็ว / เช้า", note: "ตรงข้ามกับ late", example: "I arrived early." },
  late: { th: "สาย / ช้า", note: "ตรงข้ามกับ early", example: "I was late." },
  cheap: { th: "ถูก", note: "ราคาไม่แพง", example: "This bag is cheap." },
  cheaper: { th: "ถูกกว่า", note: "comparative ของ cheap", example: "This one is cheaper." },
  rain: { th: "ฝน / ฝนตก", note: "เป็นได้ทั้งคำนามและคำกริยา", example: "It will rain." },
  clouds: { th: "เมฆ", note: "กลุ่มก้อนบนท้องฟ้า", example: "There are dark clouds." },
  helmet: { th: "หมวกกันน็อก", note: "ใช้ป้องกันศีรษะ", example: "You should wear a helmet." },
  motorbike: { th: "มอเตอร์ไซค์", note: "ยานพาหนะสองล้อ", example: "He rides a motorbike." },
  email: { th: "อีเมล", note: "ข้อความที่ส่งทางอินเทอร์เน็ต", example: "I sent an email." },
  sent: { th: "ส่งแล้ว", note: "past participle ของ send", example: "The email was sent." },
  policy: { th: "นโยบาย", note: "แนวทางหรือกฎขององค์กร", example: "The policy reduces stress." },
  stress: { th: "ความเครียด", note: "ความกดดันทางใจ", example: "Exercise reduces stress." },
  claim: { th: "ข้อกล่าวอ้าง / คำกล่าว", note: "สิ่งที่บอกว่าเป็นจริง", example: "Evidence supports the claim." },
  feasible: { th: "ทำได้จริง / เป็นไปได้", note: "ใช้กับแผนหรือโครงการ", example: "The plan is feasible." },
  inconsistent: { th: "ไม่สม่ำเสมอ / ไม่คงที่", note: "ผลลัพธ์ไม่เหมือนกันทุกครั้ง", example: "The results were inconsistent." }
});

const manualLessons = [
  {
    id: "a2-present-perfect",
    level: "A2",
    skill: "Grammar",
    title: "Present perfect for life experience",
    prompt: "Choose the best sentence.",
    context: "You want to say that you visited London at some time in your life.",
    type: "choice",
    options: [
      "I have been to London.",
      "I went to London tomorrow.",
      "I am go to London.",
      "I have go London."
    ],
    answer: "I have been to London.",
    microLesson: "Use have/has + past participle when the exact time is not important.",
    benefit: "This pattern appears often in CEFR speaking and writing tasks when you talk about experience."
  },
  {
    id: "b1-linkers",
    level: "B1",
    skill: "Writing",
    title: "Linking contrast",
    prompt: "Pick the best connector.",
    context: "The restaurant was expensive. The food was excellent.",
    type: "choice",
    options: ["although", "because", "so", "unless"],
    answer: "although",
    microLesson: "Although introduces a surprising contrast between two ideas.",
    benefit: "Good linkers make CEFR writing sound organized instead of like separate simple sentences."
  },
  {
    id: "b1-reading-inference",
    level: "B1",
    skill: "Reading",
    title: "Reading for implication",
    prompt: "What does the speaker probably mean?",
    context: "\"I would come to the meeting, but I have already promised to help my sister move.\"",
    type: "choice",
    options: [
      "The speaker cannot attend.",
      "The speaker is organizing the meeting.",
      "The speaker dislikes their sister.",
      "The speaker forgot the promise."
    ],
    answer: "The speaker cannot attend.",
    microLesson: "\"I would..., but...\" often means the person wants to do something but cannot.",
    benefit: "Inference questions are common in CEFR reading because they test meaning beyond single words."
  },
  {
    id: "b2-paraphrase",
    level: "B2",
    skill: "Use of English",
    title: "Paraphrasing with conditionals",
    prompt: "Complete the second sentence so it means the same as the first.",
    context: "If you do not leave now, you will miss the train.\nUnless ______, you will miss the train.",
    type: "text",
    answer: "you leave now",
    microLesson: "Unless means if not. Keep the positive verb after unless.",
    benefit: "Sentence transformation builds flexible grammar, which helps in writing, speaking, and exam accuracy."
  },
  {
    id: "a1-daily-vocab",
    level: "A1",
    skill: "Vocabulary",
    title: "Daily routine verbs",
    prompt: "Choose the correct verb.",
    context: "I usually ____ breakfast at 7 a.m.",
    type: "choice",
    options: ["have", "make up", "go", "listen"],
    answer: "have",
    microLesson: "In English, people usually say have breakfast, have lunch, and have dinner.",
    benefit: "Common collocations help your answers sound natural even at beginner levels."
  },
  {
    id: "c1-register",
    level: "C1",
    skill: "Writing",
    title: "Formal register",
    prompt: "Choose the most formal sentence.",
    context: "You are writing an email to a university admissions office.",
    type: "choice",
    options: [
      "I would be grateful if you could provide further information.",
      "Can you tell me stuff about it?",
      "Send me more details ASAP.",
      "I wanna know more."
    ],
    answer: "I would be grateful if you could provide further information.",
    microLesson: "Formal writing often uses polite indirect phrases such as I would be grateful if...",
    benefit: "Register control is a strong CEFR marker at B2-C1 because it shows you can adapt language to context."
  }
];

const grammarTemplates = [
  ["A1", "Choose the correct be verb.", "She ____ a student.", ["is", "are", "am", "be"], "is", "Use is with he, she, it, and one person."],
  ["A1", "Choose the correct article.", "I saw ____ elephant at the zoo.", ["an", "a", "the one", "some"], "an", "Use an before a vowel sound."],
  ["A1", "Choose the correct negative.", "He ____ like coffee.", ["doesn't", "don't", "isn't", "not"], "doesn't", "Use doesn't with he, she, it in present simple."],
  ["A1", "Choose the correct plural.", "I have two ____.", ["cats", "cat", "caties", "cat's"], "cats", "Add -s for regular plural nouns."],
  ["A1", "Choose the correct possessive.", "This is ____ book.", ["my", "I", "me", "mine"], "my", "My is a possessive adjective used before a noun."],
  ["A1", "Choose the correct question word.", "____ is your name?", ["What", "Who", "Where", "How"], "What", "Use What to ask about things or names."],
  ["A2", "Choose the correct past form.", "They ____ to the museum yesterday.", ["went", "go", "gone", "going"], "went", "Use the past simple for a finished time like yesterday."],
  ["A2", "Choose the best comparative.", "This bag is ____ than that one.", ["cheaper", "more cheap", "cheapest", "cheap"], "cheaper", "Short adjectives often add -er."],
  ["A2", "Choose the best future form.", "Look at those clouds. It ____ rain.", ["is going to", "will to", "going", "rains"], "is going to", "Use going to for evidence you can see now."],
  ["A2", "Choose the correct frequency adverb.", "I ____ eat breakfast; I never skip it.", ["always", "sometimes", "rarely", "never"], "always", "Always means 100% of the time."],
  ["A2", "Choose the correct preposition of time.", "The party is ____ Saturday.", ["on", "in", "at", "by"], "on", "Use on with days of the week."],
  ["A2", "Choose the correct irregular past verb.", "I ____ a new car last week.", ["bought", "buyed", "buy", "buying"], "bought", "Bought is the past simple of buy."],
  ["B1", "Choose the correct tense.", "I ____ here since 2022.", ["have lived", "lived", "am living", "live"], "have lived", "Use present perfect with since + starting point."],
  ["B1", "Choose the best modal.", "You ____ wear a helmet when riding a motorbike.", ["should", "might", "would", "can to"], "should", "Should gives advice or says what is a good idea."],
  ["B1", "Choose the correct passive form.", "The email ____ yesterday.", ["was sent", "sent", "is send", "was send"], "was sent", "Use was/were + past participle for past passive."],
  ["B1", "Choose the correct relative pronoun.", "The man ____ lives next door is a doctor.", ["who", "which", "where", "whose"], "who", "Use who for people in relative clauses."],
  ["B1", "Choose the correct first conditional.", "If it rains, we ____ at home.", ["will stay", "stayed", "stay", "would stay"], "will stay", "Use will + verb for real possibilities in the future."],
  ["B1", "Choose the correct present perfect.", "____ you ever visited Japan?", ["Have", "Has", "Do", "Did"], "Have", "Use Have with you for present perfect questions."],
  ["B2", "Choose the best conditional.", "If I had known, I ____ you earlier.", ["would have called", "will call", "called", "would call"], "would have called", "Use would have + past participle for unreal past situations."],
  ["B2", "Choose the best phrase.", "The report needs ____ before Friday.", ["to be finished", "finish", "to finishing", "finished"], "to be finished", "Needs to be finished is a passive structure."],
  ["C1", "Choose the best inversion.", "Rarely ____ such a clear explanation.", ["have I heard", "I have heard", "did I heard", "I heard"], "have I heard", "After negative adverbs like rarely, formal English often uses inversion."]
];

const vocabularyTemplates = [
  ["A1", "Choose the best word.", "I am ____ because I ran for the bus.", ["tired", "hungry", "wide", "early"], "tired", "Tired means you need rest."],
  ["A1", "Choose the correct place.", "You can borrow books from a ____.", ["library", "kitchen", "station", "bank"], "library", "A library is a place with books you can read or borrow."],
  ["A2", "Choose the best collocation.", "Can you ____ a photo of us?", ["take", "make", "do", "have"], "take", "In English, we take a photo."],
  ["A2", "Choose the best word.", "The train was ____ by heavy rain.", ["delayed", "borrowed", "invited", "repaired"], "delayed", "Delayed means later than planned."],
  ["B1", "Choose the best word.", "Online classes are very ____ because I can study at home.", ["convenient", "serious", "ancient", "narrow"], "convenient", "Convenient means easy and suitable for your situation."],
  ["B1", "Choose the best word.", "This source is ____; we can trust the information.", ["reliable", "crowded", "noisy", "tiny"], "reliable", "Reliable means trustworthy."],
  ["B2", "Choose the best academic word.", "The new policy may ____ stress for employees.", ["reduce", "borrow", "attend", "argue"], "reduce", "Reduce means make smaller or less."],
  ["B2", "Choose the best academic word.", "There is not enough ____ to support the claim.", ["evidence", "habit", "traffic", "furniture"], "evidence", "Evidence is information that supports an idea."],
  ["C1", "Choose the closest meaning.", "The plan is feasible.", ["possible to do", "too expensive", "already finished", "not allowed"], "possible to do", "Feasible means realistic or possible to achieve."],
  ["C1", "Choose the closest meaning.", "The results were inconsistent.", ["not always the same", "very accurate", "easy to predict", "completely final"], "not always the same", "Inconsistent means changing or not matching."]
];

const readingTemplates = [
  ["A2", "Reading for detail", "Mina usually studies after dinner, but today she studied before lunch because she had a family party in the evening.", "When did Mina study today?", ["before lunch", "after dinner", "at midnight", "during the party"], "before lunch", "Look for the changed time marker: today."],
  ["A2", "Reading for meaning", "Tom is looking for a larger apartment because his current room is too small for his desk and books.", "Why does Tom want a new apartment?", ["He needs more space.", "He wants to live alone.", "He dislikes books.", "He lost his desk."], "He needs more space.", "The reason is explained after because."],
  ["B1", "Reading for implication", "I was going to buy the jacket, but when I checked the price, I decided to wait until next month.", "What probably happened?", ["The jacket was expensive.", "The shop was closed.", "The jacket was too small.", "The speaker bought two jackets."], "The jacket was expensive.", "The price changed the speaker's decision."],
  ["B1", "Reading for attitude", "The course was challenging, but I learned more than I expected and would recommend it to friends.", "How does the writer feel?", ["positive overall", "angry", "bored", "confused"], "positive overall", "But signals contrast, and the final opinion is positive."],
  ["B2", "Reading inference", "The manager said the deadline was flexible, yet everyone stayed late to finish the report.", "What can we infer?", ["The team still felt pressure.", "The report was cancelled.", "The manager left the company.", "Nobody worked on the report."], "The team still felt pressure.", "The action suggests pressure even though the deadline was flexible."],
  ["B2", "Reading inference", "Although the app has fewer features than its competitors, users praise its simple design and reliable performance.", "What is the main advantage?", ["It is easy to use and dependable.", "It is the cheapest app.", "It has the most features.", "It works only offline."], "It is easy to use and dependable.", "Simple design and reliable performance are the positive points."],
  ["C1", "Reading nuance", "The proposal is ambitious, but its success depends on whether the team can secure long-term funding.", "What is the writer's view?", ["The idea has potential but a major condition.", "The proposal has already failed.", "Funding is unnecessary.", "The team dislikes the proposal."], "The idea has potential but a major condition.", "The sentence balances ambition with a condition for success."],
  ["C1", "Reading nuance", "The author does not reject the theory entirely; rather, she questions whether it applies to every situation.", "What does the author do?", ["She partly challenges the theory.", "She fully accepts the theory.", "She refuses to discuss the theory.", "She says the theory is useless."], "She partly challenges the theory.", "Not entirely and questions whether show a careful partial challenge."]
];

const writingTemplates = [
  ["A2", "Choose the best connector.", "I was hungry, ____ I made a sandwich.", ["so", "because", "although", "unless"], "so", "So introduces a result."],
  ["A2", "Choose the best connector.", "I stayed home ____ it was raining.", ["because", "so", "however", "unless"], "because", "Because introduces a reason."],
  ["B1", "Choose the best sentence for an opinion essay.", "____, online learning is useful for busy students.", ["In my opinion", "Anyway bro", "Give me", "At yesterday"], "In my opinion", "Use clear opinion phrases in CEFR writing."],
  ["B1", "Choose the best formal request.", "____ send me the application form?", ["Could you please", "You must", "Give me", "Why not you"], "Could you please", "Could you please is polite and suitable for email."],
  ["B2", "Choose the best topic sentence.", "____ is one of the main reasons people choose public transport.", ["Saving money", "And the bus", "Very quickly", "Because people"], "Saving money", "A topic sentence should name the main idea clearly."],
  ["B2", "Choose the best concluding phrase.", "____, governments should invest more in public transport.", ["In conclusion", "At first", "For example", "By the way"], "In conclusion", "Use in conclusion to summarize your final view."],
  ["C1", "Choose the most formal sentence.", "The data clearly shows that the strategy was effective.", ["The data clearly shows that the strategy was effective.", "The thing worked pretty good.", "It was kinda okay.", "The plan did stuff."], "The data clearly shows that the strategy was effective.", "Formal writing uses precise nouns and avoids vague words."],
  ["C1", "Choose the best hedging phrase.", "____ that remote work improves productivity in every industry.", ["It is difficult to argue", "It is rain", "I am very like", "This makes a party"], "It is difficult to argue", "Hedging makes academic claims more careful."]
];

const useOfEnglishTemplates = [
  ["A2", "Complete the phrase.", "I am interested ____ learning English.", "in", "interested in + noun/verb-ing"],
  ["A2", "Complete the phrase.", "She is good ____ speaking with customers.", "at", "good at + noun/verb-ing"],
  ["B1", "Complete the sentence.", "I look forward ____ hearing from you.", "to", "look forward to + noun/verb-ing"],
  ["B1", "Complete the sentence.", "He succeeded ____ passing the exam.", "in", "succeed in + verb-ing"],
  ["B2", "Complete the sentence.", "The sooner we leave, the ____ we will arrive.", "earlier", "Use the + comparative, the + comparative."],
  ["B2", "Complete the sentence.", "No sooner had I arrived ____ it started raining.", "than", "No sooner... than is a formal time structure."],
  ["C1", "Complete the sentence.", "Had I known about the delay, I ____ have waited at home.", "would", "Had I known means If I had known."],
  ["C1", "Complete the phrase.", "The policy is aimed ____ reducing traffic.", "at", "aimed at + noun/verb-ing"]
];

function pointValue(level, index) {
  const base = { A1: 8, A2: 10, B1: 12, B2: 15, C1: 18 }[level] || 10;
  return index % 5 === 0 ? base + 7 : base;
}

function makeChoiceLesson(skill, item, index) {
  const [level, title, context, options, answer, microLesson] = item;
  const points = pointValue(level, index);
  return {
    id: `${level.toLowerCase()}-${skill.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`,
    level,
    skill,
    title,
    prompt: skill === "Vocabulary" ? "Choose the best word." : "Choose the best answer.",
    context,
    type: "choice",
    options, // Keep original order in bank
    answer,
    points,
    isBonus: points >= 17,
    microLesson,
    benefit: "This is a scored CEFR-style item. It trains accuracy, speed, and the skill named above."
  };
}

function makeTextLesson(item, index) {
  const [level, title, context, answer, microLesson] = item;
  const points = pointValue(level, index);
  return {
    id: `${level.toLowerCase()}-use-of-english-${index + 1}`,
    level,
    skill: "Use of English",
    title,
    prompt: "Type the missing word or phrase.",
    context,
    type: "text",
    answer,
    points,
    isBonus: points >= 17,
    microLesson,
    benefit: "Use of English questions are important for CEFR grammar accuracy and sentence transformation."
  };
}

function buildLessonBank() {
  const generated = [
    ...grammarTemplates.map((item, index) => makeChoiceLesson("Grammar", item, index)),
    ...vocabularyTemplates.map((item, index) => makeChoiceLesson("Vocabulary", item, index)),
    ...readingTemplates.map((item, index) => makeChoiceLesson("Reading", item, index)),
    ...writingTemplates.map((item, index) => makeChoiceLesson("Writing", item, index)),
    ...useOfEnglishTemplates.map(makeTextLesson)
  ];

  const expanded = [];
  for (let round = 0; round < 8; round += 1) {
    for (const lesson of generated) {
      expanded.push({
        ...lesson,
        id: `${lesson.id}-set-${round + 1}`,
        points: lesson.points + (round % 2 === 0 ? 0 : 2),
        isBonus: lesson.isBonus || round === 3,
        context: round === 0 ? lesson.context : `${lesson.context}\nFocus round ${round + 1}: answer carefully and check the key words.`
      });
    }
  }

  return [
    ...manualLessons.map((lesson, index) => ({
      points: pointValue(lesson.level, index),
      isBonus: index % 3 === 0,
      ...lesson
    })),
    ...expanded
  ];
}

const lessonBank = buildLessonBank();

function sendJson(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function pickLocalLesson({ level = "B1", skill = "Mixed", previousIds = [] }) {
  const matching = lessonBank.filter(item => {
    const levelOk = level === "Mixed" || item.level === level;
    const skillOk = skill === "Mixed" || item.skill === skill;
    const fresh = !previousIds.includes(item.id);
    return levelOk && skillOk && fresh;
  });
  
  const pool = matching.length ? matching : lessonBank.filter(item => !previousIds.includes(item.id));
  const fallbackPool = pool.length ? pool : lessonBank;
  
  // Shuffle the pool for lesson variety
  const shuffledBank = [...fallbackPool].sort(() => Math.random() - 0.5);
  const lesson = { ...shuffledBank[0] };

  // Dynamic shuffle of options using Fisher-Yates algorithm
  if (Array.isArray(lesson.options)) {
    const opts = [...lesson.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    lesson.options = opts;
  }

  return {
    ...lesson,
    source: "local",
    cefrTarget: "โฟกัสคำสำคัญในโจทย์ก่อน แล้วค่อยเลือกคำตอบให้แม่น.",
    aiCoach: lesson.isBonus
      ? "ข้อนี้เป็นข้อเก็บคะแนนพิเศษ ถ้าถูกจะได้คะแนนสูงกว่าข้อทั่วไป."
      : "ข้อนี้เก็บคะแนนได้ ตอบแล้วอ่านเฉลยเพื่อจำ pattern ไปใช้กับข้อถัดไป."
  };
}

function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ");
}

function scoreLocalAnswer(question, userAnswer) {
  const expected = normalizeAnswer(question.answer);
  const actual = normalizeAnswer(userAnswer);
  const accepted = Array.isArray(question.acceptedAnswers)
    ? question.acceptedAnswers.map(normalizeAnswer)
    : [];
  const correct = expected === actual || accepted.includes(actual);
  const maxPoints = Number(question.points || 10);
  const earnedPoints = correct ? maxPoints : 0;
  const answerShown = question.answer;

  return {
    correct,
    score: correct ? 100 : 0,
    earnedPoints,
    maxPoints,
    feedback: correct
      ? `ถูกต้อง ได้ ${earnedPoints} คะแนน`
      : `ยังไม่ใช่ครับ คำตอบที่เหมาะคือ: ${answerShown}`,
    explanation: question.microLesson || "ทบทวนรูปประโยคเป้าหมาย แล้วลองแต่งประโยคใหม่ด้วยแนวเดียวกัน.",
    improvement: correct
      ? "กดข้อต่อไปได้เลย หรือพูดประโยคนี้ออกเสียงหนึ่งรอบเพื่อให้จำได้เร็วขึ้น."
      : "ดูคำสำคัญในบริบท แล้วลองอธิบายว่าทำไมคำตอบที่ถูกถึงเข้ากับประโยค.",
    benefit: question.benefit || "ข้อนี้ฝึกความแม่นยำแบบที่ CEFR ใช้วัด."
  };
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("AI response was not valid JSON.");
  }
}

async function callOpenAI(input) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const text = data.output_text || data.output?.flatMap(item => item.content || [])
    .map(part => part.text || "")
    .join("\n");

  if (!text) {
    throw new Error("OpenAI response did not include text.");
  }
  return extractJson(text);
}

function flattenPrompt(input) {
  const system = [];
  const user = [];

  for (const item of input) {
    const content = typeof item.content === "string" ? item.content : JSON.stringify(item.content);
    if (item.role === "system") {
      system.push(content);
    } else {
      user.push(content);
    }
  }

  return {
    systemText: system.join("\n\n"),
    userText: user.join("\n\n")
  };
}

async function callGemini(input) {
  const { systemText, userText } = flattenPrompt(input);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemText || "Return only valid JSON." }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userText }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("\n");

  if (!text) {
    throw new Error("Gemini response did not include text.");
  }
  return extractJson(text);
}

async function callAI(input) {
  if (AI_PROVIDER === "gemini" && GEMINI_API_KEY) return callGemini(input);
  if (AI_PROVIDER === "openai" && OPENAI_API_KEY) return callOpenAI(input);
  if (GEMINI_API_KEY) return callGemini(input);
  if (OPENAI_API_KEY) return callOpenAI(input);
  throw new Error("No AI API key configured.");
}

function isAiEnabled() {
  return Boolean(GEMINI_API_KEY || OPENAI_API_KEY);
}

function activeProvider() {
  if (AI_PROVIDER === "gemini" && GEMINI_API_KEY) return "gemini";
  if (AI_PROVIDER === "openai" && OPENAI_API_KEY) return "openai";
  if (GEMINI_API_KEY) return "gemini";
  if (OPENAI_API_KEY) return "openai";
  return "local";
}

async function generateAiLesson(body) {
  const level = body.level || "B1";
  const skill = body.skill || "Mixed";
  const learnerGoal = body.goal || "CEFR exam practice";
  const previousIds = Array.isArray(body.previousIds) ? body.previousIds.slice(-10) : [];

  const lesson = await callAI([
    {
      role: "system",
      content: [
        "You are an expert CEFR English tutor for Thai learners.",
        "Generate one short interactive exam-style scored question.",
        "Return only strict JSON with these fields:",
        "id, level, skill, title, prompt, context, type, options, answer, microLesson, benefit, cefrTarget, aiCoach, points, isBonus.",
        "type must be choice or text. For choice, provide exactly 4 options. points should be 8-25.",
        "IMPORTANT: Provide explanations and coach notes in THAI."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({ level, skill, learnerGoal, previousIds })
    }
  ]);

  return {
    points: Number(lesson.points || pointValue(lesson.level, 0)),
    isBonus: Boolean(lesson.isBonus),
    ...lesson
  };
}

async function checkAiAnswer(body) {
  const { question, userAnswer } = body;
  const maxPoints = Number(question?.points || 10);
  const result = await callAI([
    {
      role: "system",
      content: [
        "You are a CEFR English tutor.",
        "Check the learner answer fairly. Return only strict JSON with fields:",
        "correct, score, feedback, explanation, improvement, benefit.",
        "score is 0-100. Explain in clear simple English with brief Thai support when helpful.",
        "IMPORTANT: Provide feedback and explanation in THAI."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({ question, userAnswer })
    }
  ]);

  const earnedPoints = result.correct ? maxPoints : 0;
  return { ...result, earnedPoints, maxPoints };
}

function summarizeSessionLocal(body) {
  const answered = Number(body.answered || 0);
  const correct = Number(body.correct || 0);
  const totalPoints = Number(body.totalPoints || 0);
  const maxPossiblePoints = Number(body.maxPossiblePoints || 0);
  const reviewItems = Array.isArray(body.reviewItems) ? body.reviewItems : [];
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const pointRate = maxPossiblePoints ? Math.round((totalPoints / maxPossiblePoints) * 100) : 0;

  let message = `ชุดนี้ทำได้ ${correct}/${answered} ข้อ ความแม่นยำ ${accuracy}% และได้ ${totalPoints}/${maxPossiblePoints} คะแนน. `;
  if (accuracy >= 85) {
    message += "ภาพรวมดีมาก พร้อมลองระดับที่ยากขึ้นหรือฝึก Reading/Writing เพิ่มเพื่อให้ใกล้ข้อสอบ CEFR จริงขึ้น.";
  } else if (accuracy >= 60) {
    message += "พื้นฐานเริ่มดีแล้ว ให้ทบทวนข้อที่ผิด โดยจำคำเชื่อม tense และรูปประโยคที่เฉลยไว้.";
  } else {
    message += "แนะนำลดระดับลงหนึ่งขั้นหรือเลือก Grammar/Vocabulary ก่อน แล้วทำซ้ำจนคะแนนเกิน 70%.";
  }

  if (reviewItems.length) {
    const skills = [...new Set(reviewItems.map(item => item.skill).filter(Boolean))].slice(0, 3);
    if (skills.length) {
      message += ` จุดที่ควรซ้อมต่อ: ${skills.join(", ")}.`;
    }
  }

  return {
    message,
    accuracy,
    pointRate,
    weakCount: reviewItems.length
  };
}

async function summarizeSessionAi(body) {
  if (!isAiEnabled()) return summarizeSessionLocal(body);

  return callAI([
    {
      role: "system",
      content: [
        "You are a CEFR English coach for Thai learners.",
        "Summarize a 10-question practice session.",
        "Return strict JSON with fields: message, accuracy, pointRate, weakCount.",
        "message must be Thai, friendly, practical, 2-4 sentences, with concrete next-step advice."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify(body)
    }
  ]);
}

function localTranslate(word) {
  const cleaned = String(word || "").toLowerCase().replace(/[^a-z'-]/g, "");
  if (!cleaned) return null;
  
  // Try exact match first
  if (vocabulary[cleaned]) return { word: cleaned, ...vocabulary[cleaned], source: "local" };

  // Advanced word stemming for local dictionary
  const candidates = [
    cleaned.replace(/ies$/, "y"),
    cleaned.replace(/ves$/, "f"),
    cleaned.replace(/es$/, ""),
    cleaned.replace(/s$/, ""),
    cleaned.replace(/ied$/, "y"),
    cleaned.replace(/ed$/, ""),
    cleaned.replace(/d$/, ""),
    cleaned.replace(/ing$/, ""),
    cleaned.replace(/ing$/, "e")
  ].filter(c => c !== cleaned);

  for (const candidate of candidates) {
    if (vocabulary[candidate]) {
      return {
        word: cleaned,
        ...vocabulary[candidate],
        note: `${vocabulary[candidate].note} (แปลจากคำหลัก: ${candidate})`,
        source: "local"
      };
    }
  }

  return {
    word: cleaned,
    th: "กำลังเรียก AI มาช่วยแปล...",
    note: "หากข้อความนี้ค้างอยู่ แสดงว่ายังไม่ได้ตั้งค่า API Key หรือการเชื่อมต่อมีปัญหา.",
    example: "",
    source: "local"
  };
}

async function translateWord(body) {
  const word = String(body.word || "").slice(0, 40);
  
  // Try local first for speed
  const local = localTranslate(word);
  if (local && local.th !== "กำลังเรียก AI มาช่วยแปล...") return local;

  if (!isAiEnabled()) return local;

  return callAI([
    {
      role: "system",
      content: "Translate one English word or short phrase for a Thai CEFR learner. Return strict JSON with word, th, note, example, phonetics. 'phonetics' should be a simple pronunciation guide in Thai or IPA, e.g., 'apple' -> '/ˈæp.əl/ (แอ๊ปเปิ้ล)'."
    },
    {
      role: "user",
      content: word
    }
  ]);
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
    });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/stats") {
      sendJson(res, 200, {
        bankSize: lessonBank.length,
        aiEnabled: isAiEnabled(),
        provider: activeProvider()
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/lesson") {
      const body = await readBody(req);
      const lesson = isAiEnabled() ? await generateAiLesson(body) : pickLocalLesson(body);
      sendJson(res, 200, { lesson, aiEnabled: isAiEnabled(), provider: activeProvider(), bankSize: lessonBank.length });
      return;
    }

    if (req.method === "POST" && req.url === "/api/check") {
      const body = await readBody(req);
      const result = isAiEnabled()
        ? await checkAiAnswer(body)
        : scoreLocalAnswer(body.question || {}, body.userAnswer);
      sendJson(res, 200, { result, aiEnabled: isAiEnabled(), provider: activeProvider() });
      return;
    }

    if (req.method === "POST" && req.url === "/api/translate") {
      const body = await readBody(req);
      const translation = await translateWord(body);
      sendJson(res, 200, { translation, aiEnabled: isAiEnabled(), provider: activeProvider() });
      return;
    }

    if (req.method === "POST" && req.url === "/api/session-summary") {
      const body = await readBody(req);
      const summary = await summarizeSessionAi(body);
      sendJson(res, 200, { summary, aiEnabled: isAiEnabled(), provider: activeProvider() });
      return;
    }

    if (req.method === "GET") {
      await serveStatic(req, res);
      return;
    }

    res.writeHead(405);
    res.end("Method not allowed");
  } catch (error) {
    sendJson(res, 500, {
      error: "Something went wrong while preparing the lesson.",
      detail: error.message
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CEFR AI Coach is running at http://localhost:${PORT}`);
  console.log(`AI mode: ${activeProvider()}`);
  console.log(`Local question bank: ${lessonBank.length} scored items`);
});
