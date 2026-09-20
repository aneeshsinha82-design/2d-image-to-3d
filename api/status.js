export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const id=req.query?.id;
  if(!id) return res.status(400).json({error:'Missing task id'});
  try{
    const r=await fetch('https://api.meshy.ai/openapi/v1/image-to-3d/'+encodeURIComponent(id),{headers:{Authorization:`Bearer ${process.env.MESHY_API_KEY}`}});
    const text=await r.text(); let data; try{data=JSON.parse(text)}catch{data={error:text}};
    return res.status(r.status).json(data);
  }catch(e){return res.status(500).json({error:e.message||'Server error'})}
}