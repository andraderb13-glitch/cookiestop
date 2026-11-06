import 'dotenv/config'
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { db } from './db.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Configure JWT_SECRET com no mínimo 32 caracteres')
const secret = process.env.JWT_SECRET
const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') || 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false }))
type Identity = { id: number; role: 'admin' | 'client'; establishmentId: number | null }
type AuthRequest = Request & { identity?: Identity }
function auth(req: AuthRequest, res: Response, next: NextFunction) {
 const token = /^Bearer (.+)$/.exec(req.header('authorization') || '')?.[1]
 if (!token) { res.status(401).json({ error: 'Faça login para continuar.' }); return }
 try { req.identity = jwt.verify(token, secret) as Identity; next() }
 catch { res.status(401).json({ error: 'Sessão inválida ou expirada.' }) }
}
function admin(req: AuthRequest, res: Response, next: NextFunction) {
 if (req.identity?.role !== 'admin') { res.status(403).json({ error: 'Acesso restrito à administração.' }); return }
 next()
}
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
app.post('/api/auth/login', async (req, res) => {
 const parsed = loginSchema.safeParse(req.body)
 if (!parsed.success) { res.status(400).json({ error: 'Informe e-mail e senha válidos.' }); return }
 const [rows] = await db.execute<RowDataPacket[]>('SELECT u.*, e.active AS establishment_active, e.name AS establishment_name FROM users u LEFT JOIN establishments e ON e.id=u.establishment_id WHERE u.email=? LIMIT 1',[parsed.data.email.toLowerCase()])
 const user = rows[0]
 if (!user || !user.active || (user.role === 'client' && !user.establishment_active) || !(await bcrypt.compare(parsed.data.password, user.password_hash))) { res.status(401).json({ error: 'Credenciais inválidas ou acesso desativado.' }); return }
 const identity: Identity = { id: user.id, role: user.role, establishmentId: user.establishment_id }
 const token = jwt.sign(identity, secret, { expiresIn: '8h' })
 res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, establishmentId: user.establishment_id, establishmentName: user.establishment_name || null } })
})
app.get('/api/auth/me', auth, async (req: AuthRequest,res) => {
 const [rows] = await db.execute<RowDataPacket[]>('SELECT u.id,u.name,u.email,u.role,u.active,u.establishment_id,e.name AS establishment_name,e.active AS establishment_active FROM users u LEFT JOIN establishments e ON e.id=u.establishment_id WHERE u.id=?',[req.identity!.id])
 const u = rows[0]
 if (!u || !u.active || (u.role === 'client' && !u.establishment_active)) { res.status(401).json({ error: 'Acesso desativado.' }); return }
 res.json({ user: { id:u.id,name:u.name,email:u.email,role:u.role,establishmentId:u.establishment_id,establishmentName:u.establishment_name || null } })
})
app.get('/api/admin/establishments', auth, admin, async (_req,res) => {
 const [rows] = await db.query<RowDataPacket[]>('SELECT e.id,e.name,e.segment,e.active,e.created_at,COUNT(u.id) AS users_count FROM establishments e LEFT JOIN users u ON u.establishment_id=e.id GROUP BY e.id ORDER BY e.id DESC')
 res.json(rows)
})
const createSchema = z.object({ name: z.string().trim().min(2).max(150), segment: z.enum(['confeitaria','restaurante','lancheria']), userName: z.string().trim().min(2).max(150), email: z.string().email().max(190), password: z.string().min(12).max(128) })
app.post('/api/admin/establishments', auth, admin, async (req,res) => {
 const parsed = createSchema.safeParse(req.body)
 if (!parsed.success) { res.status(400).json({ error: 'Confira os dados. A senha deve ter ao menos 12 caracteres.' }); return }
 const d = parsed.data
 const connection = await db.getConnection()
 try {
  await connection.beginTransaction()
  const [result] = await connection.execute<ResultSetHeader>('INSERT INTO establishments (name,segment) VALUES (?,?)',[d.name,d.segment])
  await connection.execute('INSERT INTO users (establishment_id,name,email,password_hash,role) VALUES (?,?,?,?,\'client\')',[result.insertId,d.userName,d.email.toLowerCase(),await bcrypt.hash(d.password,12)])
  await connection.execute('INSERT INTO establishment_data (establishment_id,payload) VALUES (?,?)',[result.insertId,JSON.stringify({ products:[],expenses:[],sales:[] })])
  await connection.commit()
  res.status(201).json({ id: result.insertId, name: d.name })
 } catch (err) { await connection.rollback(); throw err } finally { connection.release() }
})
app.patch('/api/admin/establishments/:id', auth, admin, async (req,res) => {
 const parsed = z.object({ name:z.string().trim().min(2).max(150).optional(), segment:z.enum(['confeitaria','restaurante','lancheria']).optional(), active:z.boolean().optional() }).strict().safeParse(req.body)
 if (!parsed.success || Object.keys(parsed.data).length===0) { res.status(400).json({error:'Dados inválidos.'}); return }
 const fields = Object.keys(parsed.data)
 const values = Object.values(parsed.data)
 const [result] = await db.execute<ResultSetHeader>(`UPDATE establishments SET ${fields.map(f=>`${f}=?`).join(',')} WHERE id=?`,[...values,req.params.id])
 if (!result.affectedRows) { res.status(404).json({error:'Estabelecimento não encontrado.'}); return }
 res.json({ok:true})
})
app.get('/api/state',auth,async(req:AuthRequest,res)=>{
 if (req.identity?.role !== 'client' || !req.identity.establishmentId) { res.status(403).json({error:'Acesso exclusivo do estabelecimento.'}); return }
 const [rows] = await db.execute<RowDataPacket[]>('SELECT d.payload,d.revision FROM establishment_data d JOIN establishments e ON e.id=d.establishment_id JOIN users u ON u.establishment_id=e.id WHERE d.establishment_id=? AND u.id=? AND u.active=1 AND e.active=1',[req.identity.establishmentId,req.identity.id])
 if (!rows.length) { res.status(403).json({error:'Estabelecimento indisponível.'}); return }
 res.json({ data:typeof rows[0].payload==='string'?JSON.parse(rows[0].payload):rows[0].payload, revision:rows[0].revision })
})
const product = z.object({id:z.string(),name:z.string(),category:z.string(),description:z.string(),cost:z.number().nonnegative(),price:z.number().nonnegative(),stock:z.number().int().nonnegative(),minStock:z.number().int().nonnegative(),active:z.boolean()})
const expense = z.object({id:z.string(),description:z.string(),category:z.string(),amount:z.number().nonnegative(),date:z.string(),recurring:z.boolean()})
const item = z.object({productId:z.string(),productName:z.string(),quantity:z.number().int().positive(),unitPrice:z.number().nonnegative(),unitCost:z.number().nonnegative()})
const sale = z.object({id:z.string(),date:z.string(),items:z.array(item),discount:z.number().nonnegative(),paymentMethod:z.string(),total:z.number().nonnegative()})
const stateSchema=z.object({ revision:z.number().int().nonnegative(),data:z.object({products:z.array(product).max(10000),expenses:z.array(expense).max(100000),sales:z.array(sale).max(100000)}) })
app.put('/api/state',auth,async(req:AuthRequest,res)=>{
 if (req.identity?.role!=='client' || !req.identity.establishmentId) {res.status(403).json({error:'Acesso negado.'});return}
 const parsed=stateSchema.safeParse(req.body)
 if (!parsed.success) {res.status(400).json({error:'Dados de gestão inválidos.'});return}
 const [result]=await db.execute<ResultSetHeader>('UPDATE establishment_data d JOIN establishments e ON e.id=d.establishment_id JOIN users u ON u.establishment_id=e.id SET d.payload=?,d.revision=d.revision+1 WHERE d.establishment_id=? AND d.revision=? AND e.active=1 AND u.id=? AND u.active=1',[JSON.stringify(parsed.data.data),req.identity.establishmentId,parsed.data.revision,req.identity.id])
 if (!result.affectedRows) {res.status(409).json({error:'Os dados foram alterados em outra sessão. Atualize a página para sincronizar.'});return}
 res.json({revision:parsed.data.revision+1})
})
app.get('/api/health',(_req,res)=>res.json({status:'ok'}))
app.use((err:unknown,_req:Request,res:Response,_next:NextFunction)=>{
 console.error(err)
 if (typeof err==='object' && err && 'code' in err && (err as {code:string}).code==='ER_DUP_ENTRY') {res.status(409).json({error:'Este e-mail já está cadastrado.'});return}
 res.status(500).json({error:'Erro interno no servidor.'})
})
app.listen(Number(process.env.PORT||3001),()=>console.log(`API Doce Gestão em http://localhost:${process.env.PORT||3001}`))
