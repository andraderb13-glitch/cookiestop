import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from './db.js'
async function main() {
 const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
 if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12 || !ADMIN_NAME) throw new Error('Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (12+ caracteres) no .env')
 const hash = await bcrypt.hash(ADMIN_PASSWORD, 12)
 await db.execute("INSERT INTO users (name,email,password_hash,role,establishment_id) VALUES (?,?,?,'admin',NULL) ON DUPLICATE KEY UPDATE name=VALUES(name),password_hash=VALUES(password_hash),role='admin',establishment_id=NULL,active=1",[ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), hash])
 console.log('Administrador configurado:', ADMIN_EMAIL)
 await db.end()
}
main().catch(e => { console.error(e); process.exit(1) })
