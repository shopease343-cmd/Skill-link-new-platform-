import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const app=express()
const port=process.env.PORT||4000
const supabaseAdmin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}})

app.use(helmet())
app.use(cors({origin:process.env.CORS_ORIGIN?.split(',').map(x=>x.trim())||true}))
app.use(express.json({limit:'1mb'}))
app.use(rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}))

app.get('/api/health',(_req,res)=>res.json({ok:true,service:'skilllink-api'}))

async function auth(req,res,next){
  const header=req.headers.authorization||''
  const token=header.startsWith('Bearer ')?header.slice(7):null
  if(!token)return res.status(401).json({message:'Authentication required'})
  const {data,error}=await supabaseAdmin.auth.getUser(token)
  if(error||!data.user)return res.status(401).json({message:'Invalid or expired session'})
  req.user=data.user
  next()
}

async function profile(req,res,next){
  const {data,error}=await supabaseAdmin.from('profiles').select('id,full_name,role,status').eq('id',req.user.id).single()
  if(error||!data)return res.status(403).json({message:'Profile is not available'})
  if(data.status!=='active')return res.status(403).json({message:'Account is not active'})
  req.profile=data
  next()
}

app.get('/api/courses',async(_req,res)=>{
  const {data,error}=await supabaseAdmin.from('courses').select('id,title,slug,description,status,price,thumbnail_url').eq('status','published').order('created_at',{ascending:false})
  if(error)return res.status(500).json({message:'Unable to load courses'})
  res.json({courses:data||[]})
})

app.get('/api/me',auth,profile,(req,res)=>res.json({profile:req.profile,user:{id:req.user.id,email:req.user.email}}))

const courseSchema=z.object({title:z.string().trim().min(3).max(160),description:z.string().max(5000).optional(),price:z.number().min(0).max(10000000)})

app.post('/api/instructor/courses',auth,profile,async(req,res)=>{
  if(req.profile.role!=='instructor' && req.profile.role!=='ceo')return res.status(403).json({message:'Permission denied'})
  const parsed=courseSchema.safeParse(req.body)
  if(!parsed.success)return res.status(400).json({message:'Invalid course data',issues:parsed.error.issues})
  const slug=parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Date.now()
  const {data,error}=await supabaseAdmin.from('courses').insert({...parsed.data,slug,instructor_id:req.user.id,status:'draft'}).select().single()
  if(error)return res.status(400).json({message:'Course could not be created'})
  await supabaseAdmin.from('audit_logs').insert({actor_id:req.user.id,action:'course.created',entity_type:'course',entity_id:data.id,metadata:{status:'draft'}})
  res.status(201).json({course:data})
})

app.listen(port,()=>console.log(`SkillLink API listening on ${port}`))
